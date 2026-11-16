import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import type { StudentDashboardData } from '../types';

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface Props {
  data: StudentDashboardData;
}

export function StudentDashboardView({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Low Attendance Warning Alert */}
      {data.attendance.isLowAttendance && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <div className="flex items-center gap-2 font-bold">
            <span>⚠️ Attendance Alert:</span>
            <span>Your overall attendance is {data.attendance.overallPercentage}% (Below 75% minimum required)</span>
          </div>
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">
            Please attend all upcoming classes to avoid debarment from semester final examinations.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Attendance Percentage */}
        <Link
          to="/student/attendance"
          className="rounded-xl border border-line bg-white p-5 shadow-sm hover:border-brand transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Overall Attendance</span>
            <Badge tone={data.attendance.isLowAttendance ? 'red' : 'green'}>
              {data.attendance.overallPercentage}%
            </Badge>
          </div>
          <p
            className={`mt-2 text-3xl font-extrabold ${
              data.attendance.isLowAttendance ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {data.attendance.attendedClasses} / {data.attendance.totalClasses}
          </p>
          <p className="mt-1 text-xs text-slate-400">Classes attended this semester</p>
        </Link>

        {/* Fee Balance */}
        <Link
          to="/student/fees"
          className="rounded-xl border border-line bg-white p-5 shadow-sm hover:border-brand transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fee Balance</span>
            <Badge tone={data.fees.balanceRemaining > 0 ? 'amber' : 'green'}>
              {data.fees.balanceRemaining > 0 ? 'Dues Pending' : 'Paid in Full'}
            </Badge>
          </div>
          <p
            className={`mt-2 text-3xl font-extrabold ${
              data.fees.balanceRemaining > 0 ? 'text-indigo-600' : 'text-slate-900'
            }`}
          >
            ₹{data.fees.balanceRemaining.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total Net: ₹{data.fees.netDue.toLocaleString()}</p>
        </Link>

        {/* Today's Lectures */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Today's Lectures</span>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.todaySchedule.length}</p>
          <p className="mt-1 text-xs text-slate-400">Classes on today's schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Classes */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Today's Class Schedule</h2>
            <Link to="/student/timetable" className="text-xs text-brand font-semibold hover:underline">
              Weekly Timetable →
            </Link>
          </div>

          {data.todaySchedule.length === 0 ? (
            <p className="text-xs italic text-slate-400 py-4 text-center">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {data.todaySchedule.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{slot.subject.name}</span>
                    <div className="text-xs text-slate-500">Room {slot.room}</div>
                  </div>
                  <Badge tone="blue">
                    {formatMinutes(slot.startMinute)} - {formatMinutes(slot.endMinute)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines & Exams */}
        <div className="space-y-4">
          {/* Upcoming Assignments */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Pending Assignments</h2>
              <Link to="/student/assignments" className="text-xs text-brand font-semibold hover:underline">
                View All →
              </Link>
            </div>

            {data.upcomingAssignments.length === 0 ? (
              <p className="text-xs italic text-slate-400 py-2">No pending assignments due.</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{a.title}</span>
                      <div className="text-slate-400">{a.subject.name}</div>
                    </div>
                    <div className="text-right">
                      <Badge tone={a.status === 'GRADED' ? 'green' : a.status === 'SUBMITTED' ? 'blue' : 'amber'}>
                        {a.status}
                      </Badge>
                      <div className="mt-1 text-[11px] text-slate-400">Due {new Date(a.dueAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Exams */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Upcoming Exams</h2>
              <Link to="/student/exams" className="text-xs text-brand font-semibold hover:underline">
                Exam Schedule →
              </Link>
            </div>

            {data.upcomingExams.length === 0 ? (
              <p className="text-xs italic text-slate-400 py-2">No examinations scheduled soon.</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingExams.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{e.title}</span>
                      <div className="text-slate-400">{e.subject.name} {e.room ? `• Hall ${e.room}` : ''}</div>
                    </div>
                    <Badge tone="blue">
                      {new Date(e.examDate).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
