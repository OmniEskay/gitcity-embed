// GET /api/leaderboard — returns top users by score, sourced from the SQLite cache
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { toLeaderboardEntry, computeScore } from '../services/leaderboard.js';
import { optionalEnv } from '../utils/env.js';
import type { GitHubMetrics } from '../types/metrics.js';
import type { SortField } from '../services/leaderboard.js';

export const leaderboardRoute = new Hono();

const DB_PATH = optionalEnv('CACHE_DB_PATH', './data/cache.db');

const VALID_SORT_FIELDS = new Set<string>(['score', 'stars', 'commits', 'repos']);

interface CacheRow {
  key: string;
  data: string;
}

leaderboardRoute.get('/', (c) => {
  const limitParam = c.req.query('limit') ?? '20';
  const sortParam = (c.req.query('sort') ?? 'score') as string;

  const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
  const sort: SortField = VALID_SORT_FIELDS.has(sortParam) ? (sortParam as SortField) : 'score';

  let db: Database.Database;
  try {
    db = new Database(DB_PATH, { readonly: true });
  } catch {
    return c.json({ error: 'Leaderboard unavailable' }, 503);
  }

  let rows: CacheRow[];
  try {
    rows = db
      .prepare<[], CacheRow>("SELECT key, data FROM embed_cache WHERE key LIKE 'metrics:%'")
      .all();
  } finally {
    db.close();
  }

  const entries = rows
    .map((row) => {
      try {
        return toLeaderboardEntry(JSON.parse(row.data) as GitHubMetrics);
      } catch {
        return null;
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  // Sort
  entries.sort((a, b) => {
    if (sort === 'score') return b.score - a.score;
    if (sort === 'stars') return b.totalStars - a.totalStars;
    if (sort === 'commits') return b.totalCommits - a.totalCommits;
    if (sort === 'repos') return b.repositories - a.repositories;
    return b.score - a.score;
  });

  return c.json({
    sort,
    limit,
    total: entries.length,
    entries: entries.slice(0, limit),
  });
});

// Export score helper so tests can use it
export { computeScore };
