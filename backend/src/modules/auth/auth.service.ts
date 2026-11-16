import { randomUUID } from 'node:crypto';
import { config } from '../../common/config';
import { AppError, UnauthorizedError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import { type EmailService, otpEmail } from '../../common/services/email';
import { generateOtp, hashOtp, randomToken, safeEqual, sha256 } from '../../common/utils/crypto';
import { accessTtlSeconds, signAccessToken } from '../../common/utils/jwt';
import { logger } from '../../common/utils/logger';
import { hashPassword, verifyPassword } from '../../common/utils/password';
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  ResendOtpBody,
  ResetPasswordBody,
  VerifyOtpBody,
} from './auth.schema';
import type {
  AuthRepo,
  AuthUserRecord,
  OtpChallenge,
  OtpPurpose,
  PublicUser,
  RequestContext,
  Session,
} from './auth.types';

const MINUTE = 60_000;
const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
const invalidOtp = () => new AppError(400, 'OTP_INVALID', 'That code is not valid. Check it and try again.');

export const toPublicUser = (u: AuthUserRecord): PublicUser => ({
  id: u.id,
  email: u.email,
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName,
  mustChangePassword: u.mustChangePassword,
});

const maskEmail = (email: string) => {
  const [name = '', domain = ''] = email.split('@');
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
};

export class AuthService {
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly repo: AuthRepo,
    private readonly email: EmailService,
    private readonly audit: AuditLogger,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  // ───────────── Step 1: password ─────────────

  async login(input: LoginBody, ctx: RequestContext): Promise<OtpChallenge> {
    const now = this.clock();
    const user = await this.repo.findUserByEmail(input.email);

    if (!user || user.deletedAt) {
      // Burn the same CPU time as a real check so response timing does not reveal valid emails.
      await verifyPassword(await this.getDummyHash(), input.password);
      throw invalidCredentials();
    }

    let attempts = user.failedLoginAttempts;
    if (user.lockedUntil) {
      if (user.lockedUntil > now) {
        const retryAfterSeconds = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000);
        throw new AppError(423, 'ACCOUNT_LOCKED', 'Too many failed attempts. Try again later.', { retryAfterSeconds });
      }
      await this.repo.clearLoginState(user.id); // lock expired → fresh slate
      attempts = 0;
    }

