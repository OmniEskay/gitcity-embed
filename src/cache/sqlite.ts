// SQLite persistent cache (Layer 2): survives restarts, 1-hour TTL
// better-sqlite3 is loaded lazily via createRequire so that Vercel's bundler
// never statically imports the native addon (which isn't supported serverless).
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { CacheEntry } from './index.js';
import { optionalEnv } from '../utils/env.js';

const IS_VERCEL = !!process.env['VERCEL'];
const TTL_MS = parseInt(optionalEnv('EMBED_CACHE_TTL_DISK', '3600'), 10) * 1000;
const DB_PATH = optionalEnv('CACHE_DB_PATH', './data/cache.db');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;

interface CacheRow {
  key: string;
  data: string;
  github_etag: string | null;
  cached_at: number;
  expires_at: number;
}

export function initSqliteCache(): void {
  if (IS_VERCEL) return; // Native addons + persistent fs not available serverless

  const _require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Database = _require('better-sqlite3') as any;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS embed_cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      github_etag TEXT,
      cached_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_expires ON embed_cache(expires_at);
  `);

  // Prune expired rows every 10 minutes
  setInterval(() => {
    db?.prepare('DELETE FROM embed_cache WHERE expires_at < ?').run(Date.now());
  }, 10 * 60 * 1000).unref();
}

export const sqliteCache = {
  get(key: string): CacheEntry<string> | null {
    if (!db) return null;
    const row = db
      .prepare('SELECT * FROM embed_cache WHERE key = ? AND expires_at > ?')
      .get(key, Date.now()) as CacheRow | undefined;
    if (!row) return null;
    return {
      data: row.data,
      cachedAt: row.cached_at,
      expiresAt: row.expires_at,
      githubEtag: row.github_etag ?? undefined,
    };
  },

  getStale(key: string): CacheEntry<string> | null {
    if (!db) return null;
    const row = db
      .prepare('SELECT * FROM embed_cache WHERE key = ?')
      .get(key) as CacheRow | undefined;
    if (!row) return null;
    return {
      data: row.data,
      cachedAt: row.cached_at,
      expiresAt: row.expires_at,
      githubEtag: row.github_etag ?? undefined,
    };
  },

  set(key: string, entry: CacheEntry<string>): void {
    if (!db) return;
    const expiresAt = Date.now() + TTL_MS;
    db.prepare(
      `INSERT INTO embed_cache (key, data, github_etag, cached_at, expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         data = excluded.data,
         github_etag = excluded.github_etag,
         cached_at = excluded.cached_at,
         expires_at = excluded.expires_at`
    ).run(key, entry.data, entry.githubEtag ?? null, entry.cachedAt, expiresAt);
  },
};
