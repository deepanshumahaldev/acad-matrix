import { randomUUID } from 'node:crypto';
import type { AuditEntry, AuditLogger } from '../../src/common/services/audit';
import type { EmailMessage, EmailService } from '../../src/common/services/email';
import { hashPassword } from '../../src/common/utils/password';
import { AuthService } from '../../src/modules/auth/auth.service';
import type {
  AuthRepo,
  AuthUserRecord,
  NewRefreshToken,
  OtpPurpose,
  OtpRecord,
  RefreshTokenRecord,
} from '../../src/modules/auth/auth.types';

export class FakeAuthRepo implements AuthRepo {
  users = new Map<string, AuthUserRecord>();
  otps = new Map<string, OtpRecord>();
  tokens = new Map<string, RefreshTokenRecord & { replacedById?: string }>();

  async findUserByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }
  async incrementFailedAttempts(id: string) {
    const u = this.users.get(id)!;
    u.failedLoginAttempts += 1;
    return u.failedLoginAttempts;
  }
  async lockUser(id: string, until: Date) {
    this.users.get(id)!.lockedUntil = until;
  }
  async clearLoginState(id: string) {
    const u = this.users.get(id)!;
    u.failedLoginAttempts = 0;
    u.lockedUntil = null;
  }
  async updatePassword(id: string, passwordHash: string) {
    const u = this.users.get(id)!;
    Object.assign(u, { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null });
  }
  async createOtp(d: Pick<OtpRecord, 'userId' | 'purpose' | 'codeHash' | 'expiresAt'>) {
    const o: OtpRecord = { id: randomUUID(), ...d, attempts: 0, consumedAt: null, lastSentAt: clockNow() };
    this.otps.set(o.id, o);
    return o;
  }
  async findOtp(id: string) {
    return this.otps.get(id) ?? null;
  }
  async findLatestOtp(userId: string, purpose: OtpPurpose) {
    return [...this.otps.values()].reverse().find((o) => o.userId === userId && o.purpose === purpose) ?? null;
  }
  async incrementOtpAttempts(id: string) {
    const o = this.otps.get(id)!;
    o.attempts += 1;
    return o.attempts;
  }
  async consumeOtp(id: string, at: Date) {
    const o = this.otps.get(id)!;
    if (o.consumedAt) return false;
    o.consumedAt = at;
    return true;
  }
  async consumeOpenOtps(userId: string, purpose: OtpPurpose, at: Date) {
    for (const o of this.otps.values()) if (o.userId === userId && o.purpose === purpose && !o.consumedAt) o.consumedAt = at;
  }
  async createRefreshToken(d: NewRefreshToken) {
    const t = { id: randomUUID(), revokedAt: null, ...d };
    this.tokens.set(t.id, t);
    return t;
  }
  async findRefreshTokenByHash(hash: string) {
    return [...this.tokens.values()].find((t) => t.tokenHash === hash) ?? null;
  }
  async rotateRefreshToken(oldId: string, next: NewRefreshToken, at: Date) {
    const old = this.tokens.get(oldId)!;
    if (old.revokedAt) return null;
    old.revokedAt = at;
    const t = await this.createRefreshToken(next);
    old.replacedById = t.id;
    return t;
  }
  async revokeFamily(familyId: string, at: Date) {
    for (const t of this.tokens.values()) if (t.familyId === familyId && !t.revokedAt) t.revokedAt = at;
  }
  async revokeAllForUser(userId: string, at: Date) {
    for (const t of this.tokens.values()) if (t.userId === userId && !t.revokedAt) t.revokedAt = at;
  }
}

// A single mutable test clock shared by the fake repo and the service.
let current = new Date('2026-11-16T10:00:00Z');
export const clockNow = () => new Date(current);
export const advance = (ms: number) => void (current = new Date(current.getTime() + ms));
export const resetClock = () => void (current = new Date('2026-11-16T10:00:00Z'));

export class FakeEmail implements EmailService {
  sent: EmailMessage[] = [];
  fail = false;
  async send(m: EmailMessage) {
    if (this.fail) throw new Error('smtp down');
    this.sent.push(m);
  }
  /** Extracts the 6-digit code from the last email. */
  lastCode(): string {
    return /\b(\d{6})\b/.exec(this.sent.at(-1)!.text)![1]!;
  }
}

export class FakeAudit implements AuditLogger {
  entries: AuditEntry[] = [];
  async log(e: AuditEntry) {
    this.entries.push(e);
  }
  actions = () => this.entries.map((e) => e.action);
}

export const PASSWORD = 'Str0ngPass';

export async function buildHarness(opts: { mustChangePassword?: boolean; role?: 'ADMIN' | 'FACULTY' | 'STUDENT' } = {}) {
  resetClock();
  const repo = new FakeAuthRepo();
  const email = new FakeEmail();
  const audit = new FakeAudit();
  const service = new AuthService(repo, email, audit, clockNow);
  const user: AuthUserRecord = {
    id: randomUUID(),
    email: 'asha@AcadMatrix.test',
    passwordHash: await hashPassword(PASSWORD),
    role: opts.role ?? 'STUDENT',
    status: 'ACTIVE',
    firstName: 'Asha',
    lastName: 'Rao',
    mustChangePassword: opts.mustChangePassword ?? false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    deletedAt: null,
  };
  repo.users.set(user.id, user);
  return { repo, email, audit, service, user };
}
