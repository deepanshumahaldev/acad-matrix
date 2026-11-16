import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { AuthLayout } from '@/layouts/AuthLayout';
import { login } from '../api/authApi';
import { PasswordField } from '../components/PasswordField';
import { describeError } from '../errors';
import { loginSchema } from '../schemas';
import type { z } from 'zod';

type Values = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (challenge) => navigate('/verify-otp', { state: { challenge } }),
  });

  return (
    <AuthLayout title="Sign in" subtitle="Use your college email. We will send a 6-digit code to confirm it is you.">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        {notice && <Alert tone="success">{notice}</Alert>}
        {mutation.isError && <Alert>{describeError(mutation.error)}</Alert>}

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" autoFocus invalid={!!errors.email} {...register('email')} />
        </FormField>
        <PasswordField id="password" label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />

        <Button type="submit" fullWidth loading={mutation.isPending}>Continue</Button>
        <p className="text-center text-sm">
          <Link to="/forgot-password" className="font-medium text-brand hover:underline">Forgot your password?</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
