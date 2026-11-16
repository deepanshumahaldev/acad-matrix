import type { RequestHandler } from 'express';
import type { RoleName } from '../constants';
import { AppError, ForbiddenError, UnauthorizedError } from '../errors';
import { verifyAccessToken } from '../utils/jwt';

interface AuthOptions {
  /** Let a user who still must change their password through (change-password, me, logout). */
  allowPasswordChange?: boolean;
}

/** Verifies the Bearer access token and attaches req.user. Stateless: no DB hit per request. */
export const authenticate =
  (options: AuthOptions = {}): RequestHandler =>
  (req, _res, next) => {
    try {
      const header = req.header('authorization');
      if (!header?.startsWith('Bearer ')) throw new UnauthorizedError();
      const claims = verifyAccessToken(header.slice(7).trim());
      req.user = { id: claims.sub, role: claims.role, mustChangePassword: claims.mcp };
      if (claims.mcp && !options.allowPasswordChange) {
        throw new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'You must change your password before continuing');
      }
      next();
    } catch (err) {
      next(err);
    }
  };

/** Must run after authenticate(). Server-side RBAC on every protected route. */
export const requireRole =
  (...roles: RoleName[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
