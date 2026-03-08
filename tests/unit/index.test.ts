// Unit tests for main app initialization
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('index.ts', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('should fail fast if GITHUB_TOKEN is missing', async () => {
    delete process.env['GITHUB_TOKEN'];
    await expect(async () => {
      await import('../../src/index.js');
    }).rejects.toThrow('Missing required env var: GITHUB_TOKEN');
  });

  it('should initialize app with GITHUB_TOKEN present', async () => {
    process.env['GITHUB_TOKEN'] = 'test-token';
    const module = await import('../../src/index.js');
    expect(module.default).toBeDefined();
  });
});
