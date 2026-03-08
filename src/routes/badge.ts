// GET /api/badge/:username — returns earned achievement badges as a stacked SVG
import { Hono } from 'hono';
import { validateUsername } from '../middleware/validate.js';
import { getCachedOrFetch } from '../cache/index.js';
import { renderBadgeSVG } from '../renderers/badge.js';
import { renderErrorSVG } from '../renderers/error.js';
import { computeEtag } from '../utils/etag.js';
import { GitHubUserNotFoundError } from '../services/github.js';
import type { ThemeName } from '../types/options.js';

export const badgeRoute = new Hono();

badgeRoute.get('/:username', validateUsername({ defaultWidth: 200, defaultHeight: 28 }), async (c) => {
  const username = c.get('validatedUsername') as string;
  const options = c.get('renderOptions') as { theme: ThemeName; width: number; height: number };
  const ifNoneMatch = c.req.header('If-None-Match');

  try {
    const { metrics, cacheStatus } = await getCachedOrFetch(username);
    const svg = renderBadgeSVG(metrics, options.theme);
    const etag = computeEtag(svg);

    if (ifNoneMatch === etag) {
      return c.body(null, 304);
    }

    return c.body(svg, 200, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      ETag: etag,
      'X-Cache': cacheStatus,
    });
  } catch (err) {
    if (err instanceof GitHubUserNotFoundError) {
      const svg = renderErrorSVG(404, `User "${username}" not found on GitHub`, options.theme);
      return c.body(svg, 404, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
    }
    console.error('[badge] Failed to render:', err);
    const svg = renderErrorSVG(502, 'GitHub API unavailable. Try again later.', options.theme);
    return c.body(svg, 502, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
  }
});
