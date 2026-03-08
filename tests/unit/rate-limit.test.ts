// Unit tests for the sliding window rate limiter
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the checkLimit logic directly by extracting it
const store = new Map<string, { count: number; windowStart: number }>();

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

beforeEach(() => store.clear());

describe('rate limiter', () => {
  it('allows requests under the limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkLimit('test-key', 10, 60_000).allowed).toBe(true);
    }
  });

  it('blocks at the limit', () => {
    for (let i = 0; i < 10; i++) {
      checkLimit('block-key', 10, 60_000);
    }
    const result = checkLimit('block-key', 10, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('allows again after window expires', () => {
    vi.useFakeTimers();
    checkLimit('window-key', 1, 1000);
    expect(checkLimit('window-key', 1, 1000).allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(checkLimit('window-key', 1, 1000).allowed).toBe(true);
    vi.useRealTimers();
  });

  it('tracks different keys independently', () => {
    for (let i = 0; i < 5; i++) checkLimit('key-a', 5, 60_000);
    expect(checkLimit('key-a', 5, 60_000).allowed).toBe(false);
    expect(checkLimit('key-b', 5, 60_000).allowed).toBe(true);
  });

  it('returns retryAfter > 0 when blocked', () => {
    checkLimit('retry-key', 1, 30_000);
    const result = checkLimit('retry-key', 1, 30_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(30);
  });
});
