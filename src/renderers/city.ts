// Full skyline SVG renderer — generates a complete city visualization from GitHub metrics
import type { GitHubMetrics } from '../types/metrics.js';
import type { CityRenderOptions } from '../types/options.js';
import { themes } from './shared/palette.js';
import { building, skyscraper, road, bridge, crane, star } from './shared/shapes.js';
import { computeLayout } from './shared/layout.js';
import { escapeSvgText, svgText } from './shared/text.js';

const MAX_SIZE_BYTES = 50 * 1024;

export function renderCitySVG(metrics: GitHubMetrics, options: CityRenderOptions): string {
  const { width, height, theme } = options;
  const p = themes[theme];
  const layout = computeLayout(metrics, options);

  const parts: string[] = [];

  // Sky gradient
  parts.push(`<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${p.sky}"/>
    <stop offset="100%" stop-color="${p.skyGradientEnd}"/>
  </linearGradient>
</defs>`);

  // Background
  parts.push(`<rect width="${width}" height="${height}" fill="url(#sky)"/>`);

  // Stars in sky (dark theme only)
  if (theme === 'dark') {
    const groundY = height - 60;
    // Use seeded positions for deterministic output
    let h = 0;
    for (let i = 0; i < metrics.username.length; i++) {
      h = (Math.imul(31, h) + metrics.username.charCodeAt(i)) | 0;
    }
    const numStars = 30;
    for (let i = 0; i < numStars; i++) {
      h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
      const sx = ((h >>> 0) / 0xffffffff) * width;
      h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
      const sy = ((h >>> 0) / 0xffffffff) * (groundY - 20);
      parts.push(star(sx, sy, 1.5, '#e6edf3'));
    }
  }

  // Buildings and skyscrapers
  for (const b of layout.buildings) {
    if (b.isSkyscraper) {
      parts.push(skyscraper(b.x, b.y, b.w, b.h, b.color, p.window, p.windowLit));
    } else {
      parts.push(building(b.x, b.y, b.w, b.h, b.color, p.window, p.windowLit, 0.35));
    }
  }

  // Bridges
  for (const br of layout.bridges) {
    parts.push(bridge(br.x1, br.x2, br.y, p.accent));
  }

  // Cranes
  for (const cr of layout.cranes) {
    parts.push(crane(cr.x, cr.y, p.textMuted));
  }

  // Roads
  for (const r of layout.roads) {
    parts.push(road(r.y, width, p.road, p.roadLine));
  }

  // Ground strip
  parts.push(`<rect x="0" y="${height - 40}" width="${width}" height="40" fill="${p.ground}"/>`);

  // Username label
  parts.push(svgText(12, height - 14, `@${metrics.username}`, {
    fontSize: 13,
    fontWeight: 'bold',
    fill: p.text,
  }));

  // Stats label
  const statsLabel = `${metrics.repositories} repos · ${metrics.totalStars} stars · ${metrics.totalCommits} commits`;
  parts.push(svgText(width - 8, height - 14, statsLabel, {
    fontSize: 11,
    fill: p.textMuted,
    textAnchor: 'end',
  }));

  // Title (accessibility)
  const title = `<title>${escapeSvgText(metrics.username)}'s GitCity — ${metrics.repositories} repos, ${metrics.totalStars} stars, ${metrics.totalCommits} commits</title>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${title}
${parts.join('\n')}
</svg>`;

  // Size guard: reduce building count and re-render if over limit
  if (Buffer.byteLength(svg, 'utf8') > MAX_SIZE_BYTES) {
    const reduced = { ...metrics, repositories: Math.floor(metrics.repositories * 0.7) };
    return renderCitySVG(reduced, options);
  }

  return svg;
}
