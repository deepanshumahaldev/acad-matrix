import { useQuery } from '@tanstack/react-query';
import { Badge, EmptyState, Table } from '@/components/ui';
import { getMyAttendance } from '../api/attendanceApi';
import { AttendanceStatsCard } from '../components/AttendanceStatsCard';
import type { AttendanceHistoryRecord, AttendanceStatus } from '../types';

export function StudentAttendancePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: getMyAttendance,
  });

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading your attendance records...</div>;
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Could not load attendance"
        description="Please check back later or contact your department admin."
      />
    );
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return <Badge tone="green">Present</Badge>;
      case 'ABSENT':
        return <Badge tone="red">Absent</Badge>;
      case 'LATE':
        return <Badge tone="amber">Late</Badge>;
      case 'EXCUSED':
        return <Badge tone="blue">Excused</Badge>;
      default:
        return <Badge tone="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Attendance</h1>
        <p className="text-sm text-slate-500">View overall attendance percentage, subject stats, and session history</p>
      </div>

      <AttendanceStatsCard summary={data.summary} />

      <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Attendance Log History</h2>
        <Table<AttendanceHistoryRecord>
          columns={[
            { key: 'date', header: 'Date', render: (h) => <span className="font-mono text-xs">{h.session.date.slice(0, 10)}</span> },
            {
              key: 'subject',
              header: 'Subject',
              render: (h) => (
                <div>
                  <span className="font-semibold text-slate-900">{h.session.allocation.subject.name}</span>
                  <span className="ml-2 font-mono text-xs text-slate-500">({h.session.allocation.subject.code})</span>
                </div>
              ),
            },
            { key: 'period', header: 'Period', render: (h) => `Period ${h.session.period}` },
            { key: 'topic', header: 'Topic Covered', render: (h) => h.session.topic || '—' },
            { key: 'status', header: 'Status', render: (h) => getStatusBadge(h.status) },
            { key: 'remark', header: 'Remarks', render: (h) => h.remark || '—' },
          ]}
          rows={data.history}
          rowKey={(h) => h.id}
          empty={<EmptyState title="No attendance logged" description="Your attendance records will show up here as classes are held." />}
        />
      </div>
    </div>
  );
}
