# Deployment Guide

## Prerequisites

All deployment methods require a GitHub Personal Access Token with `read:user` and `read:org` scopes.

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

---

## Vercel (Recommended)

1. Push the repo to GitHub
2. Import into Vercel
3. Set environment variable: `GITHUB_TOKEN`
4. Deploy — Vercel auto-detects the `vercel.json` config

The `vercel.json` sets cache headers and CORS automatically.

---

## Docker

```bash
# Build
docker build -t gitcity-embed .

# Run
docker run -p 3000:3000 --env-file .env gitcity-embed
```

SQLite cache is stored in `/app/data/cache.db` inside the container. Mount a volume to persist across restarts:

```bash
docker run -p 3000:3000 --env-file .env \
  -v $(pwd)/data:/app/data \
  gitcity-embed
```

---

## Plain Node

```bash
# Install dependencies
npm ci

# Build TypeScript
npm run build

# Start
GITHUB_TOKEN=ghp_... npm start
```

Or use the serve script (same thing):

```bash
GITHUB_TOKEN=ghp_... node dist/serve.js
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GITHUB_TOKEN` | **Yes** | — | GitHub PAT for GraphQL API |
| `PORT` | No | `3000` | HTTP server port |
| `EMBED_CACHE_TTL_MEMORY` | No | `300` | L1 cache TTL in seconds |
| `EMBED_CACHE_TTL_DISK` | No | `3600` | L2 SQLite cache TTL in seconds |
| `CACHE_DB_PATH` | No | `./data/cache.db` | SQLite database file path |
| `RATE_LIMIT_IP` | No | `100` | Requests per IP per 15 minutes |
| `RATE_LIMIT_USER` | No | `30` | Requests per username per 5 minutes |
