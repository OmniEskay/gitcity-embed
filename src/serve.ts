// Node.js server adapter — used for local dev and Docker deployments
import { serve } from '@hono/node-server';
import app from './index.js';

const port = parseInt(process.env['PORT'] ?? '3000', 10);

serve({ fetch: app.fetch, port }, () => {
  console.info(`GitCity Embed running on http://localhost:${port}`);
});
