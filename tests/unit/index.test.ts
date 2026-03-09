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

  it('should initialize app even if GITHUB_TOKEN is missing (validated per-request)', async () => {
    delete process.env['GITHUB_TOKEN'];
    const module = await import('../../src/index.js');
    expect(module.default).toBeDefined();
  });

  it('should initialize app with GITHUB_TOKEN present', async () => {
    process.env['GITHUB_TOKEN'] = 'test-token';
    const module = await import('../../src/index.js');
    expect(module.default).toBeDefined();
  });
});
