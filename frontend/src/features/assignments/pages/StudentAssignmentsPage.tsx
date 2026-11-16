import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { listAssignments } from '../api/assignmentsApi';
import { SubmissionModal } from '../components/SubmissionModal';
import type { AssignmentItem } from '../types';

export function StudentAssignmentsPage() {
  const [submittingAssignment, setSubmittingAssignment] = useState<AssignmentItem | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => listAssignments(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Assignments</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track deadlines, submit assignments, and view grades and instructor feedback.
        </p>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (!assignments || assignments.length === 0) && (
        <EmptyState title="No assignments assigned" description="You have no pending assignments at this time." />
      )}

      {!isLoading && assignments && assignments.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Table<AssignmentItem>
            columns={[
              {
                key: 'subject',
                header: 'Subject & Title',
                render: (a) => (
                  <div>
                    <div className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                      {a.allocation?.subject?.name || 'Subject'} ({a.allocation?.subject?.code})
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{a.title}</div>
                    {a.description && (
                      <div className="line-clamp-1 text-xs text-slate-500">{a.description}</div>
                    )}
                  </div>
                ),
              },
              {
                key: 'due',
                header: 'Due Date',
                render: (a) => {
                  const isPast = new Date() > new Date(a.dueAt);
                  return (
                    <div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {new Date(a.dueAt).toLocaleDateString()}
                      </span>
                      <div className={`text-xs ${isPast ? 'text-red-500' : 'text-slate-500'}`}>
                        {new Date(a.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'status',
                header: 'Status',
                render: (a) => {
                  const sub = a.submissions?.[0];
                  if (!sub) {
                    const isPast = new Date() > new Date(a.dueAt);
                    return <Badge tone={isPast ? 'red' : 'gray'}>{isPast ? 'Missing' : 'Pending'}</Badge>;
                  }
                  return (
                    <Badge tone={sub.status === 'GRADED' ? 'green' : sub.status === 'LATE' ? 'amber' : 'blue'}>
                      {sub.status}
                    </Badge>
                  );
                },
              },
              {
                key: 'marks',
                header: 'Marks',
                render: (a) => {
                  const sub = a.submissions?.[0];
                  if (!sub || sub.marks === null || sub.marks === undefined) {
                    return <span className="text-slate-400">— / {a.maxMarks}</span>;
                  }
                  return (
                    <div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {sub.marks} / {a.maxMarks}
                      </span>
                      {sub.feedback && (
                        <div className="text-xs italic text-slate-500" title={sub.feedback}>
                          "{sub.feedback}"
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Action',
                render: (a) => {
                  const sub = a.submissions?.[0];
                  return (
                    <button
                      onClick={() => setSubmittingAssignment(a)}
                      className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
                    >
                      {sub ? 'Resubmit' : 'Submit'}
                    </button>
                  );
                },
              },
            ]}
            rows={assignments}
            rowKey={(a) => a.id}
          />
        </div>
      )}

      <SubmissionModal
        open={!!submittingAssignment}
        onClose={() => setSubmittingAssignment(null)}
        assignment={submittingAssignment}
      />
    </div>
  );
}
