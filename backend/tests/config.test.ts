import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/common/config/env';

const base = {
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  DIRECT_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('parseEnv', () => {
  it('applies defaults', () => {
    const env = parseEnv(base);
    expect(env.PORT).toBe(4000);
    expect(env.OTP_TTL_MINUTES).toBe(5);
    expect(env.MAX_LOGIN_ATTEMPTS).toBe(5);
  });

  it('fails fast with a readable message when required vars are missing', () => {
    expect(() => parseEnv({})).toThrow(/Invalid environment configuration/);
  });

  it('rejects short or identical JWT secrets', () => {
    expect(() => parseEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => parseEnv({ ...base, JWT_REFRESH_SECRET: base.JWT_ACCESS_SECRET })).toThrow(
      /must differ/,
    );
  });

  it('requires email and storage settings in production only', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).toThrow(/RESEND_API_KEY/);
    expect(() => parseEnv({ ...base, NODE_ENV: 'development' })).not.toThrow();
  });
});