    if (!(await verifyPassword(user.passwordHash, input.password))) {
      attempts = await this.repo.incrementFailedAttempts(user.id);
      await this.audit.log({ actorId: user.id, action: 'auth.login_failed', entity: 'user', entityId: user.id, ipAddress: ctx.ip });
      if (attempts >= config.auth.maxLoginAttempts) {
        const until = new Date(now.getTime() + config.auth.lockMinutes * MINUTE);
        await this.repo.lockUser(user.id, until);
        await this.audit.log({ actorId: user.id, action: 'auth.account_locked', entity: 'user', entityId: user.id, ipAddress: ctx.ip });
      }
      throw invalidCredentials();
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'This account is deactivated. Contact the administrator.');
    }

    return this.issueOtp(user, 'LOGIN');
  }

  // ───────────── Step 2: OTP ─────────────

  async verifyLoginOtp(input: VerifyOtpBody, ctx: RequestContext): Promise<Session> {
    const userId = await this.checkOtp(input.challengeId, input.code, 'LOGIN');
    const user = await this.requireActiveUser(userId);
    await this.repo.clearLoginState(user.id, this.clock());
    await this.audit.log({ actorId: user.id, action: 'auth.login', entity: 'user', entityId: user.id, ipAddress: ctx.ip });
    return this.createSession(user, randomUUID(), ctx);
  }

  async resendOtp(input: ResendOtpBody): Promise<OtpChallenge> {
    const old = await this.repo.findOtp(input.challengeId);
    if (!old) throw invalidOtp();
    const user = await this.repo.findUserById(old.userId);
    if (!user || user.deletedAt || user.status !== 'ACTIVE') throw invalidOtp();

    const elapsed = (this.clock().getTime() - old.lastSentAt.getTime()) / 1000;
    if (elapsed < config.otp.resendCooldownSeconds) {
      const retryAfterSeconds = Math.ceil(config.otp.resendCooldownSeconds - elapsed);
      throw new AppError(429, 'OTP_RESEND_COOLDOWN', `Wait ${retryAfterSeconds}s before requesting another code.`, { retryAfterSeconds });
    }
    return this.issueOtp(user, old.purpose);
  }

  // ───────────── Sessions ─────────────

  async refresh(rawToken: string | undefined, ctx: RequestContext): Promise<Session> {
    if (!rawToken) throw new UnauthorizedError('Session expired');
    const now = this.clock();
    const record = await this.repo.findRefreshTokenByHash(sha256(rawToken));
    if (!record) throw new UnauthorizedError('Session expired');

    if (record.revokedAt) {
      // A rotated-out token is being replayed: assume theft and kill the whole login family.
      await this.repo.revokeFamily(record.familyId, now);
      await this.audit.log({ actorId: record.userId, action: 'auth.token_reuse_detected', entity: 'user', entityId: record.userId, ipAddress: ctx.ip });
      throw new UnauthorizedError('Session expired');
    }
    if (record.expiresAt <= now) throw new UnauthorizedError('Session expired');

    const user = await this.repo.findUserById(record.userId);
    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      await this.repo.revokeFamily(record.familyId, now);
      throw new UnauthorizedError('Session expired');
    }

    const next = this.newRefreshToken(user.id, record.familyId, ctx);
    const created = await this.repo.rotateRefreshToken(record.id, next.data, now);
    if (!created) {
      await this.repo.revokeFamily(record.familyId, now); // lost a rotation race → treat as reuse
      throw new UnauthorizedError('Session expired');
    }
    return this.buildSession(user, next.raw, next.data.expiresAt);
  }

  async logout(rawToken: string | undefined, actorId?: string): Promise<void> {
    if (!rawToken) return;
    const record = await this.repo.findRefreshTokenByHash(sha256(rawToken));
    if (!record) return;
    await this.repo.revokeFamily(record.familyId, this.clock());
    await this.audit.log({ actorId: actorId ?? record.userId, action: 'auth.logout', entity: 'user', entityId: record.userId });
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.requireActiveUser(userId);
    return toPublicUser(user);
  }

  // ───────────── Passwords ─────────────

  async changePassword(userId: string, input: ChangePasswordBody, ctx: RequestContext): Promise<Session> {
    const user = await this.requireActiveUser(userId);
    if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
      throw new AppError(400, 'CURRENT_PASSWORD_INCORRECT', 'Current password is incorrect');
    }
    await this.repo.updatePassword(user.id, await hashPassword(input.newPassword));
    await this.repo.revokeAllForUser(user.id, this.clock());
    await this.audit.log({ actorId: user.id, action: 'auth.password_changed', entity: 'user', entityId: user.id, ipAddress: ctx.ip });
    // Re-issue a session so the claim "mustChangePassword" is cleared and this device stays signed in.
    return this.createSession({ ...user, mustChangePassword: false }, randomUUID(), ctx);
  }

  /** Always returns a challenge, whether or not the email exists, so the endpoint cannot be used to enumerate accounts. */
  async forgotPassword(input: ForgotPasswordBody): Promise<{ challengeId: string; resendAfterSeconds: number }> {
    const resendAfterSeconds = config.otp.resendCooldownSeconds;
    const user = await this.repo.findUserByEmail(input.email);
    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      return { challengeId: randomUUID(), resendAfterSeconds };
    }
    const latest = await this.repo.findLatestOtp(user.id, 'PASSWORD_RESET');
    if (latest && !latest.consumedAt && (this.clock().getTime() - latest.lastSentAt.getTime()) / 1000 < resendAfterSeconds) {
      return { challengeId: latest.id, resendAfterSeconds };
    }
    const challenge = await this.issueOtp(user, 'PASSWORD_RESET', { awaitEmail: false });
    return { challengeId: challenge.challengeId, resendAfterSeconds };
  }

  async resetPassword(input: ResetPasswordBody, ctx: RequestContext): Promise<void> {
    const userId = await this.checkOtp(input.challengeId, input.code, 'PASSWORD_RESET');
    const user = await this.requireActiveUser(userId);
    await this.repo.updatePassword(user.id, await hashPassword(input.newPassword));
    await this.repo.revokeAllForUser(user.id, this.clock());
    await this.audit.log({ actorId: user.id, action: 'auth.password_reset', entity: 'user', entityId: user.id, ipAddress: ctx.ip });
  }

  // ───────────── Internals ─────────────

  private async issueOtp(user: AuthUserRecord, purpose: OtpPurpose, opts: { awaitEmail?: boolean } = {}): Promise<OtpChallenge> {
    const now = this.clock();
    const code = generateOtp();
    await this.repo.consumeOpenOtps(user.id, purpose, now); // only one live code per user + purpose
    const otp = await this.repo.createOtp({
      userId: user.id,
      purpose,
      codeHash: hashOtp(config.auth.accessSecret, user.id, code),
      expiresAt: new Date(now.getTime() + config.otp.ttlMinutes * MINUTE),
    });

    const sending = this.email.send(otpEmail(user.email, code, config.otp.ttlMinutes, purpose));
    if (opts.awaitEmail === false) {
      sending.catch((err) => logger.error({ err, userId: user.id }, 'Failed to send OTP email'));
    } else {
      try {
        await sending;
      } catch (err) {
        logger.error({ err, userId: user.id }, 'Failed to send OTP email');
        await this.repo.consumeOtp(otp.id, now);
        throw new AppError(502, 'EMAIL_DELIVERY_FAILED', 'We could not send the verification email. Please try again.');
      }
    }
    return {
      challengeId: otp.id,
      email: maskEmail(user.email),
      expiresInSeconds: config.otp.ttlMinutes * 60,
      resendAfterSeconds: config.otp.resendCooldownSeconds,
    };
  }

  /** Validates a code. The attempt counter is incremented first (atomically) so parallel guesses cannot beat the limit. */
  private async checkOtp(challengeId: string, code: string, purpose: OtpPurpose): Promise<string> {
    const now = this.clock();
    const otp = await this.repo.findOtp(challengeId);
    if (!otp || otp.purpose !== purpose || otp.consumedAt) throw invalidOtp();
    if (otp.expiresAt <= now) {
      throw new AppError(400, 'OTP_EXPIRED', 'That code has expired. Request a new one.');
    }

    const attempts = await this.repo.incrementOtpAttempts(otp.id);
    if (attempts > config.otp.maxAttempts) {
      await this.repo.consumeOtp(otp.id, now);
      throw new AppError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect codes. Request a new one.');
    }
    if (!safeEqual(otp.codeHash, hashOtp(config.auth.accessSecret, otp.userId, code))) {
      throw new AppError(400, 'OTP_INVALID', 'That code is not correct.', {
        attemptsRemaining: Math.max(0, config.otp.maxAttempts - attempts),
      });
    }
    if (!(await this.repo.consumeOtp(otp.id, now))) throw invalidOtp(); // single use, even under races
    return otp.userId;
  }

  private async requireActiveUser(userId: string): Promise<AuthUserRecord> {
    const user = await this.repo.findUserById(userId);
    if (!user || user.deletedAt || user.status !== 'ACTIVE') throw new UnauthorizedError();
    return user;
  }

  private newRefreshToken(userId: string, familyId: string, ctx: RequestContext) {
    const raw = randomToken();
    const expiresAt = new Date(this.clock().getTime() + config.auth.refreshTtlDays * 86_400_000);
    return {
      raw,
      data: { userId, tokenHash: sha256(raw), familyId, expiresAt, userAgent: ctx.userAgent ?? null, ipAddress: ctx.ip ?? null },
    };
  }

  private async createSession(user: AuthUserRecord, familyId: string, ctx: RequestContext): Promise<Session> {
    const next = this.newRefreshToken(user.id, familyId, ctx);
    await this.repo.createRefreshToken(next.data);
    return this.buildSession(user, next.raw, next.data.expiresAt);
  }

  private buildSession(user: AuthUserRecord, refreshToken: string, refreshExpiresAt: Date): Session {
    return {
      accessToken: signAccessToken({ sub: user.id, role: user.role, mcp: user.mustChangePassword }),
      expiresIn: accessTtlSeconds(),
      user: toPublicUser(user),
      refreshToken,
      refreshExpiresAt,
    };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword(randomToken(16));
    return this.dummyHash;
  }
}
