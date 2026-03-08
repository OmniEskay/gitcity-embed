// Integration tests for GET /api/leaderboard
import { describe, it, expect, vi, afterAll } from 'vitest';
import { Hono } from 'hono';
import { leaderboardRoute } from '../../src/routes/leaderboard.js';

// Mock better-sqlite3 to avoid filesystem dependency in tests
vi.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnValue({
      all: vi.fn().mockReturnValue([
        {
          key: 'metrics:alice',
          data: JSON.stringify({
            username: 'alice', repositories: 50, totalStars: 500,
            totalCommits: 1000, pullRequests: 80, issues: 20,
            followers: 100, topRepoStars: 200, avatarUrl: '', fetchedAt: Date.now(),
          }),
        },
        {
          key: 'metrics:bob',
          data: JSON.stringify({
            username: 'bob', repositories: 10, totalStars: 50,
            totalCommits: 200, pullRequests: 5, issues: 2,
            followers: 10, topRepoStars: 20, avatarUrl: '', fetchedAt: Date.now(),
          }),
        },
      ]),
    }),
    close: vi.fn(),
  };
  return { default: vi.fn(() => mockDb) };
});

const app = new Hono();
app.route('/api/leaderboard', leaderboardRoute);

afterAll(() => vi.restoreAllMocks());

describe('GET /api/leaderboard', () => {
  it('returns 200 with JSON', async () => {
    const res = await app.request('/api/leaderboard');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('returns entries array', async () => {
    const res = await app.request('/api/leaderboard');
    const body = await res.json() as { entries: unknown[] };
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.entries.length).toBeGreaterThan(0);
  });

  it('default sort is by score descending', async () => {
    const res = await app.request('/api/leaderboard');
    const body = await res.json() as { entries: { score: number }[] };
    const scores = body.entries.map((e) => e.score);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[scores.length - 1] ?? 0);
  });

  it('respects limit param', async () => {
    const res = await app.request('/api/leaderboard?limit=1');
    const body = await res.json() as { entries: unknown[] };
    expect(body.entries.length).toBeLessThanOrEqual(1);
  });

  it('respects sort=stars param', async () => {
    const res = await app.request('/api/leaderboard?sort=stars');
    const body = await res.json() as { sort: string };
    expect(body.sort).toBe('stars');
  });
});
