import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});
import QRCode from 'qrcode';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables from .env
dotenv.config();

const rawTarget = process.env.VITE_SUPABASE_URL || '';
const target = rawTarget.replace(/^["']|["']$/g, '').trim().replace(/\/+$/, '');

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (!target) {
    console.error('[Proxy Error] VITE_SUPABASE_URL is missing from environment. Proxy cannot function.');
  } else {
    console.log(`[Proxy] Initializing reverse proxy pointing to target: ${target}`);
  }

  // Set up Supabase Proxy to bypass iframe CORS / sandbox constraints
  // We apply the proxy at the root level using the pathFilter option. This ensures Express
  // does not strip the matched path prefixes (such as '/auth/v1'), preserving the absolute route format.
  const proxyFilter = (pathname: string, req: any) => {
    const isMatched = pathname.startsWith('/rest/') || pathname.startsWith('/auth/') || pathname.startsWith('/storage/');
    if (isMatched) {
      console.log(`[Proxy Filter] Match found for path: "${pathname}"`);
    }
    return isMatched;
  };

  const shouldLog = (url: string): boolean => {
    const lowercaseUrl = url.toLowerCase();
    const ignoredExtensions = ['.tsx', '.ts', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.json', '.ico', '.gif', '.webp', '.map'];
    const ignoredPatterns = ['/node_modules/', '/@vite/', '/@id/', '/@fs/'];
    
    if (ignoredExtensions.some(ext => lowercaseUrl.includes(ext))) {
      return false;
    }
    if (ignoredPatterns.some(pat => lowercaseUrl.includes(pat))) {
      return false;
    }
    return true;
  };

  app.use((req, res, next) => {
    if (shouldLog(req.url)) {
      console.log(`[Server Request] ${req.method} ${req.url}`);
    }
    next();
  });

  if (target) {
    app.use(
      createProxyMiddleware({
        target,
        changeOrigin: true,
        secure: false,
        pathFilter: proxyFilter,
        onProxyReq: (proxyReq: any, req: any) => {
          console.log(`[Proxy Requesting] ${req.method} ${req.url} -> ${target}`);
          // Enforce the correct Host header for Supabase to resolve the project properly
          try {
            const host = new URL(target).host;
            proxyReq.setHeader('Host', host);
            console.log(`[Proxy Header] Set Host header to ${host}`);
          } catch (e: any) {
            console.error(`[Proxy Header Error] Invalid target URL "${target}":`, e.message);
          }
        },
        onProxyRes: (proxyRes: any, req: any) => {
          console.log(`[Proxy Response] Received ${proxyRes.statusCode} for ${req.method} ${req.url}. Content-Type: ${proxyRes.headers['content-type']}`);
        },
        onError: (err: any, req: any, res: any) => {
          console.error(`[Proxy Error] Error proxying ${req.method} ${req.originalUrl}:`, err);
          res.status(502).json({ error: 'Supabase proxy failed', details: err.message });
        }
      } as any)
    );
  } else {
    console.log('[Proxy] VITE_SUPABASE_URL not configured. Skipping proxy middleware configuration.');
  }

  // Support JSON bodies for custom endpoints
  app.use(express.json());

  // Lazy initialization for Gemini AI
  let genAI: GoogleGenAI | null = null;
  const getGenAI = () => {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured in environment variables');
      }
      genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return genAI;
  };

  // Initialize server-side Firebase Admin SDK using the workspace JSON config
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let db: any;

  if (fs.existsSync(firebaseConfigPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const firestore = (firebaseConfig as any).firestoreDatabaseId
        ? initializeFirestore(firebaseApp, { localCache: undefined }, (firebaseConfig as any).firestoreDatabaseId)
        : initializeFirestore(firebaseApp, { localCache: undefined });
      
      db = {
        collection: (name: string) => ({
          doc: (id: string) => ({
            get: async () => {
              const snap = await getDocFromServer(doc(firestore, name, id));
              return { exists: snap.exists(), data: () => snap.data() };
            },
            set: (data: any, options?: any) => setDoc(doc(firestore, name, id), data, options),
            delete: () => deleteDoc(doc(firestore, name, id)),
            update: (data: any) => updateDoc(doc(firestore, name, id), data)
          })
        })
      };
      console.log(`[Server Firebase] Initialized Client Firestore with No Cache successfully.`);
    } catch (err: any) {
      console.error(`[Server Firebase] Initialization error:`, err.message);
    }
  } else {
    console.warn(`[Server Firebase] firebase-applet-config.json not found.`);
  }

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proxyTarget: target });
  });

  // 1. Get 2FA Status for an admin
  app.get('/api/2fa/status', async (req, res) => {
    const uid = req.query.uid as string;
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid in request query parameters.' });
    }

    try {
      if (!db) throw new Error('Firestore is not initialized on the server.');
      
      const docSnap = await db.collection('admin_2fa').doc(uid).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        return res.json({ enabled: !!data.enabled });
      }
      return res.json({ enabled: false });
    } catch (err: any) {
      console.error('[2FA Status Error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve 2FA status.', details: err.message });
    }
  });

  // 2. Initiate 2FA Setup (Generate Secret, Recovery Codes, and QR Code)
  app.post('/api/2fa/setup-initiate', async (req, res) => {
    const { uid, email } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing uid or email in request body.' });
    }

    try {
      if (!db) throw new Error('Firestore is not initialized on the server.');

      const secret = totp.generateSecret();
      const otpauth = totp.toURI({ 
        secret, 
        label: email, 
        issuer: 'Eventra Occasionz' 
      });
      console.log(`[2FA Setup] Generated OTPAuth URI: ${otpauth.substring(0, 20)}...`);
      const qrCodeUrl = await QRCode.toDataURL(otpauth);
      console.log(`[2FA Setup] QR Code generated, length: ${qrCodeUrl?.length || 0}`);

      // Generate 10 uppercase, 8-character alphanumeric recovery codes
      const recoveryCodes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        recoveryCodes.push(randomCode);
      }

      // Save as pending configuration
      await db.collection('admin_2fa_pending').doc(uid).set({
        secret,
        recoveryCodes,
        email,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes validity
      });

      return res.json({
        qrCodeUrl,
        recoveryCodes
      });
    } catch (err: any) {
      console.error('[2FA Setup Initiate Error]:', err);
      return res.status(500).json({ error: 'Failed to initiate 2FA setup.', details: err.message });
    }
  });

  // 3. Verify and Save 2FA Setup
  app.post('/api/2fa/setup-verify', async (req, res) => {
    const { uid, code } = req.body;
    if (!uid || !code) {
      return res.status(400).json({ error: 'Missing uid or code in request body.' });
    }

    try {
      if (!db) throw new Error('Firestore is not initialized on the server.');

      const pendingDocRef = db.collection('admin_2fa_pending').doc(uid);
      const pendingSnap = await pendingDocRef.get();

      if (!pendingSnap.exists) {
        return res.status(400).json({ error: 'Verification session expired or not found. Please regenerate the QR code.' });
      }

      const pendingData = pendingSnap.data();
      if (Date.now() > pendingData.expiresAt) {
        await pendingDocRef.delete();
        return res.status(400).json({ error: 'Verification session expired. Please restart 2FA setup.' });
      }

      const verifyResult = await totp.verify(code.trim(), { secret: pendingData.secret, epochTolerance: 1 });
      const isValid = verifyResult.valid;
      if (!isValid) {
        return res.status(400).json({ error: 'Incorrect 6-digit Google Authenticator code. Please try again.' });
      }

      // 2FA setup successfully verified! Save to permanent storage
      await db.collection('admin_2fa').doc(uid).set({
        secret: pendingData.secret,
        recoveryCodes: pendingData.recoveryCodes,
        email: pendingData.email,
        enabled: true,
        updatedAt: new Date().toISOString()
      });

      // Clear the pending document
      await pendingDocRef.delete();

      return res.json({ success: true });
    } catch (err: any) {
      console.error('[2FA Setup Verify Error]:', err);
      return res.status(500).json({ error: 'Failed to verify 2FA setup.', details: err.message });
    }
  });

  // 4. Verify 2FA Login (TOTP code or Recovery code)
  app.post('/api/2fa/verify-login', async (req, res) => {
    const { uid, code } = req.body;
    if (!uid || !code) {
      return res.status(400).json({ error: 'Missing uid or code in request body.' });
    }

    try {
      if (!db) throw new Error('Firestore is not initialized on the server.');

      const activeDocRef = db.collection('admin_2fa').doc(uid);
      const activeSnap = await activeDocRef.get();

      if (!activeSnap.exists || !activeSnap.data().enabled) {
        return res.status(400).json({ error: 'Two-factor authentication is not enabled for this account.' });
      }

      const activeData = activeSnap.data();
      const codeClean = code.trim();

      // Check if it's a 6-digit TOTP code
      if (/^\d{6}$/.test(codeClean)) {
        const verifyResult = await totp.verify(codeClean, { secret: activeData.secret, epochTolerance: 1 });
        const isValid = verifyResult.valid;
        if (isValid) {
          return res.json({ success: true, isRecovery: false });
        }
      }

      // If not matching or not a 6-digit number, check if it matches an active recovery code
      const codeUpper = codeClean.toUpperCase();
      if (Array.isArray(activeData.recoveryCodes) && activeData.recoveryCodes.includes(codeUpper)) {
        // One-time recovery code matches! Remove it from the list
        const updatedCodes = activeData.recoveryCodes.filter((rc: string) => rc !== codeUpper);
        await activeDocRef.set({ recoveryCodes: updatedCodes }, { merge: true });

        console.log(`[2FA Security] Admin used recovery code. ${updatedCodes.length} codes remaining.`);
        return res.json({ 
          success: true, 
          isRecovery: true, 
          message: 'One-time recovery code accepted. This code is now deactivated.',
          remaining: updatedCodes.length 
        });
      }

      return res.status(400).json({ error: 'Invalid Google Authenticator code or recovery code. Please try again.' });
    } catch (err: any) {
      console.error('[2FA Verify Login Error]:', err);
      return res.status(500).json({ error: 'Failed to verify 2FA code.', details: err.message });
    }
  });

  // 5. Disable 2FA
  app.post('/api/2fa/disable', async (req, res) => {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid in request body.' });
    }

    try {
      if (!db) throw new Error('Firestore is not initialized on the server.');

      // We delete the document to completely wipe the secret, which is great for security!
      await db.collection('admin_2fa').doc(uid).delete();
      
      console.log(`[2FA Security] Disabled 2FA for admin user: ${uid}`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[2FA Disable Error]:', err);
      return res.status(500).json({ error: 'Failed to disable 2FA.', details: err.message });
    }
  });

  // AI Wedding Planner Recommendations
  app.post('/api/planner/recommendations', async (req, res) => {
    const { weddingData } = req.body;
    if (!weddingData) {
      return res.status(400).json({ error: 'Missing weddingData in request body.' });
    }

    try {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `As an expert luxury wedding planner at Eventra Occasionz, provide 8-10 personalized recommendations for a ${weddingData.style} ${weddingData.eventType} in ${weddingData.city}. 
        Details:
        - Guest Count: ${weddingData.guestCount}
        - Functions: ${weddingData.functions}
        - Services: ${weddingData.services.join(', ')}
        - Hotel: ${weddingData.hotelRequirement}
        - Catering: ${weddingData.cateringPreference}
        - Decoration: ${weddingData.decorationPreference}
        - Photography: ${weddingData.photographyPreference}
        - Timeline: ${weddingData.timeline}
        
        Provide the response in JSON format matching this schema:
        Array<{ title: string, content: string, category: 'Tip' | 'Idea' | 'Saving' | 'Upgrade' | 'Season' | 'Vendor' }>`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Tip', 'Idea', 'Saving', 'Upgrade', 'Season', 'Vendor'] }
              },
              required: ["title", "content", "category"]
            }
          }
        }
      });

      const recommendations = JSON.parse(response.text);
      return res.json(recommendations);
    } catch (err: any) {
      console.error('[Gemini Recommendations Error]:', err);
      // Fallback recommendations if Gemini fails
      return res.json([
        { title: 'Personalized Consultation', content: 'Book a free consultation with our experts for detailed planning.', category: 'Tip' },
        { title: 'Venue Selection', content: 'Start looking at venues at least 6 months in advance for your desired dates.', category: 'Vendor' },
        { title: 'Guest List', content: 'Finalize your guest list early to manage catering and accommodation costs better.', category: 'Saving' }
      ]);
    }
  });

  // Vite middleware or build serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Failed]', err);
});
