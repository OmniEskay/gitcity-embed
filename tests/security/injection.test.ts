// Security tests: ensures injection attempts return 400 SVG, never 500 or unescaped input
import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { validateUsername } from '../../src/middleware/validate.js';
import { renderErrorSVG } from '../../src/renderers/error.js';

// Minimal test app that only runs validation
const testApp = new Hono();
testApp.get('/:username', validateUsername({ defaultWidth: 800, defaultHeight: 400 }), (c) => {
  return c.text('ok', 200);
});

// Note: empty string '' routes to 404 (no route match) — tested separately below
const INVALID_USERNAMES = [
  '-leading',
  'trailing-',
  'double--hyphen',
  'a'.repeat(40),
  '<script>alert(1)</script>',
  'user%00name',
  'user/path',
  'user\\path',
  'user<img src=x onerror=alert(1)>',
  'user name',
  '.dotstart',
];

describe('injection prevention', () => {
  it.each(INVALID_USERNAMES)('returns 400 for: %s', async (username) => {
    const encoded = encodeURIComponent(username);
    const res = await testApp.request(`/${encoded}`);
    expect(res.status).toBe(400);
  });

  it('response body for invalid input is SVG, not a stack trace', async () => {
    const res = await testApp.request('/%3Cscript%3E');
    const body = await res.text();
    expect(body).toMatch(/^<svg/);
    expect(body).not.toContain('Error:');
    expect(body).not.toContain('at ');
  });

  it('error SVG does not reflect unescaped user input', () => {
    const svg = renderErrorSVG(400, '<script>alert(1)</script>', 'dark');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('null byte in path returns 400', async () => {
    const res = await testApp.request('/user%00name');
    expect(res.status).toBe(400);
  });

  it('empty username returns 404 (no route match)', async () => {
    const res = await testApp.request('/');
    expect(res.status).toBe(404);
  });

  it('valid username passes through', async () => {
    const res = await testApp.request('/octocat');
    expect(res.status).toBe(200);
  });
});
