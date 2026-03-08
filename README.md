# GitCity Embed

> Standalone SVG city visualization service — embed a live GitHub activity skyline in your profile README.

[![CI](https://github.com/your-username/gitcity-embed/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/gitcity-embed/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Quick Start

Add to your GitHub profile README:

```markdown
![GitCity](https://your-deployment.vercel.app/api/city/YOUR_USERNAME)
```

Dark theme (default):
```markdown
![GitCity Dark](https://your-deployment.vercel.app/api/city/YOUR_USERNAME?theme=dark)
```

Light theme:
```markdown
![GitCity Light](https://your-deployment.vercel.app/api/city/YOUR_USERNAME?theme=light)
```

Stats card:
```markdown
![GitCity Card](https://your-deployment.vercel.app/api/card/YOUR_USERNAME)
```

Achievement badges:
```markdown
![GitCity Badges](https://your-deployment.vercel.app/api/badge/YOUR_USERNAME)
```

---

## API Reference

| Endpoint | Description | Default Size |
|---|---|---|
| `GET /api/city/:username` | Full skyline SVG | 800×400 |
| `GET /api/card/:username` | Compact stats card | 400×200 |
| `GET /api/badge/:username` | Achievement badges | 200×(28×n) |
| `GET /api/leaderboard` | Top users JSON | — |
| `GET /health` | Health check | — |

### Query Parameters

| Param | Values | Default | Description |
|---|---|---|---|
| `theme` | `dark` \| `light` | `dark` | Color theme |
| `width` | `200`–`1200` | route default | SVG width in px |

### Leaderboard Parameters

| Param | Values | Default | Description |
|---|---|---|---|
| `limit` | `1`–`100` | `20` | Number of entries |
| `sort` | `score` \| `stars` \| `commits` \| `repos` | `score` | Sort field |

### Response Headers

| Header | Description |
|---|---|
| `ETag` | Content hash for client-side caching |
| `X-Cache` | `HIT`, `MISS`, or `STALE` |
| `Cache-Control` | `public, max-age=43200, stale-while-revalidate=86400` |

---

## Achievement Badges

| Badge | Condition |
|---|---|
| 🏗️ City Architect | 50+ repositories |
| ⭐ Stargazer | 100+ total stars |
| 🚂 Commit Machine | 1000+ commits |
| 🌉 Bridge Builder | 50+ pull requests |
| 🦸 Open Source Hero | 500+ total stars |

---

## Self-Hosting

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel, Docker, and Node.js instructions.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GITHUB_TOKEN` | **Yes** | — | GitHub PAT |
| `PORT` | No | `3000` | Server port |
| `EMBED_CACHE_TTL_MEMORY` | No | `300` | L1 cache TTL (seconds) |
| `EMBED_CACHE_TTL_DISK` | No | `3600` | L2 SQLite TTL (seconds) |
| `CACHE_DB_PATH` | No | `./data/cache.db` | SQLite file path |
| `RATE_LIMIT_IP` | No | `100` | Requests/IP/15min |
| `RATE_LIMIT_USER` | No | `30` | Requests/username/5min |

---

## Architecture

Request → Rate Limit → Validate → L1 Cache → L2 Cache → GitHub GraphQL → SVG Render → Response

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full component diagram.

---

## Contributing

Issues and PRs welcome. Please open an issue before large changes.

---

## License

[MIT](LICENSE)
