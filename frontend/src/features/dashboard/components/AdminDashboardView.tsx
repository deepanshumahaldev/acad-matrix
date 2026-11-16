import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import type { AdminDashboardData } from '../types';

interface Props {
  data: AdminDashboardData;
}

export function AdminDashboardView({ data }: Props) {
  const statCards = [
    { label: 'Total Students', value: data.counts.students, to: '/admin/students', color: 'text-indigo-600' },
    { label: 'Faculty Members', value: data.counts.faculty, to: '/admin/faculty', color: 'text-blue-600' },
    { label: 'Departments', value: data.counts.departments, to: '/admin/academics', color: 'text-emerald-600' },
    { label: 'Courses Offered', value: data.counts.courses, to: '/admin/academics', color: 'text-purple-600' },
    { label: "Today's Class Sessions", value: data.todaySessionsCount, to: '/admin/timetable', color: 'text-amber-600' },
    { label: 'Open Support Tickets', value: data.counts.openTickets, to: '/admin/support', color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-xl border border-line bg-white p-4 shadow-sm hover:border-brand hover:shadow-md transition-all"
          >
            <span className="text-xs font-medium text-slate-500">{c.label}</span>
            <p className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Total Fees Collected</span>
            <Badge tone="green">Verified Revenue</Badge>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600">
            ₹{data.fees.totalCollected.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">Recorded receipts across all semesters</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Outstanding Fee Balance</span>
            <Badge tone="amber">Pending Collection</Badge>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-indigo-600">
            ₹{data.fees.totalPending.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total uncollected student dues</p>
        </div>
      </div>

      {/* Recent Audit Activities */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-3">Recent System Audit Trail</h2>
        {data.recentAuditLogs.length === 0 ? (
          <p className="text-xs italic text-slate-400">No recent audit entries.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {data.recentAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="text-slate-500"> on {log.entity}</span>
                  {log.actor && (
                    <span className="text-slate-400">
                      {' '}by {log.actor.firstName} {log.actor.lastName}
                    </span>
                  )}
                </div>
                <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
