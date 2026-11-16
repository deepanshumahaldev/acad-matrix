import 'dotenv/config';
import { z } from 'zod';

const int = (def: number) => z.coerce.number().int().positive().default(def);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: int(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    FRONTEND_URL: z.string().min(1),

    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL_DAYS: int(7),
    MAX_LOGIN_ATTEMPTS: int(5),
    ACCOUNT_LOCK_MINUTES: int(15),

    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_DOMAIN: z.string().optional(),

    OTP_TTL_MINUTES: int(5),
    OTP_MAX_ATTEMPTS: int(5),
    OTP_RESEND_COOLDOWN_SECONDS: int(60),

    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),

    STORAGE_ENDPOINT: z.string().optional(),
    STORAGE_REGION: z.string().default('auto'),
    STORAGE_BUCKET: z.string().optional(),
    STORAGE_ACCESS_KEY_ID: z.string().optional(),
    STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
    MAX_UPLOAD_MB: int(10),

    RATE_LIMIT_WINDOW_MS: int(15 * 60 * 1000),
    RATE_LIMIT_MAX: int(300),
    AUTH_RATE_LIMIT_MAX: int(10),
  })
  .superRefine((env, ctx) => {
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'must differ from JWT_ACCESS_SECRET',
      });
    }
    if (env.NODE_ENV === 'production') {
      const required = [
        'RESEND_API_KEY',
        'EMAIL_FROM',
        'STORAGE_ENDPOINT',
        'STORAGE_BUCKET',
        'STORAGE_ACCESS_KEY_ID',
        'STORAGE_SECRET_ACCESS_KEY',
      ] as const;
      for (const key of required) {
        if (!env[key]) {
          ctx.addIssue({ code: 'custom', path: [key], message: 'required in production' });
        }
      }
    }
  });

export type Env = z.infer<typeof schema>;

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  return result.data;
}
