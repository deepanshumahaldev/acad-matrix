import { beforeEach, describe, expect, it } from 'vitest';
import { sha256 } from '../src/common/utils/crypto';
import { verifyAccessToken } from '../src/common/utils/jwt';
import { PASSWORD, advance, buildHarness } from './helpers/fakes';

const ctx = { ip: '127.0.0.1', userAgent: 'vitest' };
let h: Awaited<ReturnType<typeof buildHarness>>;

beforeEach(async () => {
  h = await buildHarness();
});

const login = () => h.service.login({ email: h.user.email, password: PASSWORD }, ctx);
const fullLogin = async () => {
  const ch = await login();
  return h.service.verifyLoginOtp({ challengeId: ch.challengeId, code: h.email.lastCode() }, ctx);
};

describe('login (step 1: password)', () => {
  it('sends an OTP email and returns a masked challenge, not tokens', async () => {
    const ch = await login();
    expect(ch.challengeId).toBeTruthy();
    expect(ch.email).toBe('as**@AcadMatrix.test');
    expect(ch.expiresInSeconds).toBe(300);
    expect(h.email.sent).toHaveLength(1);
    expect(h.email.lastCode()).toMatch(/^\d{6}$/);
  });

  it('stores only a hash of the OTP, never the code itself', async () => {
    await login();
    const stored = [...h.repo.otps.values()][0]!;
    expect(stored.codeHash).not.toContain(h.email.lastCode());
    expect(stored.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    const wrong = await h.service.login({ email: h.user.email, password: 'nope' }, ctx).catch((e) => e);
    const unknown = await h.service.login({ email: 'ghost@AcadMatrix.test', password: 'nope' }, ctx).catch((e) => e);
    expect(wrong.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.message).toBe(wrong.message);
  });

  it('locks the account after 5 failures, even for the correct password', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(h.service.login({ email: h.user.email, password: 'bad' }, ctx)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    }
    await expect(login()).rejects.toMatchObject({ code: 'ACCOUNT_LOCKED', statusCode: 423 });
    expect(h.audit.actions()).toContain('auth.account_locked');
  });

  it('unlocks after the lock period and resets the counter', async () => {
    for (let i = 0; i < 5; i++) await h.service.login({ email: h.user.email, password: 'bad' }, ctx).catch(() => undefined);
    advance(16 * 60_000);
    await expect(login()).resolves.toBeTruthy();
    expect(h.user.failedLoginAttempts).toBe(0);
  });

  it('rejects deactivated accounts after verifying the password', async () => {
    h.user.status = 'INACTIVE';
    await expect(login()).rejects.toMatchObject({ code: 'ACCOUNT_INACTIVE' });
  });

  it('fails with a 502 and leaves no live code when email delivery fails', async () => {
    h.email.fail = true;
    await expect(login()).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_FAILED' });
    expect([...h.repo.otps.values()].every((o) => o.consumedAt)).toBe(true);
  });
});

describe('OTP verification (step 2)', () => {
  it('issues an access token with role claims plus a refresh token', async () => {
    const s = await fullLogin();
    const claims = verifyAccessToken(s.accessToken);
    expect(claims).toMatchObject({ sub: h.user.id, role: 'STUDENT', mcp: false });
    expect(s.refreshToken.length).toBeGreaterThan(40);
    expect(h.audit.actions()).toContain('auth.login');
  });

  it('is single use', async () => {
    const ch = await login();
    const code = h.email.lastCode();
    await h.service.verifyLoginOtp({ challengeId: ch.challengeId, code }, ctx);
    await expect(h.service.verifyLoginOtp({ challengeId: ch.challengeId, code }, ctx)).rejects.toMatchObject({ code: 'OTP_INVALID' });
  });

  it('expires after 5 minutes', async () => {
    const ch = await login();
    advance(5 * 60_000 + 1000);
    await expect(h.service.verifyLoginOtp({ challengeId: ch.challengeId, code: h.email.lastCode() }, ctx)).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
  });

  it('reports remaining attempts and blocks after 5 wrong codes, even if the right one follows', async () => {
    const ch = await login();
    const right = h.email.lastCode();
    const wrong = right === '000000' ? '111111' : '000000';
    const first = await h.service.verifyLoginOtp({ challengeId: ch.challengeId, code: wrong }, ctx).catch((e) => e);
    expect(first.details).toEqual({ attemptsRemaining: 4 });
    for (let i = 0; i < 4; i++) await h.service.verifyLoginOtp({ challengeId: ch.challengeId, code: wrong }, ctx).catch(() => undefined);
    await expect(h.service.verifyLoginOtp({ challengeId: ch.challengeId, code: right }, ctx)).rejects.toMatchObject({ code: 'OTP_ATTEMPTS_EXCEEDED' });
  });

  it("rejects a password-reset code used for login", async () => {
    const { challengeId } = await h.service.forgotPassword({ email: h.user.email });
    await expect(h.service.verifyLoginOtp({ challengeId, code: h.email.lastCode() }, ctx)).rejects.toMatchObject({ code: 'OTP_INVALID' });
  });
});

