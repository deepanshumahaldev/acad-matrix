import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { HealthService } from '../src/modules/health/health.service';

const app = createApp();

describe('GET /health', () => {
  it('returns liveness in the standard envelope', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});

describe('unknown routes', () => {
  it('return a 404 in the standard error envelope', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
});

describe('CORS', () => {
  it('allows the configured frontend origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('rejects other origins', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });
});

describe('HealthService.readiness', () => {
  it('reports ready when the database responds', async () => {
    const svc = new HealthService({ ping: async () => undefined });
    const { ready, body } = await svc.readiness();
    expect(ready).toBe(true);
    expect(body.checks.database.status).toBe('up');
  });

  it('reports not ready when the database ping fails', async () => {
    const svc = new HealthService({ ping: async () => Promise.reject(new Error('down')) });
    const { ready, body } = await svc.readiness();
    expect(ready).toBe(false);
    expect(body.checks.database).toEqual({ status: 'down', latencyMs: null });
  });
});
