// Integration test for health check endpoint
import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';

describe('GET /health', () => {
  let app: Hono;

  beforeAll(async () => {
    process.env['GITHUB_TOKEN'] = 'test-token';
    const module = await import('../../src/index.js');
    app = module.default;
  });

  it('returns 200 with status ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTypeOf('number');
  });
});
