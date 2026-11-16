import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/Skeleton';
import { getDashboardData } from '@/features/dashboard/api/dashboardApi';
import { AdminDashboardView } from '@/features/dashboard/components/AdminDashboardView';
import { FacultyDashboardView } from '@/features/dashboard/components/FacultyDashboardView';
import { StudentDashboardView } from '@/features/dashboard/components/StudentDashboardView';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

const BLURB: Record<Role, string> = {
  ADMIN: 'Manage people, academics, timetables, attendance, examinations and fees.',
  FACULTY: 'Your daily teaching schedule, class attendance entry and student coursework.',
  STUDENT: 'Your weekly timetable, attendance percentage gauge, fees and exams.',
};

export function RoleHomePage() {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  if (!user) return null;

  const adminActions = [
    { title: 'Faculty Management', desc: 'Add teachers, edit details, CSV bulk import', to: '/admin/faculty' },
    { title: 'Student Management', desc: 'Enroll students, assign sections, CSV import', to: '/admin/students' },
    { title: 'Academic Setup', desc: 'Departments, courses, semesters, subjects & allocations', to: '/admin/academics' },
    { title: 'Timetable Builder', desc: 'Weekly schedule & conflict detection', to: '/admin/timetable' },
    { title: 'Attendance Audit', desc: 'Inspect session logs & student records', to: '/admin/attendance' },
    { title: 'Examinations', desc: 'Schedule exams and record student scores', to: '/admin/exams' },
    { title: 'Fee Management', desc: 'Fee structures, student fees & receipt entry', to: '/admin/fees' },
    { title: 'Support Helpdesk', desc: 'Manage and resolve student support queries', to: '/admin/support' },
    { title: 'Announcements', desc: 'Broadcast notices to all, roles, or sections', to: '/notifications' },
  ];

  const facultyActions = [
    { title: 'My Timetable', desc: 'Weekly teaching schedule & room locations', to: '/faculty/timetable' },
    { title: 'Mark Attendance', desc: 'Record daily attendance for your allocated classes', to: '/faculty/attendance' },
    { title: 'Course Assignments', desc: 'Create assignments, grade student work & feedback', to: '/faculty/assignments' },
    { title: 'Examinations', desc: 'Schedule tests and enter student marks', to: '/faculty/exams' },
    { title: 'Post Notice', desc: 'Send announcements to your assigned sections', to: '/notifications' },
  ];

  const studentActions = [
    { title: 'Class Timetable', desc: 'Daily and weekly schedule of your section', to: '/student/timetable' },
    { title: 'My Attendance', desc: 'Overall %, subject-wise stats, and low attendance warning', to: '/student/attendance' },
    { title: 'Assignments', desc: 'Upload homework, track due dates and inspect grades', to: '/student/assignments' },
    { title: 'Exams & Grades', desc: 'Examination schedule, hall seating, and results', to: '/student/exams' },
    { title: 'Fee Statement', desc: 'Check fee dues, paid receipts and balance', to: '/student/fees' },
    { title: 'Support & Help', desc: 'Raise grievances and chat with administration', to: '/student/support' },
    { title: 'Campus Notices', desc: 'Official updates and circulars from college & teachers', to: '/notifications' },
  ];

  const cards =
    user.role === 'ADMIN'
      ? adminActions
      : user.role === 'FACULTY'
      ? facultyActions
      : studentActions;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="space-y-1 rounded-xl border border-line bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-sm text-slate-500">{BLURB[user.role]}</p>
        <div className="pt-2 text-xs text-slate-400">Signed in as {user.email} • Role: {user.role}</div>
      </section>

      {/* Role-Specific Live Dashboard Overview */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Dashboard Overview</h2>
        {isLoading && <Skeleton className="h-48 w-full" />}
        {!isLoading && dashboard && (
          <>
            {dashboard.role === 'ADMIN' && <AdminDashboardView data={dashboard} />}
            {dashboard.role === 'FACULTY' && <FacultyDashboardView data={dashboard} />}
            {dashboard.role === 'STUDENT' && <StudentDashboardView data={dashboard} />}
          </>
        )}
      </div>

      {/* Quick Navigation Shortcuts */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-xl border border-line bg-white p-5 shadow-sm hover:border-brand hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 group-hover:text-brand transition-colors text-base">
                  {c.title}
                </span>
                <span className="text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
