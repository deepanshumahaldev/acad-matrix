import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, EmptyState, Input, Modal, Table } from '@/components/ui';
import { getSections } from '@/features/academics/api/academicsApi';
import { getSessionById, getSessions } from '../api/attendanceApi';
import type { AttendanceSessionItem } from '../types';

export function AdminAttendancePage() {
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: sections = [] } = useQuery({ queryKey: ['sections'], queryFn: () => getSections() });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['admin-sessions', { sectionId, date }],
    queryFn: () => getSessions({ sectionId: sectionId || undefined, date: date || undefined }),
  });

  const { data: sessionDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['session-detail', selectedSessionId],
    queryFn: () => (selectedSessionId ? getSessionById(selectedSessionId) : null),
    enabled: !!selectedSessionId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Monitoring</h1>
          <p className="text-sm text-slate-500">Audit session logs, teacher submissions, and student absences</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-4">
        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          className="h-10 rounded-md border border-line bg-white px-3 text-xs text-ink min-w-[200px]"
        >
          <option value="">All Sections</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              Section {s.name} ({s.semester?.course?.code || ''})
            </option>
          ))}
        </select>
        <div className="w-48">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {(sectionId || date) && (
          <Button variant="secondary" className="h-10 px-3 text-xs" onClick={() => { setSectionId(''); setDate(''); }}>
            Reset Filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading attendance records...</div>
      ) : (
        <Table<AttendanceSessionItem>
          columns={[
            { key: 'date', header: 'Date', render: (s) => <span className="font-mono text-xs">{s.date.slice(0, 10)}</span> },
            { key: 'period', header: 'Period', render: (s) => `Period ${s.period}` },
            {
              key: 'sec',
              header: 'Subject & Section',
              render: (s) => (
                <div>
                  <span className="font-semibold text-slate-900">{s.allocation.subject.name}</span>
                  <span className="ml-2 font-mono text-xs text-slate-500">Sec {s.allocation.section.name}</span>
                </div>
              ),
            },
            { key: 'fac', header: 'Marked By', render: (s) => `Prof. ${s.allocation.faculty.user.lastName}` },
            { key: 'topic', header: 'Topic', render: (s) => s.topic || '—' },
            { key: 'count', header: 'Students', render: (s) => `${s._count?.records ?? 0} marked` },
            {
              key: 'actions',
              header: 'Actions',
              className: 'text-right',
              render: (s) => (
                <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => setSelectedSessionId(s.id)}>
                  View Roster
                </Button>
              ),
            },
          ]}
          rows={sessions}
          rowKey={(s) => s.id}
          empty={<EmptyState title="No attendance sessions found" description="Adjust your filters or wait for faculty to submit." />}
        />
      )}

      {/* Session Roster Modal */}
      <Modal open={!!selectedSessionId} title="Session Attendance Roster" onClose={() => setSelectedSessionId(null)}>
        {loadingDetail || !sessionDetail ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading roster...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700 flex justify-between">
              <div>
                <span className="font-bold">{sessionDetail.allocation.subject.name}</span> (Sec {sessionDetail.allocation.section.name})
              </div>
              <div className="font-mono">{sessionDetail.date.slice(0, 10)} • Period {sessionDetail.period}</div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full text-xs divide-y divide-line">
                <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Roll No</th>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sessionDetail.records?.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-800">{r.student.rollNumber}</td>
                      <td className="px-3 py-1.5">{r.student.user.firstName} {r.student.user.lastName}</td>
                      <td className="px-3 py-1.5 text-center font-bold">
                        <span className={r.status === 'PRESENT' ? 'text-emerald-600' : r.status === 'ABSENT' ? 'text-red-600' : 'text-amber-600'}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{r.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedSessionId(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
