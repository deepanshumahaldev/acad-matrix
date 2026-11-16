import type { Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { requireRole } from '../src/common/middleware';
import { PASSWORD, buildHarness } from './helpers/fakes';

let h: Awaited<ReturnType<typeof buildHarness>>;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  h = await buildHarness({ role: 'STUDENT' });
  app = createApp({ authService: h.service });
});

async function signIn(agent: ReturnType<typeof request.agent>) {
  const login = await agent.post('/api/v1/auth/login').send({ email: h.user.email, password: PASSWORD });
  expect(login.status).toBe(200);
  const verify = await agent.post('/api/v1/auth/verify-otp').send({ challengeId: login.body.data.challengeId, code: h.email.lastCode() });
  return verify;
}

describe('auth HTTP flow', () => {
  it('login → OTP → me → refresh (cookie) → logout', async () => {
    const agent = request.agent(app);
    const verify = await signIn(agent);

    expect(verify.status).toBe(200);
    expect(verify.body.data.accessToken).toBeTruthy();
    expect(verify.body.data.refreshToken).toBeUndefined(); // never in the body
    const cookie = verify.headers['set-cookie']![0]!;
    expect(cookie).toMatch(/AcadMatrix_rt=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${verify.body.data.accessToken}`);
    expect(me.body.data).toMatchObject({ email: h.user.email, role: 'STUDENT' });

    const refreshed = await agent.post('/api/v1/auth/refresh');
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();

    expect((await agent.post('/api/v1/auth/logout')).status).toBe(200);
    expect((await agent.post('/api/v1/auth/refresh')).status).toBe(401);
  });

  it('validates input with a 422 and field details', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email', password: '' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('returns 401 with the generic message for bad credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: h.user.email, password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects protected routes without a token or with a garbage token', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer abc')).status).toBe(401);
  });
});

describe('forced password change gate', () => {
  it('blocks normal routes with 403 PASSWORD_CHANGE_REQUIRED but allows /me and change-password', async () => {
    h = await buildHarness({ mustChangePassword: true });
    app = createApp({ authService: h.service });
    const agent = request.agent(app);
    const { body } = await signIn(agent);
    const auth = { Authorization: `Bearer ${body.data.accessToken}` };

    expect(body.data.user.mustChangePassword).toBe(true);
    expect((await request(app).get('/api/v1/auth/me').set(auth)).status).toBe(200);

    // Any ordinary protected route (authenticate() without the allowPasswordChange flag) is refused.
    const { authenticate } = await import('../src/common/middleware');
    const express = (await import('express')).default;
    const probe = express();
    probe.get('/anything', authenticate(), (_q, r) => void r.json({ ok: true }));
    probe.use((err: { statusCode?: number; code?: string }, _q: unknown, r: Response, _n: unknown) =>
      void r.status(err.statusCode ?? 500).json({ code: err.code }));
    const blocked = await request(probe).get('/anything').set(auth);
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const changed = await request(app).post('/api/v1/auth/change-password').set(auth).send({ currentPassword: PASSWORD, newPassword: 'N3wStrongPass' });
    expect(changed.status).toBe(200);
    expect(changed.body.data.user.mustChangePassword).toBe(false);
  });
});

describe('requireRole middleware', () => {
  const run = async (role: 'ADMIN' | 'FACULTY' | 'STUDENT') => {
    const hh = await buildHarness({ role });
    const a = createApp({ authService: hh.service });
    const login = await request(a).post('/api/v1/auth/login').send({ email: hh.user.email, password: PASSWORD });
    const v = await request(a).post('/api/v1/auth/verify-otp').send({ challengeId: login.body.data.challengeId, code: hh.email.lastCode() });
    return v.body.data.accessToken as string;
  };

  it('lets matching roles through and returns 403 for others', async () => {
    const { authenticate } = await import('../src/common/middleware');
    const express = (await import('express')).default;
    const probe = express();
    probe.get('/admin-only', authenticate(), requireRole('ADMIN'), (_q, r) => void r.json({ ok: true }));
    probe.use((err: { statusCode?: number }, _q: unknown, r: Response, _n: unknown) => void r.status(err.statusCode ?? 500).json({}));

    const student = await run('STUDENT');
    const admin = await run('ADMIN');
    expect((await request(probe).get('/admin-only').set('Authorization', `Bearer ${student}`)).status).toBe(403);
    expect((await request(probe).get('/admin-only').set('Authorization', `Bearer ${admin}`)).status).toBe(200);
  });
});
