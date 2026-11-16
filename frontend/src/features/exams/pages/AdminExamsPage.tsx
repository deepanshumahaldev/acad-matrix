import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { getSections, getSemesters, getSubjects } from '@/features/academics/api/academicsApi';
import { getStudentList } from '@/features/users/api/usersApi';
import { listExams } from '../api/examsApi';
import { ExamModal } from '../components/ExamModal';
import { ExamResultsModal } from '../components/ExamResultsModal';
import type { ExamItem } from '../types';

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function AdminExamsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [scoringExam, setScoringExam] = useState<ExamItem | null>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => listExams(),
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => getSemesters(),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections(),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-scoring', scoringExam?.sectionId],
    queryFn: () => getStudentList({ sectionId: scoringExam?.sectionId || undefined, limit: 100 }),
    enabled: !!scoringExam,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Examinations</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Schedule mid-terms, final exams, practicals and record student marks.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Schedule Exam
        </button>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (!exams || exams.length === 0) && (
        <EmptyState title="No exams scheduled" description="Use the button above to schedule examinations." />
      )}

      {!isLoading && exams && exams.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Table<ExamItem>
            columns={[
              {
                key: 'title',
                header: 'Title & Type',
                render: (e) => (
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{e.title}</div>
                    <div className="mt-1">
                      <Badge tone="blue">
                        {e.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ),
              },
              {
                key: 'subject',
                header: 'Subject & Semester',
                render: (e) => (
                  <div>
                    <div className="text-sm text-slate-800 dark:text-slate-200">
                      {e.subject?.name} ({e.subject?.code})
                    </div>
                    <div className="text-xs text-slate-500">
                      Sem {e.semester?.number} {e.section ? `• Sec ${e.section.name}` : '• All Sections'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'datetime',
                header: 'Date & Time',
                render: (e) => (
                  <div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(e.examDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatMinutes(e.startMinute)} - {formatMinutes(e.endMinute)}
                      {e.room && ` (${e.room})`}
                    </div>
                  </div>
                ),
              },
              {
                key: 'maxMarks',
                header: 'Max Marks',
                render: (e) => <span className="font-medium">{e.maxMarks}</span>,
              },
              {
                key: 'graded',
                header: 'Graded',
                render: (e) => (
                  <Badge tone={e._count?.results ? 'green' : 'gray'}>
                    {e._count?.results ?? 0} Recorded
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (e) => (
                  <button
                    onClick={() => setScoringExam(e)}
                    className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
                  >
                    Enter Marks
                  </button>
                ),
              },
            ]}
            rows={exams}
            rowKey={(e) => e.id}
          />
        </div>
      )}

      <ExamModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        semesters={semesters || []}
        subjects={subjects || []}
        sections={sections || []}
      />

      <ExamResultsModal
        open={!!scoringExam}
        onClose={() => setScoringExam(null)}
        exam={scoringExam}
        students={(studentsData?.items as any) || []}
      />
    </div>
  );
}
