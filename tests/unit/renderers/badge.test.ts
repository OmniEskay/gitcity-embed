// Unit tests for the achievement badge SVG renderer
import { describe, it, expect } from 'vitest';
import { renderBadgeSVG, BADGE_DEFINITIONS } from '../../../src/renderers/badge.js';
import type { GitHubMetrics } from '../../../src/types/metrics.js';

function makeMetrics(overrides: Partial<GitHubMetrics> = {}): GitHubMetrics {
  return {
    username: 'octocat',
    avatarUrl: '',
    repositories: 0,
    totalStars: 0,
    totalCommits: 0,
    pullRequests: 0,
    issues: 0,
    followers: 0,
    topRepoStars: 0,
    fetchedAt: Date.now(),
    ...overrides,
  };
}

describe('renderBadgeSVG', () => {
  it('returns valid SVG with no badges earned', () => {
    const svg = renderBadgeSVG(makeMetrics(), 'dark');
    expect(svg).toContain('<svg');
    expect(svg).toContain('No badges earned yet');
  });

  it('renders architect badge when repos >= 50', () => {
    const svg = renderBadgeSVG(makeMetrics({ repositories: 50 }), 'dark');
    expect(svg).toContain('City Architect');
  });

  it('renders stargazer badge when totalStars >= 100', () => {
    const svg = renderBadgeSVG(makeMetrics({ totalStars: 100 }), 'dark');
    expect(svg).toContain('Stargazer');
  });

  it('renders committer badge when totalCommits >= 1000', () => {
    const svg = renderBadgeSVG(makeMetrics({ totalCommits: 1000 }), 'dark');
    expect(svg).toContain('Commit Machine');
  });

  it('renders bridger badge when pullRequests >= 50', () => {
    const svg = renderBadgeSVG(makeMetrics({ pullRequests: 50 }), 'dark');
    expect(svg).toContain('Bridge Builder');
  });

  it('renders hero badge when totalStars >= 500', () => {
    const svg = renderBadgeSVG(makeMetrics({ totalStars: 500 }), 'dark');
    expect(svg).toContain('Open Source Hero');
  });

  it('renders multiple badges for power users', () => {
    const svg = renderBadgeSVG(
      makeMetrics({ repositories: 60, totalStars: 600, totalCommits: 2000, pullRequests: 80 }),
      'dark'
    );
    expect(svg).toContain('City Architect');
    expect(svg).toContain('Stargazer');
    expect(svg).toContain('Commit Machine');
    expect(svg).toContain('Bridge Builder');
    expect(svg).toContain('Open Source Hero');
  });

  it('works in light theme', () => {
    const svg = renderBadgeSVG(makeMetrics({ totalStars: 100 }), 'light');
    expect(svg).toContain('<svg');
    expect(svg).not.toContain('#0d1117');
  });

  it('all badge conditions are defined and callable', () => {
    const metrics = makeMetrics();
    for (const def of BADGE_DEFINITIONS) {
      expect(() => def.condition(metrics)).not.toThrow();
    }
  });
});
