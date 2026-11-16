import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, FormField, Input, Table } from '@/components/ui';
import { getAllocations } from '@/features/academics/api/academicsApi';
import { getRoster, getSessions, markAttendance } from '../api/attendanceApi';
import { AttendanceRoster } from '../components/AttendanceRoster';
import type { AttendanceSessionItem, StudentRecordItem } from '../types';

export function FacultyAttendancePage() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [allocationId, setAllocationId] = useState('');
  const [date, setDate] = useState(todayStr);
  const [period, setPeriod] = useState(1);
  const [topic, setTopic] = useState('');
  const [records, setRecords] = useState<Record<string, StudentRecordItem>>({});
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: allocations = [] } = useQuery({
    queryKey: ['my-allocations'],
    queryFn: () => getAllocations(),
  });

  useEffect(() => {
    if (allocations.length > 0 && !allocationId) {
      setAllocationId(allocations[0]?.id || '');
    }
  }, [allocations, allocationId]);

  const { data: rosterData, isLoading: loadingRoster } = useQuery({
    queryKey: ['roster', allocationId],
    queryFn: () => getRoster(allocationId),
    enabled: !!allocationId,
  });

  useEffect(() => {
    if (rosterData?.students) {
      const initial: Record<string, StudentRecordItem> = {};
      rosterData.students.forEach((s) => {
        initial[s.id] = { studentId: s.id, status: 'PRESENT' };
      });
      setRecords(initial);
    }
  }, [rosterData]);

  const { data: pastSessions = [] } = useQuery({
    queryKey: ['faculty-sessions', allocationId],
    queryFn: () => getSessions({ allocationId: allocationId || undefined }),
    enabled: !!allocationId,
  });

  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      setStatusNotice({ type: 'success', message: 'Attendance marked successfully!' });
      queryClient.invalidateQueries({ queryKey: ['faculty-sessions'] });
      setTopic('');
    },
    onError: (err: Error) => {
      setStatusNotice({ type: 'error', message: err.message || 'Failed to submit attendance' });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatusNotice(null);
    if (!allocationId) return;

    markMutation.mutate({
      allocationId,
      date,
      period,
      topic: topic.trim() || undefined,
      records: Object.values(records),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mark Class Attendance</h1>
        <p className="text-sm text-slate-500">Record attendance for your allocated subject and section</p>
      </div>

      {statusNotice && (
        <Alert tone={statusNotice.type}>{statusNotice.message}</Alert>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Class / Subject Allocation" htmlFor="f-alloc">
            <select
              id="f-alloc"
              required
              value={allocationId}
              onChange={(e) => setAllocationId(e.target.value)}
              className="h-11 w-full rounded-md border border-line bg-white px-3 text-xs text-ink"
            >
              {allocations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject.code} - {a.subject.name} (Sec {a.section.name})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Date" htmlFor="f-date">
            <Input id="f-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label="Period / Hour" htmlFor="f-period">
            <Input
              id="f-period"
              type="number"
              min={1}
              max={12}
              required
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Lecture Topic (Optional)" htmlFor="f-topic">
            <Input
              id="f-topic"
              placeholder="e.g. Graph Traversals (BFS/DFS)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </FormField>
        </div>

        {loadingRoster ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading student roster...</div>
        ) : rosterData?.students.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No active students in this section.</div>
        ) : (
          <AttendanceRoster
            students={rosterData?.students || []}
            records={records}
            onChange={setRecords}
          />
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={markMutation.isPending} disabled={!rosterData?.students.length}>
            Submit Attendance
          </Button>
        </div>
      </form>

      {/* Recent marked sessions */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Recent Attendance Sessions</h2>
        <Table<AttendanceSessionItem>
          columns={[
            { key: 'date', header: 'Date', render: (s) => s.date.slice(0, 10) },
            { key: 'period', header: 'Period', render: (s) => `Period ${s.period}` },
            { key: 'subject', header: 'Subject & Section', render: (s) => `${s.allocation.subject.code} (Sec ${s.allocation.section.name})` },
            { key: 'topic', header: 'Topic', render: (s) => s.topic || '—' },
            { key: 'records', header: 'Records', render: (s) => `${s._count?.records ?? 0} students` },
          ]}
          rows={pastSessions.slice(0, 5)}
          rowKey={(s) => s.id}
        />
      </div>
    </div>
  );
}
