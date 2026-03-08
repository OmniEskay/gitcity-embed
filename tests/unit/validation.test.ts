// Unit tests for username validation logic
import { describe, it, expect, beforeEach } from 'vitest';

const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function isValidUsername(raw: string): boolean {
  let username: string;
  try {
    username = decodeURIComponent(raw);
  } catch {
    return false;
  }
  if (/[\x00-\x1f\x7f]/.test(username)) return false;
  if (username.includes('/') || username.includes('\\') || username.includes('..')) return false;
  return USERNAME_REGEX.test(username);
}

const VALID_USERNAMES = ['octocat', 'a', 'user-name', 'a'.repeat(39), 'User123'];

const INVALID_USERNAMES = [
  '',
  '-leading',
  'trailing-',
  'double--hyphen',
  'a'.repeat(40),
  '../etc/passwd',
  '<script>alert(1)</script>',
  'user%00name',
  'user\nname',
  'user/path',
  'user\\path',
  'user<img src=x onerror=alert(1)>',
  'user name',
  '.dotstart',
];

describe('username validation', () => {
  it.each(VALID_USERNAMES)('accepts valid username: %s', (username) => {
    expect(isValidUsername(username)).toBe(true);
  });

  it.each(INVALID_USERNAMES)('rejects invalid username: %s', (username) => {
    expect(isValidUsername(username)).toBe(false);
  });

  it('rejects malformed percent-encoding', () => {
    expect(isValidUsername('%zz')).toBe(false);
  });

  it('accepts single character username', () => {
    expect(isValidUsername('a')).toBe(true);
  });

  it('rejects exactly 40 character username', () => {
    expect(isValidUsername('a'.repeat(40))).toBe(false);
  });

  it('accepts exactly 39 character username', () => {
    expect(isValidUsername('a'.repeat(39))).toBe(true);
  });
});

// Integration tests for validateUsername middleware
import { Hono } from 'hono';
import { validateUsername } from '../../src/middleware/validate.js';
import type { RenderOptions } from '../../src/types/options.js';

type Variables = { validatedUsername: string; renderOptions: RenderOptions };

describe('validateUsername middleware', () => {
  let app: Hono<{ Variables: Variables }>;

  beforeEach(() => {
    app = new Hono<{ Variables: Variables }>();
    app.get('/test/:username', validateUsername({ defaultWidth: 400, defaultHeight: 200 }), (c) => {
      return c.json({
        username: c.get('validatedUsername'),
        options: c.get('renderOptions'),
      });
    });
  });

  it('should pass valid username and set defaults', async () => {
    const res = await app.request('/test/octocat');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe('octocat');
    expect(body.options.theme).toBe('dark');
    expect(body.options.width).toBe(400);
  });

  it('should parse theme query param', async () => {
    const res = await app.request('/test/octocat?theme=light');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.options.theme).toBe('light');
  });

  it('should parse width query param', async () => {
    const res = await app.request('/test/octocat?width=600');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.options.width).toBe(600);
  });

  it('should reject width below 200', async () => {
    const res = await app.request('/test/octocat?width=100');
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('width must be an integer between 200 and 1200');
  });

  it('should reject width above 1200', async () => {
    const res = await app.request('/test/octocat?width=1500');
    expect(res.status).toBe(400);
  });

  it('should reject invalid width', async () => {
    const res = await app.request('/test/octocat?width=abc');
    expect(res.status).toBe(400);
  });
});
