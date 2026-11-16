import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { AuthLayout } from '@/layouts/AuthLayout';
import { resendOtp, resetPassword } from '../api/authApi';
import { PasswordField } from '../components/PasswordField';
import { ResendCode } from '../components/ResendCode';
import { describeError } from '../errors';
import { resetSchema } from '../schemas';
import type { ResetChallenge } from '../types';
import type { z } from 'zod';

type Values = z.infer<typeof resetSchema>;
interface State { challenge?: ResetChallenge; email?: string }

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const state = useLocation().state as State | null;
  const [challenge, setChallenge] = useState<ResetChallenge | undefined>(state?.challenge);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(resetSchema) });

  const reset = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => navigate('/login', { replace: true, state: { notice: 'Password updated. Sign in with your new password.' } }),
  });

  const resend = useMutation({
    mutationFn: resendOtp,
    onSuccess: (next) => setChallenge({ challengeId: next.challengeId, resendAfterSeconds: next.resendAfterSeconds }),
  });

  if (!challenge) return <Navigate to="/forgot-password" replace />;

  return (
    <AuthLayout title="Choose a new password" subtitle={`Enter the code we emailed${state?.email ? ` to ${state.email}` : ''}, then set a new password.`}>
      <form
        onSubmit={handleSubmit((v) => reset.mutate({ challengeId: challenge.challengeId, code: v.code, newPassword: v.newPassword }))}
        className="space-y-4"
        noValidate
      >
        {reset.isError && <Alert>{describeError(reset.error)}</Alert>}
        {resend.isError && <Alert>{describeError(resend.error)}</Alert>}

        <FormField label="Verification code" htmlFor="code" error={errors.code?.message}>
          <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus invalid={!!errors.code} className="text-center text-xl tracking-[0.5em]" {...register('code')} />
        </FormField>
        <PasswordField id="newPassword" label="New password" autoComplete="new-password" hint="At least 8 characters with upper and lower case letters and a number." error={errors.newPassword?.message} {...register('newPassword')} />
        <PasswordField id="confirmPassword" label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

        <Button type="submit" fullWidth loading={reset.isPending}>Update password</Button>
        <ResendCode key={challenge.challengeId} seconds={challenge.resendAfterSeconds} pending={resend.isPending} onResend={() => resend.mutate({ challengeId: challenge.challengeId })} />
        <p className="text-center text-sm">
          <Link to="/login" className="font-medium text-brand hover:underline">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
