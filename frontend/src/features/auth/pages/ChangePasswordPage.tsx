import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '@/components/ui';
import { AuthLayout } from '@/layouts/AuthLayout';
import { changePassword } from '../api/authApi';
import { PasswordField } from '../components/PasswordField';
import { describeError } from '../errors';
import { useAuth } from '../hooks/useAuth';
import { changeSchema } from '../schemas';
import { setSession } from '../session';
import type { z } from 'zod';

type Values = z.infer<typeof changeSchema>;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const forced = user?.mustChangePassword ?? false;
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(changeSchema) });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (session) => {
      setSession(session);
      navigate('/', { replace: true });
    },
  });

  return (
    <AuthLayout
      title={forced ? 'Set your own password' : 'Change password'}
      subtitle={forced ? 'You are signed in with a temporary password. Choose a new one to continue.' : 'Other devices will be signed out.'}
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword }))} className="space-y-4" noValidate>
        {mutation.isError && <Alert>{describeError(mutation.error)}</Alert>}
        <PasswordField id="currentPassword" label={forced ? 'Temporary password' : 'Current password'} autoComplete="current-password" autoFocus error={errors.currentPassword?.message} {...register('currentPassword')} />
        <PasswordField id="newPassword" label="New password" autoComplete="new-password" hint="At least 8 characters with upper and lower case letters and a number." error={errors.newPassword?.message} {...register('newPassword')} />
        <PasswordField id="confirmPassword" label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" fullWidth loading={mutation.isPending}>Save password</Button>
        <Button type="button" variant="ghost" fullWidth onClick={() => void signOut()}>Sign out</Button>
      </form>
    </AuthLayout>
  );
}
