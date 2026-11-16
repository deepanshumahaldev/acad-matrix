import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { getMyExamResults, listExams } from '../api/examsApi';
import type { ExamItem, ExamResultItem } from '../types';

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function StudentExamsPage() {
  const [tab, setTab] = useState<'schedule' | 'results'>('schedule');

  const { data: exams, isLoading: loadingExams } = useQuery({
    queryKey: ['exams'],
    queryFn: () => listExams(),
  });

  const { data: results, isLoading: loadingResults } = useQuery({
    queryKey: ['my-exam-results'],
    queryFn: () => getMyExamResults(),
    enabled: tab === 'results',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Examinations & Results</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Check your examination timetable, seating, and published grades.
        </p>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab('schedule')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              tab === 'schedule'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            Exam Schedule
          </button>
          <button
            onClick={() => setTab('results')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              tab === 'results'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            Grades & Report Card
          </button>
        </nav>
      </div>

      {tab === 'schedule' && (
        <>
          {loadingExams && <Skeleton className="h-64 w-full" />}
          {!loadingExams && (!exams || exams.length === 0) && (
            <EmptyState title="No scheduled exams" description="There are no upcoming examinations scheduled." />
          )}
          {!loadingExams && exams && exams.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Table<ExamItem>
                columns={[
                  {
                    key: 'subject',
                    header: 'Subject',
                    render: (e) => (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{e.subject?.name}</div>
                        <div className="text-xs text-slate-500">{e.subject?.code}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'title',
                    header: 'Exam Title & Type',
                    render: (e) => (
                      <div>
                        <div className="text-sm font-medium">{e.title}</div>
                        <div className="mt-1">
                          <Badge tone="blue">
                            {e.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'time',
                    header: 'Date & Time',
                    render: (e) => (
                      <div>
                        <div className="text-sm text-slate-800 dark:text-slate-200">
                          {new Date(e.examDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatMinutes(e.startMinute)} - {formatMinutes(e.endMinute)}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'room',
                    header: 'Room',
                    render: (e) => <span className="text-sm">{e.room || 'TBA'}</span>,
                  },
                  {
                    key: 'maxMarks',
                    header: 'Max Marks',
                    render: (e) => <span className="font-medium">{e.maxMarks}</span>,
                  },
                ]}
                rows={exams}
                rowKey={(e) => e.id}
              />
            </div>
          )}
        </>
      )}

      {tab === 'results' && (
        <>
          {loadingResults && <Skeleton className="h-64 w-full" />}
          {!loadingResults && (!results || results.length === 0) && (
            <EmptyState title="No grades published yet" description="Results will appear here once faculty records marks." />
          )}
          {!loadingResults && results && results.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Table<ExamResultItem>
                columns={[
                  {
                    key: 'subject',
                    header: 'Subject & Exam',
                    render: (r) => (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{r.exam?.subject?.name}</div>
                        <div className="text-xs text-slate-500">{r.exam?.title}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'score',
                    header: 'Score',
                    render: (r) => (
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {r.marksObtained} / {r.exam?.maxMarks ?? 100}
                      </span>
                    ),
                  },
                  {
                    key: 'grade',
                    header: 'Grade',
                    render: (r) =>
                      r.grade ? <Badge tone="green">{r.grade}</Badge> : <span className="text-slate-400">—</span>,
                  },
                  {
                    key: 'remarks',
                    header: 'Remarks',
                    render: (r) => (
                      <span className="text-xs text-slate-500">{r.remarks || '—'}</span>
                    ),
                  },
                ]}
                rows={results}
                rowKey={(r) => r.id}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
