// Unit tests for promise deduplication utility
import { describe, it, expect, vi } from 'vitest';
import { dedup } from '../../src/utils/dedup.js';

describe('dedup', () => {
  it('calls fn once for concurrent requests with same key', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const [a, b, c] = await Promise.all([
      dedup('key1', fn),
      dedup('key1', fn),
      dedup('key1', fn),
    ]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(a).toBe('result');
    expect(b).toBe('result');
    expect(c).toBe('result');
  });

  it('allows a second call after the first resolves', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    await dedup('key2', fn);
    await dedup('key2', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('propagates rejection to all waiters', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    const results = await Promise.allSettled([
      dedup('key3', fn),
      dedup('key3', fn),
    ]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');
  });

  it('handles different keys independently', async () => {
    const fnA = vi.fn().mockResolvedValue('a');
    const fnB = vi.fn().mockResolvedValue('b');
    const [a, b] = await Promise.all([dedup('keyA', fnA), dedup('keyB', fnB)]);
    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(1);
    expect(a).toBe('a');
    expect(b).toBe('b');
  });
});
