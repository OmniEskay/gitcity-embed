// Unit tests for the city SVG renderer
import { describe, it, expect } from 'vitest';
import { renderCitySVG } from '../../../src/renderers/city.js';
import type { GitHubMetrics } from '../../../src/types/metrics.js';
import type { CityRenderOptions } from '../../../src/types/options.js';

function makeMetrics(overrides: Partial<GitHubMetrics> = {}): GitHubMetrics {
  return {
    username: 'octocat',
    avatarUrl: 'https://example.com/avatar.png',
    repositories: 10,
    totalStars: 50,
    totalCommits: 200,
    pullRequests: 15,
    issues: 8,
    followers: 100,
    topRepoStars: 20,
    fetchedAt: Date.now(),
    ...overrides,
  };
}

const defaultOptions: CityRenderOptions = { theme: 'dark', width: 800, height: 400 };

describe('renderCitySVG', () => {
  it('output starts with <svg', () => {
    const svg = renderCitySVG(makeMetrics(), defaultOptions);
    expect(svg.trimStart()).toMatch(/^<svg/);
  });

  it('output is under 50KB', () => {
    const svg = renderCitySVG(makeMetrics({ repositories: 30, totalStars: 5000 }), defaultOptions);
    expect(Buffer.byteLength(svg, 'utf8')).toBeLessThan(50 * 1024);
  });

  it('contains no external URL references', () => {
    const svg = renderCitySVG(makeMetrics(), defaultOptions);
    expect(svg).not.toMatch(/href="http/);
    expect(svg).not.toMatch(/href='http/);
    expect(svg).not.toMatch(/src="http/);
  });

  it('contains no <script> tags', () => {
    const svg = renderCitySVG(makeMetrics(), defaultOptions);
    expect(svg.toLowerCase()).not.toContain('<script');
  });

  it('contains no <foreignObject> elements', () => {
    const svg = renderCitySVG(makeMetrics(), defaultOptions);
    expect(svg.toLowerCase()).not.toContain('<foreignobject');
  });

  it('handles user with 0 repos gracefully', () => {
    const svg = renderCitySVG(
      makeMetrics({ repositories: 0, totalStars: 0, topRepoStars: 0 }),
      defaultOptions
    );
    expect(svg).toContain('<svg');
    expect(Buffer.byteLength(svg, 'utf8')).toBeLessThan(50 * 1024);
  });

  it('caps buildings at 30 for large repo counts', () => {
    const svg = renderCitySVG(makeMetrics({ repositories: 1000 }), defaultOptions);
    // Should still be under 50KB (size guard triggers reduction)
    expect(Buffer.byteLength(svg, 'utf8')).toBeLessThan(50 * 1024);
  });

  it('dark theme uses dark background color', () => {
    const svg = renderCitySVG(makeMetrics(), { ...defaultOptions, theme: 'dark' });
    expect(svg).toContain('#0d1117');
  });

  it('light theme uses light background color', () => {
    const svg = renderCitySVG(makeMetrics(), { ...defaultOptions, theme: 'light' });
    expect(svg).toContain('#ffffff');
  });

  it('includes username in output', () => {
    const svg = renderCitySVG(makeMetrics({ username: 'torvalds' }), defaultOptions);
    expect(svg).toContain('torvalds');
  });

  it('closes the svg tag', () => {
    const svg = renderCitySVG(makeMetrics(), defaultOptions);
    expect(svg.trimEnd()).toMatch(/<\/svg>$/);
  });
});
