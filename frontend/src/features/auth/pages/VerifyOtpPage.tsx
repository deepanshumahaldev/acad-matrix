import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { AuthLayout } from '@/layouts/AuthLayout';
import { resendOtp, verifyOtp } from '../api/authApi';
import { ResendCode } from '../components/ResendCode';
import { describeError } from '../errors';
import { otpSchema } from '../schemas';
import { setSession } from '../session';
import type { OtpChallenge } from '../types';
import type { z } from 'zod';

type Values = z.infer<typeof otpSchema>;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const initial = (useLocation().state as { challenge?: OtpChallenge } | null)?.challenge;
  const [challenge, setChallenge] = useState<OtpChallenge | undefined>(initial);
  const [resent, setResent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(otpSchema) });

  const verify = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (session) => {
      setSession(session);
      navigate('/', { replace: true });
    },
    onError: () => reset(),
  });

  const resend = useMutation({
    mutationFn: resendOtp,
    onSuccess: (next) => {
      setChallenge(next);
      setResent(true);
      verify.reset();
      reset();
    },
  });

  // Opening this page directly (or refreshing) loses the challenge; start over.
  if (!challenge) return <Navigate to="/login" replace />;

  return (
    <AuthLayout title="Check your email" subtitle={`We sent a 6-digit code to ${challenge.email}. It expires in ${Math.round(challenge.expiresInSeconds / 60)} minutes.`}>
      <form onSubmit={handleSubmit((v) => verify.mutate({ challengeId: challenge.challengeId, code: v.code }))} className="space-y-4" noValidate>
        {resent && !verify.isError && <Alert tone="info">A new code is on its way.</Alert>}
        {verify.isError && <Alert>{describeError(verify.error)}</Alert>}
        {resend.isError && <Alert>{describeError(resend.error)}</Alert>}

        <FormField label="Verification code" htmlFor="code" error={errors.code?.message}>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            invalid={!!errors.code}
            className="text-center text-xl tracking-[0.5em]"
            {...register('code')}
          />
        </FormField>

        <Button type="submit" fullWidth loading={verify.isPending}>Sign in</Button>
        {/* key restarts the countdown whenever a new challenge is issued */}
        <ResendCode key={challenge.challengeId} seconds={challenge.resendAfterSeconds} pending={resend.isPending} onResend={() => resend.mutate({ challengeId: challenge.challengeId })} />
        <p className="text-center text-sm">
          <Link to="/login" className="font-medium text-brand hover:underline">Use a different account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
