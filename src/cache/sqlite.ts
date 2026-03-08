// SQLite persistent cache (Layer 2): survives restarts, 1-hour TTL
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { CacheEntry } from './index.js';
import { optionalEnv } from '../utils/env.js';

const TTL_MS = parseInt(optionalEnv('EMBED_CACHE_TTL_DISK', '3600'), 10) * 1000;
const DB_PATH = optionalEnv('CACHE_DB_PATH', './data/cache.db');

let db: Database.Database | null = null;

interface CacheRow {
  key: string;
  data: string;
  github_etag: string | null;
  cached_at: number;
  expires_at: number;
}

export function initSqliteCache(): void {
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

function getDb(): Database.Database {
  if (!db) throw new Error('SQLite cache not initialized — call initSqliteCache() first');
  return db;
}

export const sqliteCache = {
  get(key: string): CacheEntry<string> | null {
    const row = getDb()
      .prepare<[string, number], CacheRow>(
        'SELECT * FROM embed_cache WHERE key = ? AND expires_at > ?'
      )
      .get(key, Date.now());
    if (!row) return null;
    return {
      data: row.data,
      cachedAt: row.cached_at,
      expiresAt: row.expires_at,
      githubEtag: row.github_etag ?? undefined,
    };
  },

  getStale(key: string): CacheEntry<string> | null {
    const row = getDb()
      .prepare<[string], CacheRow>('SELECT * FROM embed_cache WHERE key = ?')
      .get(key);
    if (!row) return null;
    return {
      data: row.data,
      cachedAt: row.cached_at,
      expiresAt: row.expires_at,
      githubEtag: row.github_etag ?? undefined,
    };
  },

  set(key: string, entry: CacheEntry<string>): void {
    const ttl = TTL_MS;
    const expiresAt = Date.now() + ttl;
    getDb()
      .prepare(
        `INSERT INTO embed_cache (key, data, github_etag, cached_at, expires_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           data = excluded.data,
           github_etag = excluded.github_etag,
           cached_at = excluded.cached_at,
           expires_at = excluded.expires_at`
      )
      .run(key, entry.data, entry.githubEtag ?? null, entry.cachedAt, expiresAt);
  },
};
