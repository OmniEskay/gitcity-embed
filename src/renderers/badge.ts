// Achievement badge renderer — shields.io-style SVG badges for GitHub milestones
import type { GitHubMetrics } from '../types/metrics.js';
import type { ThemeName } from '../types/options.js';
import type { BadgeDefinition } from '../types/badges.js';
import { escapeSvgText } from './shared/text.js';

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const BADGE_H = 28;
const LABEL_W = 110;
const VALUE_W = 90;
const BADGE_W = LABEL_W + VALUE_W;

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'architect',
    label: 'City Architect',
    emoji: '🏗️',
    description: 'Has 50 or more repositories',
    color: '#238636',
    condition: (m) => m.repositories >= 50,
  },
  {
    id: 'stargazer',
    label: 'Stargazer',
    emoji: '⭐',
    description: 'Has 100 or more total stars',
    color: '#f78166',
    condition: (m) => m.totalStars >= 100,
  },
  {
    id: 'committer',
    label: 'Commit Machine',
    emoji: '🚂',
    description: 'Has 1000 or more commits',
    color: '#1f6feb',
    condition: (m) => m.totalCommits >= 1000,
  },
  {
    id: 'bridger',
    label: 'Bridge Builder',
    emoji: '🌉',
    description: 'Has 50 or more pull requests',
    color: '#8b949e',
    condition: (m) => m.pullRequests >= 50,
  },
  {
    id: 'hero',
    label: 'Open Source Hero',
    emoji: '🦸',
    description: 'Has 500 or more total stars',
    color: '#a371f7',
    condition: (m) => m.totalStars >= 500,
  },
];

function renderSingleBadge(def: BadgeDefinition, offsetY: number, theme: ThemeName): string {
  const bgLeft = theme === 'dark' ? '#21262d' : '#f6f8fa';
  const textColor = theme === 'dark' ? '#c9d1d9' : '#24292f';
  const border = theme === 'dark' ? '#30363d' : '#d0d7de';

  const labelText = `${def.emoji} ${def.label}`;
  const escapedLabel = escapeSvgText(labelText);

  return `<g transform="translate(0,${offsetY})">
  <rect width="${BADGE_W}" height="${BADGE_H}" rx="4" fill="${bgLeft}" stroke="${border}" stroke-width="1"/>
  <rect x="${LABEL_W}" width="${VALUE_W}" height="${BADGE_H}" rx="0" fill="${def.color}"/>
  <rect x="${LABEL_W}" width="4" height="${BADGE_H}" fill="${def.color}"/>
  <text x="8" y="${BADGE_H / 2 + 1}" font-family="${FONT}" font-size="11" fill="${textColor}" dominant-baseline="middle">${escapedLabel}</text>
  <text x="${LABEL_W + VALUE_W / 2}" y="${BADGE_H / 2 + 1}" font-family="${FONT}" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">Earned</text>
</g>`;
}

export function renderBadgeSVG(metrics: GitHubMetrics, theme: ThemeName): string {
  const earned = BADGE_DEFINITIONS.filter((d) => d.condition(metrics));

  if (earned.length === 0) {
    const bg = theme === 'dark' ? '#0d1117' : '#ffffff';
    const text = theme === 'dark' ? '#8b949e' : '#656d76';
    const border = theme === 'dark' ? '#30363d' : '#d0d7de';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BADGE_W} ${BADGE_H}" width="${BADGE_W}" height="${BADGE_H}">
  <title>No badges earned yet</title>
  <rect width="${BADGE_W}" height="${BADGE_H}" rx="4" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="${BADGE_W / 2}" y="${BADGE_H / 2 + 1}" font-family="${FONT}" font-size="11" fill="${text}" text-anchor="middle" dominant-baseline="middle">No badges earned yet</text>
</svg>`;
  }

  const totalH = earned.length * (BADGE_H + 4) - 4;
  const badges = earned
    .map((def, i) => renderSingleBadge(def, i * (BADGE_H + 4), theme))
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BADGE_W} ${totalH}" width="${BADGE_W}" height="${totalH}">
  <title>${escapeSvgText(metrics.username)}'s GitCity Badges</title>
  ${badges}
</svg>`;
}
