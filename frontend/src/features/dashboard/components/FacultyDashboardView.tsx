import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import type { FacultyDashboardData } from '../types';

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface Props {
  data: FacultyDashboardData;
}

export function FacultyDashboardView({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Metric Highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Today's Lectures</span>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{data.todaySchedule.length}</p>
          <p className="mt-1 text-xs text-slate-400">Scheduled for today</p>
        </div>

        <Link
          to="/faculty/assignments"
          className="rounded-xl border border-line bg-white p-5 shadow-sm hover:border-brand transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ungraded Submissions</span>
            {data.pendingGradingCount > 0 && <Badge tone="amber">Action Needed</Badge>}
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{data.pendingGradingCount}</p>
          <p className="mt-1 text-xs text-slate-400">Student submissions waiting for review</p>
        </Link>

        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Attendance Logged (7 Days)</span>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{data.recentAttendanceCount}</p>
          <p className="mt-1 text-xs text-slate-400">Sessions recorded</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Teaching Schedule */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Today's Class Schedule</h2>
            <Link to="/faculty/timetable" className="text-xs text-brand font-semibold hover:underline">
              Full Timetable →
            </Link>
          </div>

          {data.todaySchedule.length === 0 ? (
            <p className="text-xs italic text-slate-400 py-4 text-center">No teaching slots scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {data.todaySchedule.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{slot.subject.name}</span>
                    <div className="text-xs text-slate-500">
                      Sec {slot.section.name} • Room {slot.room}
                    </div>
                  </div>
                  <Badge tone="blue">
                    {formatMinutes(slot.startMinute)} - {formatMinutes(slot.endMinute)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Assignments */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Active Coursework</h2>
            <Link to="/faculty/assignments" className="text-xs text-brand font-semibold hover:underline">
              All Assignments →
            </Link>
          </div>

          {data.activeAssignments.length === 0 ? (
            <p className="text-xs italic text-slate-400 py-4 text-center">No active assignments created yet.</p>
          ) : (
            <div className="space-y-2">
              {data.activeAssignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-900">{a.title}</span>
                    <div className="text-xs text-slate-500">{a.subject.name}</div>
                  </div>
                  <div className="text-right">
                    <Badge tone="gray">{a.submissionsCount} submitted</Badge>
                    <div className="mt-1 text-[11px] text-slate-400">Due {new Date(a.dueAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
