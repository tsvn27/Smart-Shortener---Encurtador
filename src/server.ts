import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { connectDB, disconnectDB } from './db/index.js';
import { generalLimiter, redirectLimiter } from './lib/rate-limiter.js';
import { logger } from './lib/logger.js';
import { securityMiddleware, securityHeaders, getClientIP } from './lib/security.js';
import { handleRedirect, handlePreview } from './handlers/redirect-handler.js';
import apiV1Routes from './api/v1/routes.js';
import docsRoutes from './api/docs/openapi.js';

const app = express();
const PORT = process.env.PORT || 3002;
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

app.use(securityHeaders);
app.use(compression());

app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret-change-in-production'));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.set('trust proxy', 1);

app.use(securityMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const ip = getClientIP(req);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip,
      userAgent: req.headers['user-agent']?.slice(0, 100),
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request failed', logData);
    } else if (duration > 1000) {
      logger.warn('Slow request', logData);
    }
  });
  next();
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', generalLimiter, apiV1Routes);
app.use('/api/docs', docsRoutes);

app.get('/preview/:code', redirectLimiter, handlePreview);
app.get('/:code', redirectLimiter, handleRedirect);

app.get('/not-found', (_, res) => {
  res.status(404).send(`<!DOCTYPE html><html><head><title>Link não encontrado</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0b;color:#fafafa;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{text-align:center;padding:40px}h1{font-size:2rem;margin-bottom:1rem}p{color:#888;margin-bottom:2rem}a{color:#6366f1;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><div class="container"><h1>Link não encontrado</h1><p>O link que você está procurando não existe ou foi removido.</p><a href="/">Voltar ao início</a></div></body></html>`);
});

app.get('/expired', (_, res) => {
  res.status(410).send(`<!DOCTYPE html><html><head><title>Link expirado</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0b;color:#fafafa;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{text-align:center;padding:40px}h1{font-size:2rem;margin-bottom:1rem}p{color:#888;margin-bottom:2rem}a{color:#6366f1;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><div class="container"><h1>Link expirado</h1><p>Este link não está mais disponível.</p><a href="/">Voltar ao início</a></div></body></html>`);
});

app.get('/paused', (_, res) => {
  res.status(503).send(`<!DOCTYPE html><html><head><title>Link pausado</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0b;color:#fafafa;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{text-align:center;padding:40px}h1{font-size:2rem;margin-bottom:1rem}p{color:#888;margin-bottom:2rem}a{color:#6366f1;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><div class="container"><h1>Link pausado</h1><p>Este link está temporariamente indisponível.</p><a href="/">Voltar ao início</a></div></body></html>`);
});

app.get('/geo-blocked', (_, res) => {
  res.status(403).send(`<!DOCTYPE html><html><head><title>Acesso restrito</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0b;color:#fafafa;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{text-align:center;padding:40px}h1{font-size:2rem;margin-bottom:1rem}p{color:#888;margin-bottom:2rem}a{color:#6366f1;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><div class="container"><h1>Acesso restrito</h1><p>Este link não está disponível na sua região.</p><a href="/">Voltar ao início</a></div></body></html>`);
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const ip = getClientIP(req);
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path, ip });
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origem não permitida' });
  }
  
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.use((_, res) => {
  res.status(404).json({ error: 'Não encontrado' });
});

async function startServer() {
  await connectDB();
  
  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const shutdown = async () => {
    logger.info('Shutting down gracefully');
    server.close(async () => {
      await disconnectDB();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

startServer();
