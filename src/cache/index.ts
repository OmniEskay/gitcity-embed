// Unified cache interface: L1 memory → L2 SQLite → fetch, with stale fallback
import type { GitHubMetrics } from '../types/metrics.js';
import { memoryCache } from './memory.js';
import { sqliteCache } from './sqlite.js';
import { fetchGitHubMetrics, GitHubUserNotFoundError, rateLimitLow } from '../services/github.js';
import { dedup } from '../utils/dedup.js';

export { initSqliteCache } from './sqlite.js';

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  githubEtag?: string;
}

export interface CacheStore {
  get(key: string): CacheEntry<string> | null;
  set(key: string, entry: CacheEntry<string>): void;
  getStale(key: string): CacheEntry<string> | null;
}

export type CacheStatus = 'HIT' | 'MISS' | 'STALE';

const BASE_TTL_MS = parseInt(process.env['EMBED_CACHE_TTL_MEMORY'] ?? '300', 10) * 1000;

function makeTTL(): number {
  return rateLimitLow ? BASE_TTL_MS * 2 : BASE_TTL_MS;
}

export async function getCachedOrFetch(username: string): Promise<{
  metrics: GitHubMetrics;
  cacheStatus: CacheStatus;
}> {
  const key = `metrics:${username.toLowerCase()}`;

  // L1: memory cache
  const memHit = memoryCache.get(key);
  if (memHit) {
    return { metrics: JSON.parse(memHit.data) as GitHubMetrics, cacheStatus: 'HIT' };
  }

  // L2: SQLite cache
  const dbHit = sqliteCache.get(key);
  if (dbHit) {
    // Promote to L1
    memoryCache.set(key, dbHit);
    return { metrics: JSON.parse(dbHit.data) as GitHubMetrics, cacheStatus: 'HIT' };
  }

  // Cache miss — fetch (deduplicated)
  try {
    const metrics = await dedup(key, () => fetchGitHubMetrics(username));
    const now = Date.now();
    const ttl = makeTTL();
    const entry: CacheEntry<string> = {
      data: JSON.stringify(metrics),
      cachedAt: now,
      expiresAt: now + ttl,
    };
    memoryCache.set(key, entry);
    sqliteCache.set(key, entry);
    return { metrics, cacheStatus: 'MISS' };
  } catch (err) {
    // Re-throw user-not-found without stale fallback
    if (err instanceof GitHubUserNotFoundError) throw err;

    // On any other error, try stale data
    const staleL1 = memoryCache.getStale(key);
    if (staleL1) {
      return { metrics: JSON.parse(staleL1.data) as GitHubMetrics, cacheStatus: 'STALE' };
    }
    const staleL2 = sqliteCache.getStale(key);
    if (staleL2) {
      return { metrics: JSON.parse(staleL2.data) as GitHubMetrics, cacheStatus: 'STALE' };
    }

    throw err;
  }
}
