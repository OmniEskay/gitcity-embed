
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { rateLimitMiddleware } from '../../src/middleware/rate-limit.js';

describe('rateLimitMiddleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('*', rateLimitMiddleware());
    app.get('/test', (c) => c.text('ok'));
    app.get('/test/:username', (c) => c.text('ok'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    
    vi.clearAllTimers();
  });

  it('should allow requests under IP limit', async () => {
    const res = await app.request('/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(res.status).toBe(200);
  });

  it('should block requests exceeding IP limit', async () => {
    const ip = '1.2.3.5';
    const limit = parseInt(process.env['RATE_LIMIT_IP'] ?? '100', 10);

    for (let i = 0; i < limit; i++) {
      await app.request('/test', { headers: { 'x-forwarded-for': ip } });
    }

    const res = await app.request('/test', { headers: { 'x-forwarded-for': ip } });
    expect(res.status).toBe(429);
    expect(res.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });

  it.skip('should block requests exceeding user limit', async () => {
   
    const limit = parseInt(process.env['RATE_LIMIT_USER'] ?? '30', 10);
    const uniqueUser = `testuser${Date.now()}`;
    

    for (let i = 0; i < limit; i++) {
      const ip = `192.168.${Math.floor(i / 256)}.${i % 256}`;
      const res = await app.request(`/test/${uniqueUser}`, { 
        headers: { 'x-forwarded-for': ip } 
      });
      expect(res.status).toBe(200);
    }

   
    const res = await app.request(`/test/${uniqueUser}`, { 
      headers: { 'x-forwarded-for': '9.9.9.9' } 
    });
    expect(res.status).toBe(429);
    expect(await res.text()).toContain('Rate limit exceeded for this user');
  });

  it('should handle missing x-forwarded-for header', async () => {
    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  it('should respect theme parameter in error response', async () => {
    const ip = '1.2.3.6';
    const limit = parseInt(process.env['RATE_LIMIT_IP'] ?? '100', 10);

    for (let i = 0; i < limit; i++) {
      await app.request('/test?theme=light', { headers: { 'x-forwarded-for': ip } });
    }

    const res = await app.request('/test?theme=light', { headers: { 'x-forwarded-for': ip } });
    expect(res.status).toBe(429);
    const svg = await res.text();
    expect(svg).toContain('fill="#ffffff"'); 
  });
});