describe('resend', () => {
  it('enforces a 60s cooldown, then invalidates the old code', async () => {
    const first = await login();
    const oldCode = h.email.lastCode();
    await expect(h.service.resendOtp({ challengeId: first.challengeId })).rejects.toMatchObject({ code: 'OTP_RESEND_COOLDOWN', details: { retryAfterSeconds: 60 } });
    advance(61_000);
    const second = await h.service.resendOtp({ challengeId: first.challengeId });
    expect(second.challengeId).not.toBe(first.challengeId);
    expect(h.email.sent).toHaveLength(2);
    await expect(h.service.verifyLoginOtp({ challengeId: first.challengeId, code: oldCode }, ctx)).rejects.toMatchObject({ code: 'OTP_INVALID' });
  });
});

describe('refresh-token rotation', () => {
  it('rotates: the old token is revoked and a new one works', async () => {
    const s1 = await fullLogin();
    const s2 = await h.service.refresh(s1.refreshToken, ctx);
    expect(s2.refreshToken).not.toBe(s1.refreshToken);
    const old = await h.repo.findRefreshTokenByHash(sha256(s1.refreshToken));
    expect(old?.revokedAt).toBeTruthy();
    await expect(h.service.refresh(s2.refreshToken, ctx)).resolves.toBeTruthy();
  });

  it('treats replay of a rotated token as theft and revokes the whole family', async () => {
    const s1 = await fullLogin();
    const s2 = await h.service.refresh(s1.refreshToken, ctx);
    await expect(h.service.refresh(s1.refreshToken, ctx)).rejects.toMatchObject({ statusCode: 401 });
    await expect(h.service.refresh(s2.refreshToken, ctx)).rejects.toMatchObject({ statusCode: 401 });
    expect(h.audit.actions()).toContain('auth.token_reuse_detected');
  });

  it('rejects expired tokens and missing cookies', async () => {
    const s = await fullLogin();
    advance(8 * 86_400_000);
    await expect(h.service.refresh(s.refreshToken, ctx)).rejects.toMatchObject({ statusCode: 401 });
    await expect(h.service.refresh(undefined, ctx)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('logout revokes the family; logging out twice is harmless', async () => {
    const s = await fullLogin();
    await h.service.logout(s.refreshToken);
    await expect(h.service.refresh(s.refreshToken, ctx)).rejects.toMatchObject({ statusCode: 401 });
    await expect(h.service.logout(s.refreshToken)).resolves.toBeUndefined();
  });
});

describe('forced password change', () => {
  it('puts mcp=true in the token and clears it after changing the password', async () => {
    h = await buildHarness({ mustChangePassword: true });
    const s = await fullLogin();
    expect(verifyAccessToken(s.accessToken).mcp).toBe(true);

    const after = await h.service.changePassword(h.user.id, { currentPassword: PASSWORD, newPassword: 'N3wStrongPass' }, ctx);
    expect(verifyAccessToken(after.accessToken).mcp).toBe(false);
    expect(h.user.mustChangePassword).toBe(false);
    await expect(h.service.refresh(s.refreshToken, ctx)).rejects.toMatchObject({ statusCode: 401 }); // old sessions die
  });

  it('requires the correct current password', async () => {
    await expect(h.service.changePassword(h.user.id, { currentPassword: 'wrong', newPassword: 'N3wStrongPass' }, ctx)).rejects.toMatchObject({ code: 'CURRENT_PASSWORD_INCORRECT' });
  });
});

describe('forgot / reset password', () => {
  it('returns an identical shape for unknown emails and sends nothing', async () => {
    const res = await h.service.forgotPassword({ email: 'ghost@AcadMatrix.test' });
    expect(Object.keys(res).sort()).toEqual(['challengeId', 'resendAfterSeconds']);
    expect(h.email.sent).toHaveLength(0);
  });

  it('resets the password, unlocks the account and revokes sessions', async () => {
    const s = await fullLogin();
    h.user.failedLoginAttempts = 3;
    const { challengeId } = await h.service.forgotPassword({ email: h.user.email });
    await new Promise((r) => setTimeout(r, 0)); // email is sent without being awaited
    await h.service.resetPassword({ challengeId, code: h.email.lastCode(), newPassword: 'Br4ndNewPass' }, ctx);

    expect(h.user.failedLoginAttempts).toBe(0);
    await expect(h.service.refresh(s.refreshToken, ctx)).rejects.toMatchObject({ statusCode: 401 });
    await expect(h.service.login({ email: h.user.email, password: PASSWORD }, ctx)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(h.service.login({ email: h.user.email, password: 'Br4ndNewPass' }, ctx)).resolves.toBeTruthy();
  });

  it('does not re-send within the cooldown window', async () => {
    const a = await h.service.forgotPassword({ email: h.user.email });
    const b = await h.service.forgotPassword({ email: h.user.email });
    await new Promise((r) => setTimeout(r, 0));
    expect(b.challengeId).toBe(a.challengeId);
    expect(h.email.sent).toHaveLength(1);
  });
});
