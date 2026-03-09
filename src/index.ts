// Hono app entry point — mounts all routes and global middleware
import { Hono } from 'hono';
import { cityRoute } from './routes/city.js';
import { cardRoute } from './routes/card.js';
import { badgeRoute } from './routes/badge.js';
import { leaderboardRoute } from './routes/leaderboard.js';
import { cacheHeadersMiddleware } from './middleware/cache-headers.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { initSqliteCache } from './cache/index.js';
import { requireEnv } from './utils/env.js';

// Initialize persistent cache
initSqliteCache();

const app = new Hono();

// Global middleware
app.use('/api/*', cacheHeadersMiddleware());
app.use('/api/*', rateLimitMiddleware());

// Validate GITHUB_TOKEN on API requests rather than at module load,
// so missing env var returns a clear error instead of a 500 crash.
app.use('/api/*', async (c, next) => {
  try {
    requireEnv('GITHUB_TOKEN');
  } catch {
    return c.json({ error: 'Server misconfiguration: GITHUB_TOKEN is not set.' }, 500);
  }
  await next();
});

// Routes
app.route('/api/city', cityRoute);
app.route('/api/card', cardRoute);
app.route('/api/badge', badgeRoute);
app.route('/api/leaderboard', leaderboardRoute);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Root landing page
app.get('/', (c) =>
  c.html(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>GitCity Embed</title></head><body>
<h1>GitCity Embed</h1>
<p>SVG city visualization service for GitHub profiles.</p>
<ul>
  <li><a href="/api/city/:username">/api/city/:username</a> — skyline SVG</li>
  <li><a href="/api/card/:username">/api/card/:username</a> — stats card SVG</li>
  <li><a href="/api/badge/:username">/api/badge/:username</a> — badge SVG</li>
  <li><a href="/health">/health</a> — health check</li>
</ul>
</body></html>`
  )
);

// Suppress browser favicon requests gracefully
app.get('/favicon.ico', (c) => c.body(null, 204));

export default app;
