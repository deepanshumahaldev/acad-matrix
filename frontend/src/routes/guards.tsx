import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Role } from '@/features/auth/types';

function Booting() {
  return (
    <div className="mx-auto max-w-sm space-y-3 p-12" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

/** Signed-in users only. Users who must change their password are held on /change-password. */
export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Booting />;
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  return <Outlet />;
}

/** Login, OTP and reset screens: bounce already-signed-in users to their home. */
export function GuestOnly() {
  const { status } = useAuth();
  if (status === 'loading') return <Booting />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** UX-level guard only; the server enforces the same roles on every API route. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} replace />;
}
