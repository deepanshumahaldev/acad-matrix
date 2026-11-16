import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authLimiter, authenticate, validate } from '../../common/middleware';
import { createEmailService } from '../../common/services/email';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import {
  changePasswordBody,
  forgotPasswordBody,
  loginBody,
  resendOtpBody,
  resetPasswordBody,
  verifyOtpBody,
} from './auth.schema';
import { AuthService } from './auth.service';

export function createDefaultAuthService(): AuthService {
  return new AuthService(new AuthRepository(getPrisma), createEmailService(), new PrismaAuditLogger(getPrisma));
}

export function createAuthRoutes(service: AuthService = createDefaultAuthService()): Router {
  const c = new AuthController(service);
  const router = Router();

  // Public — strict rate limit on everything that can be brute-forced or used to spam email.
  router.post('/login', authLimiter, validate({ body: loginBody }), asyncHandler(c.login));
  router.post('/verify-otp', authLimiter, validate({ body: verifyOtpBody }), asyncHandler(c.verifyOtp));
  router.post('/resend-otp', authLimiter, validate({ body: resendOtpBody }), asyncHandler(c.resendOtp));
  router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordBody }), asyncHandler(c.forgotPassword));
  router.post('/reset-password', authLimiter, validate({ body: resetPasswordBody }), asyncHandler(c.resetPassword));
  router.post('/refresh', authLimiter, asyncHandler(c.refresh));
  router.post('/logout', asyncHandler(c.logout));

  // Authenticated — usable even while a forced password change is pending.
  router.get('/me', authenticate({ allowPasswordChange: true }), asyncHandler(c.me));
  router.post(
    '/change-password',
    authenticate({ allowPasswordChange: true }),
    validate({ body: changePasswordBody }),
    asyncHandler(c.changePassword),
  );

  return router;
}
