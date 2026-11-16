import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import type { RoleName } from '../constants';
import { UnauthorizedError } from '../errors';

const ISSUER = 'AcadMatrix-api';
const AUDIENCE = 'AcadMatrix-app';

export interface AccessClaims {
  sub: string;
  role: RoleName;
  /** "must change password" — lets middleware gate every route until the password is changed. */
  mcp: boolean;
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, config.auth.accessSecret, {
    algorithm: 'HS256',
    expiresIn: config.auth.accessTtl as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  try {
    const decoded = jwt.verify(token, config.auth.accessSecret, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof decoded === 'string' || !decoded.sub) throw new Error('bad payload');
    return { sub: decoded.sub, role: decoded.role as RoleName, mcp: Boolean(decoded.mcp) };
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

/** Seconds until an access token issued now expires (returned to clients as expiresIn). */
export function accessTtlSeconds(): number {
  const m = /^(\d+)\s*([smhd])$/.exec(config.auth.accessTtl);
  if (!m) return 900;
  const n = Number(m[1]);
  return n * { s: 1, m: 60, h: 3600, d: 86400 }[m[2] as 's' | 'm' | 'h' | 'd'];
}
