// Defines the core GitHub metrics data shape fetched from the API
export interface GitHubMetrics {
  username: string;
  avatarUrl: string;
  repositories: number;
  totalStars: number;
  totalCommits: number;
  pullRequests: number;
  issues: number;
  followers: number;
  topRepoStars: number;
  fetchedAt: number;
}
