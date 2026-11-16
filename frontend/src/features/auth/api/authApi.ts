import { api } from '@/lib/apiClient';
import type { OtpChallenge, ResetChallenge, SessionPayload } from '../types';

const base = '/api/v1/auth';

export const login = async (body: { email: string; password: string }) =>
  (await api.post<OtpChallenge>(`${base}/login`, body)).data;

export const verifyOtp = async (body: { challengeId: string; code: string }) =>
  (await api.post<SessionPayload>(`${base}/verify-otp`, body)).data;

export const resendOtp = async (body: { challengeId: string }) =>
  (await api.post<OtpChallenge>(`${base}/resend-otp`, body)).data;

export const forgotPassword = async (body: { email: string }) =>
  (await api.post<ResetChallenge>(`${base}/forgot-password`, body)).data;

export const resetPassword = async (body: { challengeId: string; code: string; newPassword: string }) =>
  (await api.post<{ passwordReset: true }>(`${base}/reset-password`, body)).data;

export const changePassword = async (body: { currentPassword: string; newPassword: string }) =>
  (await api.post<SessionPayload>(`${base}/change-password`, body)).data;

export const logout = async () => (await api.post<{ loggedOut: true }>(`${base}/logout`)).data;
