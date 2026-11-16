import { createBrowserRouter, Link } from 'react-router-dom';
import { AcademicSetupPage } from '@/features/academics/pages/AcademicSetupPage';
import { FacultyAssignmentsPage } from '@/features/assignments/pages/FacultyAssignmentsPage';
import { StudentAssignmentsPage } from '@/features/assignments/pages/StudentAssignmentsPage';
import { AdminAttendancePage } from '@/features/attendance/pages/AdminAttendancePage';
import { FacultyAttendancePage } from '@/features/attendance/pages/FacultyAttendancePage';
import { StudentAttendancePage } from '@/features/attendance/pages/StudentAttendancePage';
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { RoleHomePage } from '@/features/auth/pages/RoleHomePage';
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage';
import { AdminExamsPage } from '@/features/exams/pages/AdminExamsPage';
import { StudentExamsPage } from '@/features/exams/pages/StudentExamsPage';
import { AdminFeesPage } from '@/features/fees/pages/AdminFeesPage';
import { StudentFeesPage } from '@/features/fees/pages/StudentFeesPage';
import { StatusPage } from '@/features/health/pages/StatusPage';
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage';
import { AdminSupportPage } from '@/features/support/pages/AdminSupportPage';
import { StudentSupportPage } from '@/features/support/pages/StudentSupportPage';
import { TimetablePage } from '@/features/timetable/pages/TimetablePage';
import { FacultyListPage } from '@/features/users/pages/FacultyListPage';
import { StudentListPage } from '@/features/users/pages/StudentListPage';
import { AppLayout } from '@/layouts/AppLayout';
import { GuestOnly, HomeRedirect, RequireAuth, RequireRole } from './guards';

const NotFound = () => (
  <div className="mx-auto max-w-sm space-y-2 p-12">
    <h1 className="text-xl font-semibold">Page not found</h1>
    <Link to="/" className="text-brand hover:underline">Go to your home page</Link>
  </div>
);

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/verify-otp', element: <VerifyOtpPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomeRedirect /> },

          // Common Notifications
          { path: '/notifications', element: <NotificationsPage /> },

          // Admin Routes
          { path: '/admin', element: <RequireRole roles={['ADMIN']}><RoleHomePage /></RequireRole> },
          { path: '/admin/faculty', element: <RequireRole roles={['ADMIN']}><FacultyListPage /></RequireRole> },
          { path: '/admin/students', element: <RequireRole roles={['ADMIN']}><StudentListPage /></RequireRole> },
          { path: '/admin/academics', element: <RequireRole roles={['ADMIN']}><AcademicSetupPage /></RequireRole> },
          { path: '/admin/timetable', element: <RequireRole roles={['ADMIN']}><TimetablePage /></RequireRole> },
          { path: '/admin/attendance', element: <RequireRole roles={['ADMIN']}><AdminAttendancePage /></RequireRole> },
          { path: '/admin/exams', element: <RequireRole roles={['ADMIN']}><AdminExamsPage /></RequireRole> },
          { path: '/admin/fees', element: <RequireRole roles={['ADMIN']}><AdminFeesPage /></RequireRole> },
          { path: '/admin/support', element: <RequireRole roles={['ADMIN']}><AdminSupportPage /></RequireRole> },

          // Faculty Routes
          { path: '/faculty', element: <RequireRole roles={['FACULTY']}><RoleHomePage /></RequireRole> },
          { path: '/faculty/timetable', element: <RequireRole roles={['FACULTY']}><TimetablePage /></RequireRole> },
          { path: '/faculty/attendance', element: <RequireRole roles={['FACULTY']}><FacultyAttendancePage /></RequireRole> },
          { path: '/faculty/assignments', element: <RequireRole roles={['FACULTY']}><FacultyAssignmentsPage /></RequireRole> },
          { path: '/faculty/exams', element: <RequireRole roles={['FACULTY']}><AdminExamsPage /></RequireRole> },

          // Student Routes
          { path: '/student', element: <RequireRole roles={['STUDENT']}><RoleHomePage /></RequireRole> },
          { path: '/student/timetable', element: <RequireRole roles={['STUDENT']}><TimetablePage /></RequireRole> },
          { path: '/student/attendance', element: <RequireRole roles={['STUDENT']}><StudentAttendancePage /></RequireRole> },
          { path: '/student/assignments', element: <RequireRole roles={['STUDENT']}><StudentAssignmentsPage /></RequireRole> },
          { path: '/student/exams', element: <RequireRole roles={['STUDENT']}><StudentExamsPage /></RequireRole> },
          { path: '/student/fees', element: <RequireRole roles={['STUDENT']}><StudentFeesPage /></RequireRole> },
          { path: '/student/support', element: <RequireRole roles={['STUDENT']}><StudentSupportPage /></RequireRole> },
        ],
      },
    ],
  },
  { path: '/status', element: <StatusPage /> },
  { path: '*', element: <NotFound /> },
]);
