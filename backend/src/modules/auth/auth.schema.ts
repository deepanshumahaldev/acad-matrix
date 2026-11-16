import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number');

const challengeId = z.string().uuid();
const otpCode = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');

export const loginBody = z.object({ email, password: z.string().min(1).max(128) });
export const verifyOtpBody = z.object({ challengeId, code: otpCode });
export const resendOtpBody = z.object({ challengeId });
export const forgotPasswordBody = z.object({ email });
export const resetPasswordBody = z.object({ challengeId, code: otpCode, newPassword: passwordSchema });
export const changePasswordBody = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  });

export type LoginBody = z.infer<typeof loginBody>;
export type VerifyOtpBody = z.infer<typeof verifyOtpBody>;
export type ResendOtpBody = z.infer<typeof resendOtpBody>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBody>;
export type ChangePasswordBody = z.infer<typeof changePasswordBody>;
