import rateLimit, { type RateLimitExceededEventHandler } from 'express-rate-limit';
import { config } from '../config';
import { TooManyRequestsError } from '../errors';

const handler: RateLimitExceededEventHandler = (_req, _res, next) => {
  next(new TooManyRequestsError());
};

/** Applied globally to /api. */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest,
  handler,
});

/** Strict limiter for login, OTP verify/resend and password reset (mounted in the auth module). */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.authMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest,
  handler,
});
