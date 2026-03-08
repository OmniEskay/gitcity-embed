// GET /api/card/:username — returns a compact stats card SVG
import { Hono } from 'hono';
import { validateUsername } from '../middleware/validate.js';
import { getCachedOrFetch } from '../cache/index.js';
import { renderCardSVG } from '../renderers/card.js';
import { renderErrorSVG } from '../renderers/error.js';
import { computeEtag } from '../utils/etag.js';
import { GitHubUserNotFoundError } from '../services/github.js';
import type { RenderOptions } from '../types/options.js';

type Variables = { validatedUsername: string; renderOptions: RenderOptions };

export const cardRoute = new Hono<{ Variables: Variables }>();

cardRoute.get('/:username', validateUsername({ defaultWidth: 400, defaultHeight: 200 }), async (c) => {
  const username = c.get('validatedUsername');
  const options = c.get('renderOptions');
  const ifNoneMatch = c.req.header('If-None-Match');

  try {
    const { metrics, cacheStatus } = await getCachedOrFetch(username);
    const svg = renderCardSVG(metrics, options);
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
    console.error('[card] Failed to render:', err);
    const svg = renderErrorSVG(502, 'GitHub API unavailable. Try again later.', options.theme);
    return c.body(svg, 502, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
  }
});
