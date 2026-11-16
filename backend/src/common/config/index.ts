import { parseEnv } from './env';

const env = parseEnv(process.env);

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  corsOrigins: env.FRONTEND_URL.split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  db: { url: env.DATABASE_URL, directUrl: env.DIRECT_URL },
  auth: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtlDays: env.JWT_REFRESH_TTL_DAYS,
    maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS,
    lockMinutes: env.ACCOUNT_LOCK_MINUTES,
    cookie: {
      name: 'AcadMatrix_rt',
      sameSite: env.COOKIE_SAME_SITE,
      domain: env.COOKIE_DOMAIN,
      // SameSite=None is only accepted by browsers on Secure cookies
      secure: env.NODE_ENV === 'production' || env.COOKIE_SAME_SITE === 'none',
    },
  },
  otp: {
    ttlMinutes: env.OTP_TTL_MINUTES,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
  },
  email: { apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM },
  storage: {
    endpoint: env.STORAGE_ENDPOINT,
    region: env.STORAGE_REGION,
    bucket: env.STORAGE_BUCKET,
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
    maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },
} as const;

export type AppConfig = typeof config;
