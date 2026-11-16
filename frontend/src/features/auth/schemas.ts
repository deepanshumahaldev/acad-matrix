import { z } from 'zod';

// Mirrors the backend policy so users see the problem before a round trip.
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const code = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');

export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
export const otpSchema = z.object({ code });
export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ code, newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const changeSchema = z
  .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((v) => v.currentPassword !== v.newPassword, { path: ['newPassword'], message: 'Choose a different password from the current one' });
