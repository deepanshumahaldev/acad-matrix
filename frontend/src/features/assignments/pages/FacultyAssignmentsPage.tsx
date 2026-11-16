import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { getAllocations } from '@/features/academics/api/academicsApi';
import { getAssignmentById, listAssignments } from '../api/assignmentsApi';
import { AssignmentFormModal } from '../components/AssignmentFormModal';
import { GradingModal } from '../components/GradingModal';
import type { AssignmentItem, SubmissionItem } from '../types';

export function FacultyAssignmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionItem | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => listAssignments(),
  });

  const { data: allocations } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => getAllocations(),
  });

  const { data: activeAssignment } = useQuery({
    queryKey: ['assignment', selectedAssignmentId],
    queryFn: () => (selectedAssignmentId ? getAssignmentById(selectedAssignmentId) : null),
    enabled: !!selectedAssignmentId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Course Assignments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Publish coursework, review student submissions, and award marks.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Assignments</h2>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {!isLoading && (!assignments || assignments.length === 0) && (
            <EmptyState title="No assignments" description="You have not published any assignments yet." />
          )}
          {assignments?.map((a: AssignmentItem) => {
            const isSelected = a.id === selectedAssignmentId;
            return (
              <div
                key={a.id}
                onClick={() => setSelectedAssignmentId(a.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm dark:bg-indigo-950/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                    {a.allocation?.subject?.name || 'Subject'} - Sec {a.allocation?.section?.name || 'A'}
                  </span>
                  <Badge tone="blue">{a._count?.submissions ?? 0} submitted</Badge>
                </div>
                <h3 className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{a.title}</h3>
                <p className="mt-2 text-xs text-slate-500">Due: {new Date(a.dueAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {!selectedAssignmentId ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-700">
              Select an assignment on the left to inspect submissions and enter marks.
            </div>
          ) : !activeAssignment ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{activeAssignment.title}</h2>
                  <Badge tone="green">Max Marks: {activeAssignment.maxMarks}</Badge>
                </div>
                {activeAssignment.description && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{activeAssignment.description}</p>
                )}
                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                  <span>Due: {new Date(activeAssignment.dueAt).toLocaleString()}</span>
                  <span>Section: {activeAssignment.allocation?.section?.name}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  Submissions ({activeAssignment.submissions?.length || 0})
                </h3>

                {(!activeAssignment.submissions || activeAssignment.submissions.length === 0) ? (
                  <EmptyState title="No submissions yet" description="Students have not uploaded responses yet." />
                ) : (
                  <Table<SubmissionItem>
                    columns={[
                      {
                        key: 'student',
                        header: 'Student',
                        render: (s) => (
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {s.student?.user.firstName} {s.student?.user.lastName}
                            </div>
                            <div className="text-xs text-slate-500">{s.student?.rollNumber}</div>
                          </div>
                        ),
                      },
                      {
                        key: 'status',
                        header: 'Status',
                        render: (s) => (
                          <Badge tone={s.status === 'LATE' ? 'amber' : s.status === 'GRADED' ? 'green' : 'blue'}>
                            {s.status}
                          </Badge>
                        ),
                      },
                      {
                        key: 'marks',
                        header: 'Marks',
                        render: (s) => (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.marks !== null && s.marks !== undefined ? `${s.marks} / ${activeAssignment.maxMarks}` : '—'}
                          </span>
                        ),
                      },
                      {
                        key: 'actions',
                        header: 'Actions',
                        render: (s) => (
                          <button
                            onClick={() => setGradingSubmission(s)}
                            className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
                          >
                            {s.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                          </button>
                        ),
                      },
                    ]}
                    rows={activeAssignment.submissions}
                    rowKey={(s) => s.id}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AssignmentFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        allocations={(allocations as any) || []}
      />

      <GradingModal
        open={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        submission={gradingSubmission}
        maxMarks={activeAssignment?.maxMarks ?? 100}
      />
    </div>
  );
}
