// Input validation middleware: enforces GitHub username rules and query param constraints
import type { Context, Next } from 'hono';
import { renderErrorSVG } from '../renderers/error.js';

const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

interface ValidateOptions {
  defaultWidth: number;
  defaultHeight: number;
}

function errorResponse(c: Context, status: number, message: string): Response {
  const theme = c.req.query('theme') === 'light' ? 'light' : ('dark' as const);
  const svg = renderErrorSVG(status, message, theme);
  return new Response(svg, {
    status,
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
}

export function validateUsername(opts: ValidateOptions) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const rawUsername = c.req.param('username') ?? '';

    // Decode percent-encoding safely
    let username: string;
    try {
      username = decodeURIComponent(rawUsername);
    } catch {
      return errorResponse(c, 400, 'Invalid URL encoding in username');
    }

    // Reject null bytes and control characters
    if (/[\x00-\x1f\x7f]/.test(username)) {
      return errorResponse(c, 400, 'Invalid characters in username');
    }

    // Reject path traversal patterns
    if (username.includes('/') || username.includes('\\') || username.includes('..')) {
      return errorResponse(c, 400, 'Invalid characters in username');
    }

    // Validate against GitHub username rules
    if (!USERNAME_REGEX.test(username)) {
      return errorResponse(c, 400, 'Invalid GitHub username');
    }

    // Parse and validate theme
    const theme: 'dark' | 'light' = c.req.query('theme') === 'light' ? 'light' : 'dark';

    // Parse and validate width
    const widthParam = c.req.query('width');
    let width = opts.defaultWidth;
    if (widthParam !== undefined) {
      const parsed = parseInt(widthParam, 10);
      if (isNaN(parsed) || parsed < 200 || parsed > 1200) {
        return errorResponse(c, 400, 'width must be an integer between 200 and 1200');
      }
      width = parsed;
    }

    // Store validated values for downstream handlers
    c.set('validatedUsername', username);
    c.set('renderOptions', { theme, width, height: opts.defaultHeight });

    await next();
  };
}
