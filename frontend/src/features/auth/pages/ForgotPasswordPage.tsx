import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { AuthLayout } from '@/layouts/AuthLayout';
import { forgotPassword } from '../api/authApi';
import { describeError } from '../errors';
import { forgotSchema } from '../schemas';
import type { z } from 'zod';

type Values = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(forgotSchema) });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (challenge, vars) => navigate('/reset-password', { state: { challenge, email: vars.email } }),
  });

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your college email and we will send a code if the account exists.">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        {mutation.isError && <Alert>{describeError(mutation.error)}</Alert>}
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" autoFocus invalid={!!errors.email} {...register('email')} />
        </FormField>
        <Button type="submit" fullWidth loading={mutation.isPending}>Send code</Button>
        <p className="text-center text-sm">
          <Link to="/login" className="font-medium text-brand hover:underline">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
