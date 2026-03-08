// Defines badge shape and conditions for GitHub achievement badges
import type { GitHubMetrics } from './metrics.js';

export interface BadgeDefinition {
  id: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
  condition: (metrics: GitHubMetrics) => boolean;
}
