import type { PrismaClient, User } from '@prisma/client';
import type {
  AuthRepo,
  AuthUserRecord,
  NewRefreshToken,
  OtpPurpose,
  OtpRecord,
  RefreshTokenRecord,
} from './auth.types';

const toUser = (u: User): AuthUserRecord => ({
  id: u.id,
  email: u.email,
  passwordHash: u.passwordHash,
  role: u.role,
  status: u.status,
  firstName: u.firstName,
  lastName: u.lastName,
  mustChangePassword: u.mustChangePassword,
  failedLoginAttempts: u.failedLoginAttempts,
  lockedUntil: u.lockedUntil,
  deletedAt: u.deletedAt,
});

/** Database access only — no business rules live here. */
export class AuthRepository implements AuthRepo {
  constructor(private readonly getDb: () => PrismaClient) {}

  private get db() {
    return this.getDb();
  }

  async findUserByEmail(email: string) {
    const u = await this.db.user.findUnique({ where: { email } });
    return u ? toUser(u) : null;
  }

  async findUserById(id: string) {
    const u = await this.db.user.findUnique({ where: { id } });
    return u ? toUser(u) : null;
  }

  async incrementFailedAttempts(userId: string) {
    const u = await this.db.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    return u.failedLoginAttempts;
  }

  async lockUser(userId: string, until: Date) {
    await this.db.user.update({ where: { id: userId }, data: { lockedUntil: until } });
  }

  async clearLoginState(userId: string, lastLoginAt?: Date) {
    await this.db.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null, ...(lastLoginAt ? { lastLoginAt } : {}) },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.db.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async createOtp(data: Pick<OtpRecord, 'userId' | 'purpose' | 'codeHash' | 'expiresAt'>) {
    return this.db.otpCode.create({ data });
  }

  async findOtp(id: string) {
    return this.db.otpCode.findUnique({ where: { id } });
  }

  async findLatestOtp(userId: string, purpose: OtpPurpose) {
    return this.db.otpCode.findFirst({ where: { userId, purpose }, orderBy: { createdAt: 'desc' } });
  }

  async incrementOtpAttempts(id: string) {
    const o = await this.db.otpCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    return o.attempts;
  }

  async consumeOtp(id: string, at: Date) {
    const r = await this.db.otpCode.updateMany({ where: { id, consumedAt: null }, data: { consumedAt: at } });
    return r.count === 1;
  }

  async consumeOpenOtps(userId: string, purpose: OtpPurpose, at: Date) {
    await this.db.otpCode.updateMany({ where: { userId, purpose, consumedAt: null }, data: { consumedAt: at } });
  }

  async createRefreshToken(data: NewRefreshToken): Promise<RefreshTokenRecord> {
    return this.db.refreshToken.create({ data });
  }

  async findRefreshTokenByHash(hash: string) {
    return this.db.refreshToken.findUnique({ where: { tokenHash: hash } });
  }

  async rotateRefreshToken(oldId: string, next: NewRefreshToken, at: Date) {
    return this.db.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: { id: oldId, revokedAt: null },
        data: { revokedAt: at },
      });
      if (revoked.count !== 1) return null;
      const created = await tx.refreshToken.create({ data: next });
      await tx.refreshToken.update({ where: { id: oldId }, data: { replacedById: created.id } });
      return created;
    });
  }

  async revokeFamily(familyId: string, at: Date) {
    await this.db.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: at } });
  }

  async revokeAllForUser(userId: string, at: Date) {
    await this.db.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: at } });
  }
}
