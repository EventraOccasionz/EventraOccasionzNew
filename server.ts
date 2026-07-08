import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';

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

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proxyTarget: target });
  });

  // OTP Email sending API
  app.post('/api/send-email-otp', async (req, res) => {
    const { email, otp, mobile } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Missing email or otp in request body.' });
    }

    // Print OTP in console for easy development & testing bypass
    console.log(`\n=============================================`);
    console.log(`[SECURITY OTP GENERATED]`);
    console.log(`Target Email: ${email}`);
    if (mobile) {
      console.log(`Target Mobile: ${mobile}`);
    }
    console.log(`OTP Code:     ${otp}`);
    console.log(`=============================================\n`);

    const msg91AuthKey = process.env.MSG91_AUTHKEY;

    if (msg91AuthKey) {
      console.log(`[Email/SMS Service] MSG91_AUTHKEY found. Triggering MSG91 Campaign API for ${email}...`);
      try {
        const variablesPayload = {
          "global_otp:company_name": {
            "type": "text",
            "value": "Eventra Occasionz"
          },
          "global_otp:otp": {
            "type": "text",
            "value": otp
          },
          "company_name": {
            "type": "text",
            "value": "Eventra Occasionz"
          },
          "otp": {
            "type": "text",
            "value": otp
          },
          "name": {
            "type": "text",
            "value": "Eventra Occasionz"
          }
        };

        const recipient: any = {
          name: "Eventra Admin",
          email: email,
          variables: variablesPayload
        };

        if (mobile) {
          // Clean non-digits (keep numbers only)
          const cleanedMobile = mobile.replace(/\D/g, '');
          if (cleanedMobile.length >= 10) {
            recipient.mobiles = cleanedMobile;
          }
        }

        const msg91Payload = {
          data: {
            sendTo: [
              {
                to: [recipient],
                variables: variablesPayload
              }
            ],
            reply_to: [
              {
                name: "Eventra Occasionz",
                email: "eventraoccasionz@gmail.com"
              }
            ]
          }
        };

        const campaignSlug = process.env.MSG91_CAMPAIGN_SLUG || 'eventra-occasionz';
        const response = await fetch(`https://control.msg91.com/api/v5/campaign/api/campaigns/${campaignSlug}/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': msg91AuthKey.trim()
          },
          body: JSON.stringify(msg91Payload)
        });

        const textResponse = await response.text();
        console.log(`[MSG91 Response] Status: ${response.status}, Body: ${textResponse}`);

        if (!response.ok) {
          throw new Error(`MSG91 API responded with status ${response.status}: ${textResponse}`);
        }

        return res.json({
          success: true,
          previewUrl: '',
          otp: otp,
          message: 'OTP campaign triggered successfully via MSG91.'
        });
      } catch (msg91Err: any) {
        console.error('[MSG91 Service Error] Failed to send OTP via MSG91 campaign:', msg91Err);
        // Fallback to SMTP/Nodemailer if MSG91 fails
        console.log('[Email Service] Attempting fallback to SMTP transporter due to MSG91 failure...');
      }
    }

    try {
      let transporter;
      let usingTestAccount = false;
      let previewUrl = '';

      // Check if SMTP is configured in environment
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        console.log(`[Email Service] Using custom SMTP configuration: ${process.env.SMTP_HOST}`);
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
          },
        });
      } else {
        console.log('[Email Service] Custom SMTP not configured. Generating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        usingTestAccount = true;
        transporter = nodemailer.createTransport({
          host: (testAccount as any).smtp.host,
          port: (testAccount as any).smtp.port,
          secure: (testAccount as any).smtp.secure,
          auth: {
            user: (testAccount as any).user,
            pass: (testAccount as any).pass,
          },
        });
      }

      const info = await transporter.sendMail({
        from: '"The Heritage Venue Admin" <no-reply@theheritagevenue.com>',
        to: email,
        subject: '✦ Admin Security OTP Verification Code',
        text: `Your 2FA verification code is: ${otp}. This code is valid for 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #0d0d0d; color: #f3f4f6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #d4af37; font-family: serif; font-style: italic; font-size: 28px; margin: 0; letter-spacing: 1px;">THE HERITAGE</h2>
              <p style="color: #9ca3af; font-size: 9px; text-transform: uppercase; letter-spacing: 3px; margin: 4px 0 0 0;">Royal Wedding & Event Venue</p>
            </div>
            <hr style="border: 0; border-top: 1px solid rgba(212, 175, 55, 0.2); margin-bottom: 24px;" />
            <p style="font-size: 14px; line-height: 1.6; color: #e5e7eb;">Namaste Administrator,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #9ca3af;">A secure login attempt was initiated for your administrator account <strong style="color: #f3f4f6;">${email}</strong>.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; margin-bottom: 30px;">Please enter the following 6-digit One-Time Passcode (OTP) to complete your multi-factor verification:</p>
            
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 30px auto; color: #d4af37; font-family: monospace; background: rgba(212, 175, 55, 0.05); padding: 20px; border-radius: 12px; border: 1px dashed rgba(212, 175, 55, 0.4); max-width: 280px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
              ${otp}
            </div>
            
            <p style="color: #ef4444; font-size: 11px; text-align: center; margin-top: 24px;">This security code is strictly confidential and will expire in 5 minutes.</p>
            <p style="color: #9ca3af; font-size: 11px; text-align: center;">If you did not initiate this request, please secure your login credentials immediately.</p>
            
            <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 30px 0 20px 0;" />
            <p style="color: #6b7280; font-size: 9px; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Automated Security Notification • The Heritage Venue Portal</p>
          </div>
        `,
      });

      if (usingTestAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info) || '';
        console.log(`[Email Service] Test Email sent successfully! View message: ${previewUrl}`);
      } else {
        console.log(`[Email Service] Production Email sent successfully to ${email}. MessageId: ${info.messageId}`);
      }

      res.json({
        success: true,
        previewUrl,
        message: 'OTP verification email dispatched successfully.'
      });
    } catch (err: any) {
      console.error('[Email Service Error] Failed to send OTP email:', err);
      res.status(500).json({ error: 'Failed to send OTP verification email.', details: err.message });
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
