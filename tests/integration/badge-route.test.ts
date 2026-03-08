// Integration tests for GET /api/badge/:username
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { badgeRoute } from '../../src/routes/badge.js';
import type { GitHubMetrics } from '../../src/types/metrics.js';

vi.mock('../../src/cache/index.js', () => ({
  getCachedOrFetch: vi.fn(),
  initSqliteCache: vi.fn(),
}));

const { getCachedOrFetch } = await import('../../src/cache/index.js');

const mockMetrics: GitHubMetrics = {
  username: 'poweruser',
  avatarUrl: '',
  repositories: 60,
  totalStars: 600,
  totalCommits: 2000,
  pullRequests: 80,
  issues: 20,
  followers: 500,
  topRepoStars: 200,
  fetchedAt: Date.now(),
};

const app = new Hono();
app.route('/api/badge', badgeRoute);

beforeAll(() => {
  vi.mocked(getCachedOrFetch).mockResolvedValue({ metrics: mockMetrics, cacheStatus: 'HIT' });
});

afterAll(() => vi.restoreAllMocks());

describe('GET /api/badge/:username', () => {
  it('returns 200 with SVG', async () => {
    const res = await app.request('/api/badge/poweruser');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^<svg/);
  });

  it('returns correct content-type', async () => {
    const res = await app.request('/api/badge/poweruser');
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
  });

  it('returns 400 for invalid username', async () => {
    const res = await app.request('/api/badge/-bad');
    expect(res.status).toBe(400);
  });

  it('SVG contains earned badge labels', async () => {
    const res = await app.request('/api/badge/poweruser');
    const body = await res.text();
    expect(body).toContain('City Architect');
    expect(body).toContain('Open Source Hero');
  });

  it('returns 304 when ETag matches', async () => {
    const res1 = await app.request('/api/badge/poweruser');
    const etag = res1.headers.get('ETag');
    const res2 = await app.request('/api/badge/poweruser', {
      headers: { 'If-None-Match': etag! },
    });
    expect(res2.status).toBe(304);
  });

  it('returns 502 on GitHub API error', async () => {
    vi.mocked(getCachedOrFetch).mockRejectedValueOnce(new Error('API down'));
    const res = await app.request('/api/badge/erroruser');
    expect(res.status).toBe(502);
    const body = await res.text();
    expect(body).toContain('GitHub API unavailable');
  });
});
