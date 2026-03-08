// GitHub GraphQL client with retry, ETag conditional requests, and rate limit awareness
import type { GitHubMetrics } from '../types/metrics.js';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

const QUERY = `
query UserMetrics($login: String!) {
  user(login: $login) {
    avatarUrl
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes { stargazerCount }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
    }
    pullRequests(states: [OPEN, CLOSED, MERGED]) { totalCount }
    issues { totalCount }
    followers { totalCount }
  }
}
`;

interface RepoNode {
  stargazerCount: number;
}

interface GraphQLResponse {
  data?: {
    user: {
      avatarUrl: string;
      repositories: {
        totalCount: number;
        nodes: RepoNode[];
      };
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
      };
      pullRequests: { totalCount: number };
      issues: { totalCount: number };
      followers: { totalCount: number };
    } | null;
  };
  errors?: { message: string }[];
}

// Stored ETags per username for conditional requests
const etagStore = new Map<string, string>();

// Flag to track if rate limit is low — used by cache layer to extend TTL
export let rateLimitLow = false;

export class GitHubUserNotFoundError extends Error {
  constructor(username: string) {
    super(`GitHub user not found: ${username}`);
    this.name = 'GitHubUserNotFoundError';
  }
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

async function fetchWithRetry(
  token: string,
  username: string,
  attempt = 0
): Promise<{ body: GraphQLResponse; etag: string | null; notModified: boolean }> {
  const headers: Record<string, string> = {
    Authorization: `bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'gitcity-embed/1.0',
  };

  const storedEtag = etagStore.get(username);
  if (storedEtag) {
    headers['If-None-Match'] = storedEtag;
  }

  let response: Response;
  try {
    response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: QUERY, variables: { login: username } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      return fetchWithRetry(token, username, attempt + 1);
    }
    throw new GitHubAPIError(`Network error after ${MAX_RETRIES} attempts: ${String(err)}`);
  }

  // Track rate limit
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') ?? '999', 10);
  if (remaining < 100) {
    console.warn(`[github] Rate limit low: ${remaining} requests remaining`);
    rateLimitLow = true;
  } else {
    rateLimitLow = false;
  }

  // Handle 304 Not Modified
  if (response.status === 304) {
    return { body: {} as GraphQLResponse, etag: storedEtag ?? null, notModified: true };
  }

  // Retry on 5xx
  if (response.status >= 500) {
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      return fetchWithRetry(token, username, attempt + 1);
    }
    throw new GitHubAPIError(`GitHub API error after ${MAX_RETRIES} attempts`, response.status);
  }

  // Do not retry 4xx
  if (response.status >= 400) {
    throw new GitHubAPIError(`GitHub API returned ${response.status}`, response.status);
  }

  const newEtag = response.headers.get('ETag');
  if (newEtag) {
    etagStore.set(username, newEtag);
  }

  const body = (await response.json()) as GraphQLResponse;
  return { body, etag: newEtag, notModified: false };
}

export async function fetchGitHubMetrics(username: string): Promise<GitHubMetrics> {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new GitHubAPIError('GITHUB_TOKEN is not set');

  const { body, notModified } = await fetchWithRetry(token, username);

  if (notModified) {
    // Caller must handle 304 by returning cached data; this shouldn't happen in practice
    // since dedup + cache layer intercepts before calling fetchGitHubMetrics when fresh
    throw new GitHubAPIError('Received 304 but no cache available — this is a bug');
  }

  if (body.errors?.length) {
    throw new GitHubAPIError(`GraphQL errors: ${body.errors.map((e) => e.message).join(', ')}`);
  }

  if (!body.data?.user) {
    throw new GitHubUserNotFoundError(username);
  }

  const u = body.data.user;
  const nodes = u.repositories.nodes;
  const totalStars = nodes.reduce((sum, n) => sum + n.stargazerCount, 0);
  const topRepoStars = nodes[0]?.stargazerCount ?? 0;

  return {
    username,
    avatarUrl: u.avatarUrl,
    repositories: u.repositories.totalCount,
    totalStars,
    totalCommits: u.contributionsCollection.totalCommitContributions,
    pullRequests: u.pullRequests.totalCount,
    issues: u.issues.totalCount,
    followers: u.followers.totalCount,
    topRepoStars,
    fetchedAt: Date.now(),
  };
}
