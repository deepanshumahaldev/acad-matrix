import { Alert, Badge } from '@/components/ui';
import type { StudentAttendanceSummary } from '../types';

export function AttendanceStatsCard({ summary }: { summary: StudentAttendanceSummary }) {
  const isDanger = summary.percentage < 75;

  return (
    <div className="space-y-4">
      {isDanger && (
        <Alert tone="error">
          <strong>Low Attendance Warning:</strong> Your overall attendance is {summary.percentage}%, which is below the mandatory 75% threshold.
        </Alert>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`rounded-xl border p-5 bg-white shadow-sm ${isDanger ? 'border-red-300 ring-1 ring-red-200' : 'border-line'}`}>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${isDanger ? 'text-red-600' : 'text-emerald-600'}`}>
              {summary.percentage}%
            </span>
            <Badge tone={isDanger ? 'red' : 'green'}>{isDanger ? 'Below 75%' : 'Good'}</Badge>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isDanger ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, summary.percentage)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-line p-5 bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Held</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{summary.totalClasses}</div>
          <p className="mt-1 text-xs text-slate-400">Total sessions conducted</p>
        </div>

        <div className="rounded-xl border border-line p-5 bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Attended</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">{summary.attendedClasses}</div>
          <p className="mt-1 text-xs text-slate-400">Present or late arrivals</p>
        </div>

        <div className="rounded-xl border border-line p-5 bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Missed</div>
          <div className="mt-2 text-3xl font-bold text-red-600">{summary.absentClasses}</div>
          <p className="mt-1 text-xs text-slate-400">Absences recorded</p>
        </div>
      </div>

      {/* Subject-wise Breakdown */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Subject-wise Attendance Breakdown</h2>
        {summary.bySubject.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No subject attendance records available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.bySubject.map((sub) => {
              const subDanger = sub.percentage < 75;
              return (
                <div key={sub.subjectId} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{sub.subjectName}</span>
                      <span className="ml-2 font-mono text-xs text-slate-500 font-semibold">{sub.subjectCode}</span>
                    </div>
                    <Badge tone={subDanger ? 'red' : 'green'}>{sub.percentage}%</Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${subDanger ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, sub.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pt-1">
                    <span>{sub.attendedClasses} attended of {sub.totalClasses} classes</span>
                    <span>{sub.absentClasses} missed</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
