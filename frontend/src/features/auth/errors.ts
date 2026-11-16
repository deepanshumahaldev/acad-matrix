import { ApiError } from '@/lib/apiClient';

/** Turns an API failure into one plain sentence the user can act on. */
export function describeError(err: unknown): string {
  if (!(err instanceof ApiError)) return 'We could not reach the server. Check your connection and try again.';
  const d = (err.details ?? {}) as { attemptsRemaining?: number; retryAfterSeconds?: number };
  switch (err.code) {
    case 'OTP_INVALID':
      return d.attemptsRemaining !== undefined
        ? `That code is not correct. ${d.attemptsRemaining} ${d.attemptsRemaining === 1 ? 'attempt' : 'attempts'} left.`
        : 'That code is not valid. Request a new one.';
    case 'ACCOUNT_LOCKED': {
      const mins = Math.max(1, Math.ceil((d.retryAfterSeconds ?? 60) / 60));
      return `Too many failed sign-ins. Try again in ${mins} ${mins === 1 ? 'minute' : 'minutes'}, or reset your password.`;
    }
    case 'TOO_MANY_REQUESTS':
      return 'Too many attempts. Wait a few minutes and try again.';
    default:
      return err.message;
  }
}
