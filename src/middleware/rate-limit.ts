// Sliding window rate limiter: per-IP (100/15min) and per-username (30/5min)
import type { Context, Next } from 'hono';
import { renderErrorSVG } from '../renderers/error.js';

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

const IP_LIMIT = parseInt(process.env['RATE_LIMIT_IP'] ?? '100', 10);
const IP_WINDOW_MS = 15 * 60 * 1000;
const USER_LIMIT = parseInt(process.env['RATE_LIMIT_USER'] ?? '30', 10);
const USER_WINDOW_MS = 5 * 60 * 1000;

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    const windowMs = key.startsWith('ip:') ? IP_WINDOW_MS : USER_WINDOW_MS;
    if (now - entry.windowStart > windowMs) {
      store.delete(key);
    }
  }
}, 60_000).unref();

function checkLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export function rateLimitMiddleware() {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const username = c.req.param('username') ?? '';
    const theme: 'dark' | 'light' =
      c.req.query('theme') === 'light' ? 'light' : 'dark';

    const ipCheck = checkLimit(`ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
    if (!ipCheck.allowed) {
      const svg = renderErrorSVG(429, 'Rate limit exceeded. Please slow down.', theme);
      return new Response(svg, {
        status: 429,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Retry-After': String(ipCheck.retryAfter),
        },
      });
    }

    if (username) {
      const userCheck = checkLimit(`user:${username}`, USER_LIMIT, USER_WINDOW_MS);
      if (!userCheck.allowed) {
        const svg = renderErrorSVG(429, `Rate limit exceeded for this user.`, theme);
        return new Response(svg, {
          status: 429,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Retry-After': String(userCheck.retryAfter),
          },
        });
      }
    }

    await next();
  };
}
