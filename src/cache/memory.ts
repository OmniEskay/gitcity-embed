// LRU in-memory cache (Layer 1): fast, zero-infrastructure, stale-allowed
import { LRUCache } from 'lru-cache';
import type { CacheEntry } from './index.js';
import { optionalEnv } from '../utils/env.js';

const TTL_MS = parseInt(optionalEnv('EMBED_CACHE_TTL_MEMORY', '300'), 10) * 1000;

const lru = new LRUCache<string, CacheEntry<string>>({
  max: 500,
  ttl: TTL_MS,
  allowStale: true,
});

export const memoryCache = {
  get(key: string): CacheEntry<string> | null {
    const entry = lru.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) return null;
    return entry;
  },

  getStale(key: string): CacheEntry<string> | null {
    return lru.get(key, { allowStale: true }) ?? null;
  },

  set(key: string, entry: CacheEntry<string>): void {
    lru.set(key, entry, { ttl: entry.expiresAt - Date.now() });
  },
};
