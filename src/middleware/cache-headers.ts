// Adds HTTP cache control and security headers to all API responses
import type { Context, Next } from 'hono';

export function cacheHeadersMiddleware() {
  return async (c: Context, next: Next): Promise<void> => {
    await next();
    c.res.headers.set(
      'Cache-Control',
      'public, max-age=43200, s-maxage=43200, stale-while-revalidate=86400'
    );
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'"
    );
  };
}
