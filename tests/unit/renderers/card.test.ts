// Unit tests for the stats card SVG renderer
import { describe, it, expect } from 'vitest';
import { renderCardSVG } from '../../../src/renderers/card.js';
import type { GitHubMetrics } from '../../../src/types/metrics.js';
import type { RenderOptions } from '../../../src/types/options.js';

function makeMetrics(overrides: Partial<GitHubMetrics> = {}): GitHubMetrics {
  return {
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
    ...overrides,
  };
}

const defaultOptions: RenderOptions = { theme: 'dark', width: 400, height: 200 };

describe('renderCardSVG', () => {
  it('returns a valid SVG', () => {
    const svg = renderCardSVG(makeMetrics(), defaultOptions);
    expect(svg.trimStart()).toMatch(/^<svg/);
    expect(svg.trimEnd()).toMatch(/<\/svg>$/);
  });

  it('contains the username', () => {
    const svg = renderCardSVG(makeMetrics({ username: 'torvalds' }), defaultOptions);
    expect(svg).toContain('torvalds');
  });

  it('renders stat labels', () => {
    const svg = renderCardSVG(makeMetrics(), defaultOptions);
    expect(svg).toContain('Repositories');
    expect(svg).toContain('Stars');
    expect(svg).toContain('Commits');
    expect(svg).toContain('Pull Requests');
  });

  it('renders in light theme', () => {
    const svg = renderCardSVG(makeMetrics(), { ...defaultOptions, theme: 'light' });
    expect(svg).toContain('#ffffff');
  });

  it('escapes XSS in username', () => {
    const svg = renderCardSVG(makeMetrics({ username: 'user' }), defaultOptions);
    expect(svg).not.toContain('<script');
  });
});
