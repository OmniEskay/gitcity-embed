// Compact stats card renderer — 400×200 SVG summary of GitHub metrics
import type { GitHubMetrics } from '../types/metrics.js';
import type { RenderOptions } from '../types/options.js';
import { themes } from './shared/palette.js';
import type { Theme } from './shared/palette.js';
import { escapeSvgText, svgText } from './shared/text.js';
import { computeLayout } from './shared/layout.js';

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

function miniSkyline(metrics: GitHubMetrics, width: number, baseY: number, p: Theme): string {
  const layout = computeLayout(metrics, { theme: 'dark', width, height: baseY + 10 });
  const parts: string[] = [];
  for (const b of layout.buildings) {
    // Simple silhouette — no windows
    parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${b.color}" opacity="0.6"/>`);
  }
  // Road
  parts.push(`<rect x="0" y="${baseY}" width="${width}" height="4" fill="${p.road}"/>`);
  return parts.join('');
}

export function renderCardSVG(metrics: GitHubMetrics, options: RenderOptions): string {
  const { width, height, theme } = options;
  const p = themes[theme];

  const rows: [string, string][] = [
    ['Repositories', String(metrics.repositories)],
    ['Stars', String(metrics.totalStars)],
    ['Commits', String(metrics.totalCommits)],
    ['Pull Requests', String(metrics.pullRequests)],
    ['Issues', String(metrics.issues)],
    ['Followers', String(metrics.followers)],
  ];

  const skylineBaseY = height - 28;
  const skyline = miniSkyline(metrics, width - 20, skylineBaseY, p);

  const rowsHtml = rows
    .map(([label, value], i) => {
      const y = 52 + i * 20;
      return [
        svgText(20, y, label, { fontSize: 12, fill: p.textMuted }),
        svgText(width - 20, y, value, {
          fontSize: 12,
          fontWeight: 'bold',
          fill: p.text,
          textAnchor: 'end',
        }),
      ].join('');
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <title>${escapeSvgText(metrics.username)}'s GitCity Card</title>
  <rect width="${width}" height="${height}" rx="8" fill="${p.cardBg}" stroke="${p.cardBorder}" stroke-width="1"/>
  <text x="20" y="28" font-family="${FONT}" font-size="15" font-weight="bold" fill="${p.accent}">&#x1F3D9; ${escapeSvgText(metrics.username)}'s GitCity</text>
  <line x1="20" y1="36" x2="${width - 20}" y2="36" stroke="${p.cardBorder}" stroke-width="1"/>
  ${rowsHtml}
  <g transform="translate(10,0)">${skyline}</g>
</svg>`;
}
