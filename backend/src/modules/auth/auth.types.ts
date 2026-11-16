import type { RoleName } from '../../common/constants';

export type OtpPurpose = 'LOGIN' | 'PASSWORD_RESET';

/** Persistence-level shapes. Deliberately independent of Prisma types so the service is unit-testable. */
export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: RoleName;
  status: 'ACTIVE' | 'INACTIVE';
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  deletedAt: Date | null;
}

export interface OtpRecord {
  id: string;
  userId: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  lastSentAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface AuthRepo {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(id: string): Promise<AuthUserRecord | null>;
  incrementFailedAttempts(userId: string): Promise<number>;
  lockUser(userId: string, until: Date): Promise<void>;
  clearLoginState(userId: string, lastLoginAt?: Date): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;

  createOtp(data: Pick<OtpRecord, 'userId' | 'purpose' | 'codeHash' | 'expiresAt'>): Promise<OtpRecord>;
  findOtp(id: string): Promise<OtpRecord | null>;
  findLatestOtp(userId: string, purpose: OtpPurpose): Promise<OtpRecord | null>;
  incrementOtpAttempts(id: string): Promise<number>;
  /** Atomically marks unconsumed → consumed. Returns false if someone else consumed it first. */
  consumeOtp(id: string, at: Date): Promise<boolean>;
  consumeOpenOtps(userId: string, purpose: OtpPurpose, at: Date): Promise<void>;

  createRefreshToken(data: NewRefreshToken): Promise<RefreshTokenRecord>;
  findRefreshTokenByHash(hash: string): Promise<RefreshTokenRecord | null>;
  /** Revokes `oldId` and creates its successor in one transaction. Returns null if `oldId` was already revoked. */
  rotateRefreshToken(oldId: string, next: NewRefreshToken, at: Date): Promise<RefreshTokenRecord | null>;
  revokeFamily(familyId: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}

export interface PublicUser {
  id: string;
  email: string;
  role: RoleName;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
}

export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

export interface OtpChallenge {
  challengeId: string;
  email: string; // masked
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface Session {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
  /** Raw refresh token — the controller puts it in an httpOnly cookie, never in the JSON body. */
  refreshToken: string;
  refreshExpiresAt: Date;
}
