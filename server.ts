import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as dotenv from 'dotenv';

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

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proxyTarget: target });
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
