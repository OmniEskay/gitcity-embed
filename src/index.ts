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

// Fail fast if token is missing
requireEnv('GITHUB_TOKEN');

// Initialize persistent cache
initSqliteCache();

const app = new Hono();

// Global middleware
app.use('/api/*', cacheHeadersMiddleware());
app.use('/api/*', rateLimitMiddleware());

// Routes
app.route('/api/city', cityRoute);
app.route('/api/card', cardRoute);
app.route('/api/badge', badgeRoute);
app.route('/api/leaderboard', leaderboardRoute);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

export default app;
