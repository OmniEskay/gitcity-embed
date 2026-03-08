// Unit tests for username validation logic
import { describe, it, expect } from 'vitest';

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
