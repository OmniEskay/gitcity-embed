// Integration tests for GET /api/city/:username
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { cityRoute } from '../../src/routes/city.js';
import { cacheHeadersMiddleware } from '../../src/middleware/cache-headers.js';
import type { GitHubMetrics } from '../../src/types/metrics.js';

// Mock the cache layer to avoid SQLite in tests
vi.mock('../../src/cache/index.js', () => ({
  getCachedOrFetch: vi.fn(),
  initSqliteCache: vi.fn(),
}));

const { getCachedOrFetch } = await import('../../src/cache/index.js');

const mockMetrics: GitHubMetrics = {
  username: 'octocat',
  avatarUrl: '',
  repositories: 10,
  totalStars: 100,
  totalCommits: 500,
  pullRequests: 20,
  issues: 5,
  followers: 200,
  topRepoStars: 50,
  fetchedAt: Date.now(),
};

const app = new Hono();
app.use('/api/*', cacheHeadersMiddleware());
app.route('/api/city', cityRoute);

beforeAll(() => {
  vi.mocked(getCachedOrFetch).mockResolvedValue({
    metrics: mockMetrics,
    cacheStatus: 'MISS',
  });
});

afterAll(() => vi.restoreAllMocks());

describe('GET /api/city/:username', () => {
  it('returns 200 with SVG content-type', async () => {
    const res = await app.request('/api/city/octocat');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
  });

  it('response body starts with <svg', async () => {
    const res = await app.request('/api/city/octocat');
    const body = await res.text();
    expect(body.trimStart()).toMatch(/^<svg/);
  });

  it('returns ETag header', async () => {
    const res = await app.request('/api/city/octocat');
    expect(res.headers.get('etag')).toBeTruthy();
  });

  it('returns X-Cache header', async () => {
    const res = await app.request('/api/city/octocat');
    expect(res.headers.get('x-cache')).toMatch(/^(HIT|MISS|STALE)$/);
  });

  it('returns 304 when ETag matches', async () => {
    const first = await app.request('/api/city/octocat');
    const etag = first.headers.get('etag') ?? '';
    const second = await app.request('/api/city/octocat', {
      headers: { 'If-None-Match': etag },
    });
    expect(second.status).toBe(304);
  });

  it('returns 400 for invalid username', async () => {
    const res = await app.request('/api/city/-invalid');
    expect(res.status).toBe(400);
  });

  it('returns cache-control header', async () => {
    const res = await app.request('/api/city/octocat');
    expect(res.headers.get('cache-control')).toContain('max-age=43200');
  });
});
