// Converts GitHub metrics into positioned city elements for SVG rendering
import type { GitHubMetrics } from '../../types/metrics.js';
import type { RenderOptions } from '../../types/options.js';

export interface BuildingLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  isSkyscraper: boolean;
  stars: number;
}

export interface CityLayout {
  buildings: BuildingLayout[];
  roads: { y: number }[];
  bridges: { x1: number; x2: number; y: number }[];
  cranes: { x: number; y: number }[];
}

const MAX_BUILDINGS = 30;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Seeded pseudo-random based on username string for deterministic layout
function seededRand(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
    return ((h >>> 0) / 0xffffffff);
  };
}

export function computeLayout(metrics: GitHubMetrics, options: RenderOptions): CityLayout {
  const { width, height } = options;
  const rand = seededRand(metrics.username);

  const groundY = height - 60;
  const roadY = height - 60;

  // Use top repos, capped at MAX_BUILDINGS
  // We don't have per-repo data in metrics, so simulate building heights from totalStars
  // distributed across repo count using a geometric decay
  const repoCount = Math.min(metrics.repositories, MAX_BUILDINGS);
  if (repoCount === 0) {
    return { buildings: [], roads: [{ y: roadY }], bridges: [], cranes: [] };
  }

  // Distribute stars geometrically across buildings
  const buildingStars: number[] = [];
  let remaining = metrics.totalStars;
  for (let i = 0; i < repoCount; i++) {
    const share = i === repoCount - 1 ? remaining : Math.floor(remaining * (0.4 + rand() * 0.2));
    buildingStars.push(Math.max(0, share));
    remaining = Math.max(0, remaining - share);
  }
  // Ensure first building gets topRepoStars
  if (buildingStars.length > 0) {
    buildingStars[0] = metrics.topRepoStars;
  }

  const buildingColors = [
    '#1f6feb', '#238636', '#8b949e', '#f78166', '#a371f7',
    '#0969da', '#1a7f37', '#656d76', '#cf222e', '#8250df',
  ];

  // Calculate building widths — distribute evenly with small gaps
  const totalGap = 4 * repoCount;
  const buildingW = Math.max(8, Math.floor((width - 20 - totalGap) / repoCount));

  const buildings: BuildingLayout[] = [];
  for (let i = 0; i < repoCount; i++) {
    const stars = buildingStars[i] ?? 0;
    const h = clamp(stars * 8 + 20, 20, 120);
    const jitter = Math.floor((rand() - 0.5) * 6);
    const x = 10 + i * (buildingW + 4) + jitter;
    const color = buildingColors[i % buildingColors.length] ?? '#1f6feb';
    const isSkyscraper = stars > 50;

    buildings.push({
      x: Math.max(0, x),
      y: groundY - h,
      w: buildingW,
      h,
      color,
      isSkyscraper,
      stars,
    });
  }

  // Bridges: one per 10 PRs, max 5
  const bridgeCount = Math.min(Math.floor(metrics.pullRequests / 10), 5);
  const bridges: { x1: number; x2: number; y: number }[] = [];
  for (let i = 0; i < bridgeCount; i++) {
    const idxA = Math.floor(rand() * buildings.length);
    let idxB = Math.floor(rand() * buildings.length);
    if (idxB === idxA) idxB = (idxA + 1) % buildings.length;
    const bA = buildings[idxA];
    const bB = buildings[idxB];
    if (bA && bB) {
      bridges.push({
        x1: bA.x + bA.w / 2,
        x2: bB.x + bB.w / 2,
        y: groundY - Math.min(bA.h, bB.h) + 5,
      });
    }
  }

  // Cranes: one per 5 issues, max 3
  const craneCount = Math.min(Math.floor(metrics.issues / 5), 3);
  const cranes: { x: number; y: number }[] = [];
  for (let i = 0; i < craneCount; i++) {
    const idx = Math.floor(rand() * buildings.length);
    const b = buildings[idx];
    if (b) {
      cranes.push({ x: b.x + b.w / 2, y: b.y });
    }
  }

  return {
    buildings,
    roads: [{ y: roadY }],
    bridges,
    cranes,
  };
}
