import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initDb } from './db/index.js';
import { rateLimit } from './api/middleware/rate-limit.js';
import { handleRedirect, handlePreview } from './handlers/redirect-handler.js';
import apiV1Routes from './api/v1/routes.js';

initDb();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', rateLimit, apiV1Routes);

app.get('/preview/:code', handlePreview);
app.get('/:code', handleRedirect);

app.get('/not-found', (_, res) => {
  res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:system-ui;text-align:center;padding:50px;"><h1>Link Not Found</h1></body></html>`);
});

app.get('/expired', (_, res) => {
  res.status(410).send(`<!DOCTYPE html><html><head><title>Expired</title></head><body style="font-family:system-ui;text-align:center;padding:50px;"><h1>Link Expired</h1></body></html>`);
});

app.get('/paused', (_, res) => {
  res.status(503).send(`<!DOCTYPE html><html><head><title>Paused</title></head><body style="font-family:system-ui;text-align:center;padding:50px;"><h1>Link Paused</h1></body></html>`);
});

app.get('/geo-blocked', (_, res) => {
  res.status(403).send(`<!DOCTYPE html><html><head><title>Blocked</title></head><body style="font-family:system-ui;text-align:center;padding:50px;"><h1>Access Restricted</h1></body></html>`);
});

app.use((_, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
