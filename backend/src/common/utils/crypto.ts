import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

/** Opaque, URL-safe random token (used for refresh tokens). */
export const randomToken = (bytes = 48): string => randomBytes(bytes).toString('base64url');

/** Uniformly random 6-digit code, zero padded. */
export const generateOtp = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0');

/** Keyed hash so a leaked OTP table alone cannot be brute-forced offline. Bound to the user id. */
export const hashOtp = (secret: string, userId: string, code: string): string =>
  createHmac('sha256', secret).update(`${userId}:${code}`).digest('hex');

/** Generates a compliant temporary password (e.g., "Temp@9xK2A4!"). */
export const generateTemporaryPassword = (): string => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  let result = 'Temp@';
  for (let i = 0; i < 4; i++) {
    result += letters[randomInt(0, letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    result += digits[randomInt(0, digits.length)];
  }
  result += symbols[randomInt(0, symbols.length)];
  return result;
};

export const safeEqual = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};
