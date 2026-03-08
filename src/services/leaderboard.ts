// Leaderboard scoring and query service — reads from SQLite cache, no external calls
import type { GitHubMetrics } from '../types/metrics.js';

export type SortField = 'score' | 'stars' | 'commits' | 'repos';

export interface LeaderboardEntry {
  username: string;
  score: number;
  repositories: number;
  totalStars: number;
  totalCommits: number;
  pullRequests: number;
  fetchedAt: number;
}

export function computeScore(metrics: GitHubMetrics): number {
  return (
    metrics.repositories * 2 +
    metrics.totalStars * 3 +
    metrics.totalCommits * 0.1 +
    metrics.pullRequests * 5
  );
}

export function toLeaderboardEntry(metrics: GitHubMetrics): LeaderboardEntry {
  return {
    username: metrics.username,
    score: Math.round(computeScore(metrics)),
    repositories: metrics.repositories,
    totalStars: metrics.totalStars,
    totalCommits: metrics.totalCommits,
    pullRequests: metrics.pullRequests,
    fetchedAt: metrics.fetchedAt,
  };
}
