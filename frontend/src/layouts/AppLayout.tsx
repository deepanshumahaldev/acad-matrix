import { Link, NavLink, Outlet } from 'react-router-dom';
import { Badge, Button } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

export function AppLayout() {
  const { user, signOut } = useAuth();

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') {
      return [
        { to: '/admin', label: 'Dashboard', end: true },
        { to: '/admin/faculty', label: 'Faculty' },
        { to: '/admin/students', label: 'Students' },
        { to: '/admin/academics', label: 'Academics' },
        { to: '/admin/timetable', label: 'Timetable' },
        { to: '/admin/attendance', label: 'Attendance' },
        { to: '/admin/exams', label: 'Exams' },
        { to: '/admin/fees', label: 'Fees' },
        { to: '/admin/support', label: 'Support' },
        { to: '/notifications', label: 'Notices' },
      ];
    }
    if (user.role === 'FACULTY') {
      return [
        { to: '/faculty', label: 'Dashboard', end: true },
        { to: '/faculty/timetable', label: 'Timetable' },
        { to: '/faculty/attendance', label: 'Attendance' },
        { to: '/faculty/assignments', label: 'Assignments' },
        { to: '/faculty/exams', label: 'Exams' },
        { to: '/notifications', label: 'Notices' },
      ];
    }
    return [
      { to: '/student', label: 'Dashboard', end: true },
      { to: '/student/timetable', label: 'Timetable' },
      { to: '/student/attendance', label: 'Attendance' },
      { to: '/student/assignments', label: 'Assignments' },
      { to: '/student/exams', label: 'Exams' },
      { to: '/student/fees', label: 'Fees' },
      { to: '/student/support', label: 'Support' },
      { to: '/notifications', label: 'Notices' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold tracking-tight text-brand">
              AcadMatrix
            </Link>
            {user && (
              <nav className="hidden md:flex items-center gap-1 text-sm">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `rounded-md px-3 py-1.5 font-medium transition-colors ${
                        isActive ? 'bg-slate-100 text-brand font-semibold' : 'text-slate-600 hover:text-slate-900'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="hidden text-sm sm:block font-medium text-slate-700">
                {user.firstName} {user.lastName}
              </span>
              <Badge>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</Badge>
              <Button variant="secondary" className="h-9 text-xs" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          )}
        </div>
        {/* Mobile navigation */}
        {user && (
          <div className="flex md:hidden border-t border-line px-4 py-2 gap-2 overflow-x-auto text-xs bg-slate-50">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded whitespace-nowrap ${
                    isActive ? 'bg-white font-bold text-brand shadow-sm' : 'text-slate-600'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
