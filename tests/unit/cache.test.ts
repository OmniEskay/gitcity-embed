// Unit tests for the two-layer cache (memory + SQLite)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memoryCache } from '../../src/cache/memory.js';
import type { CacheEntry } from '../../src/cache/index.js';

function makeEntry(data: string, ttlMs = 60_000): CacheEntry<string> {
  const now = Date.now();
  return { data, cachedAt: now, expiresAt: now + ttlMs };
}

beforeEach(() => {
  // Clear memory cache between tests by setting expired entries
  // (LRU cache doesn't expose a clear(), so we rely on test isolation via unique keys)
});

describe('memory cache', () => {
  it('returns null on cache miss', () => {
    expect(memoryCache.get('nonexistent-key-xyz')).toBeNull();
  });

  it('returns data on cache hit', () => {
    const key = `test:hit:${Date.now()}`;
    const entry = makeEntry('{"username":"octocat"}');
    memoryCache.set(key, entry);
    const hit = memoryCache.get(key);
    expect(hit).not.toBeNull();
    expect(hit?.data).toBe('{"username":"octocat"}');
  });

  it('returns null for expired entry via get()', () => {
    const key = `test:expired:${Date.now()}`;
    const entry = makeEntry('data', -1000); // already expired
    memoryCache.set(key, entry);
    expect(memoryCache.get(key)).toBeNull();
  });

  it('returns stale data via getStale()', () => {
    const key = `test:stale:${Date.now()}`;
    const entry = makeEntry('stale-data', 50_000);
    memoryCache.set(key, entry);
    const stale = memoryCache.getStale(key);
    expect(stale?.data).toBe('stale-data');
  });

  it('overwrites an existing entry', () => {
    const key = `test:overwrite:${Date.now()}`;
    memoryCache.set(key, makeEntry('first'));
    memoryCache.set(key, makeEntry('second'));
    expect(memoryCache.get(key)?.data).toBe('second');
  });
});
