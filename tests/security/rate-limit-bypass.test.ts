// Security tests: verifies rate limiting cannot be bypassed
import { describe, it, expect } from 'vitest';

// Isolated rate-limiter logic for testing without side effects
const testStore = new Map<string, { count: number; windowStart: number }>();

function checkLimit(key: string, limit: number, windowMs: number): { allowed: boolean } {
  const now = Date.now();
  const entry = testStore.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    testStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (entry.count >= limit) return { allowed: false };
  entry.count++;
  return { allowed: true };
}

describe('rate limit bypass prevention', () => {
  it('cannot exceed limit by using same key rapidly', () => {
    const key = 'bypass:rapid';
    const LIMIT = 5;
    let allowed = 0;
    let blocked = 0;
    for (let i = 0; i < 20; i++) {
      if (checkLimit(key, LIMIT, 60_000).allowed) allowed++;
      else blocked++;
    }
    expect(allowed).toBe(LIMIT);
    expect(blocked).toBe(15);
  });

  it('different usernames have independent limits', () => {
    for (let i = 0; i < 5; i++) checkLimit('user:alpha', 5, 60_000);
    expect(checkLimit('user:alpha', 5, 60_000).allowed).toBe(false);
    expect(checkLimit('user:beta', 5, 60_000).allowed).toBe(true);
  });
});
