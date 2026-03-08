// Unit tests for GitHub API client error handling and response mapping
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubUserNotFoundError, GitHubAPIError } from '../../src/services/github.js';

describe('GitHubUserNotFoundError', () => {
  it('is an instance of Error', () => {
    const err = new GitHubUserNotFoundError('nobody');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GitHubUserNotFoundError);
  });

  it('has correct name and message', () => {
    const err = new GitHubUserNotFoundError('nobody');
    expect(err.name).toBe('GitHubUserNotFoundError');
    expect(err.message).toContain('nobody');
  });
});

describe('GitHubAPIError', () => {
  it('stores statusCode', () => {
    const err = new GitHubAPIError('API failure', 502);
    expect(err.statusCode).toBe(502);
    expect(err.name).toBe('GitHubAPIError');
  });

  it('works without statusCode', () => {
    const err = new GitHubAPIError('Network error');
    expect(err.statusCode).toBeUndefined();
  });
});

describe('fetchGitHubMetrics', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_TOKEN', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws GitHubUserNotFoundError when user is null in response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => null },
      json: async () => ({ data: { user: null } }),
    }));

    const { fetchGitHubMetrics } = await import('../../src/services/github.js');
    await expect(fetchGitHubMetrics('ghost-user-xyz')).rejects.toBeInstanceOf(GitHubUserNotFoundError);

    vi.unstubAllGlobals();
  });

  it('throws GitHubAPIError on 500 response after retries', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 500,
      headers: { get: () => null },
      json: async () => ({}),
    }));

    const { fetchGitHubMetrics } = await import('../../src/services/github.js');
    await expect(fetchGitHubMetrics('anyuser')).rejects.toBeInstanceOf(GitHubAPIError);

    vi.unstubAllGlobals();
  }, 15_000);
});
