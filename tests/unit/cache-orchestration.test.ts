// Unit tests for cache orchestration layer
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedOrFetch } from '../../src/cache/index.js';
import { memoryCache } from '../../src/cache/memory.js';
import { sqliteCache } from '../../src/cache/sqlite.js';
import * as githubService from '../../src/services/github.js';

vi.mock('../../src/services/github.js', async () => {
  const actual = await vi.importActual('../../src/services/github.js');
  return {
    ...actual,
    fetchGitHubMetrics: vi.fn(),
    rateLimitLow: false,
  };
});

describe('getCachedOrFetch', () => {
  beforeEach(() => {
    memoryCache.get = vi.fn().mockReturnValue(null);
    memoryCache.set = vi.fn();
    memoryCache.getStale = vi.fn().mockReturnValue(null);
    sqliteCache.get = vi.fn().mockReturnValue(null);
    sqliteCache.set = vi.fn();
    sqliteCache.getStale = vi.fn().mockReturnValue(null);
    vi.clearAllMocks();
  });

  it('should return from L1 memory cache on hit', async () => {
    const mockEntry = {
      data: JSON.stringify({ username: 'test', stars: 100 }),
      cachedAt: Date.now(),
      expiresAt: Date.now() + 300000,
    };
    vi.mocked(memoryCache.get).mockReturnValue(mockEntry);

    const result = await getCachedOrFetch('test');

    expect(result.cacheStatus).toBe('HIT');
    expect(result.metrics.username).toBe('test');
    expect(sqliteCache.get).not.toHaveBeenCalled();
  });

  it('should return from L2 SQLite cache and promote to L1', async () => {
    const mockEntry = {
      data: JSON.stringify({ username: 'test2', stars: 200 }),
      cachedAt: Date.now(),
      expiresAt: Date.now() + 300000,
    };
    vi.mocked(sqliteCache.get).mockReturnValue(mockEntry);

    const result = await getCachedOrFetch('test2');

    expect(result.cacheStatus).toBe('HIT');
    expect(result.metrics.username).toBe('test2');
    expect(memoryCache.set).toHaveBeenCalledWith('metrics:test2', mockEntry);
  });

  it('should fetch on cache miss and store in both layers', async () => {
    const mockMetrics = { username: 'test3', stars: 300 };
    vi.mocked(githubService.fetchGitHubMetrics).mockResolvedValue(mockMetrics as any);

    const result = await getCachedOrFetch('test3');

    expect(result.cacheStatus).toBe('MISS');
    expect(result.metrics).toEqual(mockMetrics);
    expect(memoryCache.set).toHaveBeenCalled();
    expect(sqliteCache.set).toHaveBeenCalled();
  });

  it('should throw GitHubUserNotFoundError without stale fallback', async () => {
    vi.mocked(githubService.fetchGitHubMetrics).mockRejectedValue(
      new githubService.GitHubUserNotFoundError('notfound')
    );

    await expect(getCachedOrFetch('notfound')).rejects.toThrow(githubService.GitHubUserNotFoundError);
    expect(memoryCache.getStale).not.toHaveBeenCalled();
  });

  it('should return stale L1 data on fetch error', async () => {
    const staleEntry = {
      data: JSON.stringify({ username: 'stale', stars: 50 }),
      cachedAt: Date.now() - 600000,
      expiresAt: Date.now() - 300000,
    };
    vi.mocked(githubService.fetchGitHubMetrics).mockRejectedValue(new Error('API down'));
    vi.mocked(memoryCache.getStale).mockReturnValue(staleEntry);

    const result = await getCachedOrFetch('stale');

    expect(result.cacheStatus).toBe('STALE');
    expect(result.metrics.username).toBe('stale');
  });

  it('should return stale L2 data when L1 stale is unavailable', async () => {
    const staleEntry = {
      data: JSON.stringify({ username: 'stale2', stars: 60 }),
      cachedAt: Date.now() - 600000,
      expiresAt: Date.now() - 300000,
    };
    vi.mocked(githubService.fetchGitHubMetrics).mockRejectedValue(new Error('API down'));
    vi.mocked(sqliteCache.getStale).mockReturnValue(staleEntry);

    const result = await getCachedOrFetch('stale2');

    expect(result.cacheStatus).toBe('STALE');
    expect(result.metrics.username).toBe('stale2');
  });

  it('should throw error when no stale data available', async () => {
    vi.mocked(githubService.fetchGitHubMetrics).mockRejectedValue(new Error('API down'));

    await expect(getCachedOrFetch('nostale')).rejects.toThrow('API down');
  });
});
