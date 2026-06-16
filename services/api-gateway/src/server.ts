import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from 'morgan';
import path from 'path';

const rootEnvPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

const app = express();
const DESIRED_PORT = Number(process.env.GATEWAY_PORT || 3000);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

const BACKEND_PORT = (() => {
  try {
    const url = new URL(BACKEND_URL);
    const port = Number(url.port);
    return Number.isFinite(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
})();

// Trust the proxy (e.g. Nginx, Load Balancer) so rate limits use correct client IP
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS: allow the SPA
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Rate limit to protect gateway
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3000 });
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', gateway: true, backend: BACKEND_URL });
});

// Proxies: forward to current backend
const proxyOptions = {
  target: BACKEND_URL,
  changeOrigin: true,
  xfwd: true,
  pathRewrite: (path: string) => path, // keep /api/... as-is
  onProxyRes: function (proxyRes: any, req: any, res: any) {
    if (req.url?.includes('/stream')) {
      proxyRes.headers['Cache-Control'] = 'no-cache';
      proxyRes.headers['Connection'] = 'keep-alive';
    }
  },
};

app.use('/api/products', createProxyMiddleware(proxyOptions));
app.use('/api/collections', createProxyMiddleware(proxyOptions));
app.use('/api/users', createProxyMiddleware(proxyOptions));
app.use('/api/admin', createProxyMiddleware(proxyOptions));
app.use('/api/settings', createProxyMiddleware(proxyOptions));
app.use('/api/payments', createProxyMiddleware({ ...proxyOptions, timeout: 0 }));
app.use('/uploads', createProxyMiddleware(proxyOptions));

// Fallback 404
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Gateway route not found' });
});

const startServer = (port: number, attemptsRemaining = 10) => {
  const server = app.listen(port, () => {
    console.log(`🛡️  API Gateway running on port ${port}`);
    console.log(`↔️  Proxying to backend at ${BACKEND_URL}`);
    console.log(`🌐 CORS allowed origin: ${FRONTEND_URL}`);
  });

  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE' && attemptsRemaining > 0) {
      server.close();
      let nextPort = port + 1;
      if (BACKEND_PORT && nextPort === BACKEND_PORT) nextPort += 1;
      startServer(nextPort, attemptsRemaining - 1);
      return;
    }

    throw err;
  });
};

startServer(DESIRED_PORT);

export default app;
// Trigger restart again
