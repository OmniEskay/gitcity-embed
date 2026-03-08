// Integration tests for GET /api/card/:username
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { cardRoute } from '../../src/routes/card.js';
import type { GitHubMetrics } from '../../src/types/metrics.js';

vi.mock('../../src/cache/index.js', () => ({
  getCachedOrFetch: vi.fn(),
  initSqliteCache: vi.fn(),
}));

const { getCachedOrFetch } = await import('../../src/cache/index.js');

const mockMetrics: GitHubMetrics = {
  username: 'octocat',
  avatarUrl: '',
  repositories: 5,
  totalStars: 42,
  totalCommits: 300,
  pullRequests: 10,
  issues: 3,
  followers: 50,
  topRepoStars: 20,
  fetchedAt: Date.now(),
};

const app = new Hono();
app.route('/api/card', cardRoute);

beforeAll(() => {
  vi.mocked(getCachedOrFetch).mockResolvedValue({ metrics: mockMetrics, cacheStatus: 'HIT' });
});

afterAll(() => vi.restoreAllMocks());

describe('GET /api/card/:username', () => {
  it('returns 200 with SVG', async () => {
    const res = await app.request('/api/card/octocat');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^<svg/);
  });

  it('returns correct content-type', async () => {
    const res = await app.request('/api/card/octocat');
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
  });

  it('returns 400 for invalid username', async () => {
    const res = await app.request('/api/card/trailing-');
    expect(res.status).toBe(400);
  });

  it('supports light theme query param', async () => {
    const res = await app.request('/api/card/octocat?theme=light');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('#ffffff');
  });

  it('returns 304 when ETag matches', async () => {
    const res1 = await app.request('/api/card/octocat');
    const etag = res1.headers.get('ETag');
    const res2 = await app.request('/api/card/octocat', {
      headers: { 'If-None-Match': etag! },
    });
    expect(res2.status).toBe(304);
  });

  it('returns 502 on GitHub API error', async () => {
    vi.mocked(getCachedOrFetch).mockRejectedValueOnce(new Error('API down'));
    const res = await app.request('/api/card/erroruser');
    expect(res.status).toBe(502);
    const body = await res.text();
    expect(body).toContain('GitHub API unavailable');
  });
});
