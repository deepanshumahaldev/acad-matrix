import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { recordExamResults } from '../api/examsApi';
import type { ExamItem } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  exam: ExamItem | null;
  students: Array<{ id: string; rollNumber: string; user: { firstName: string; lastName: string } }>;
}

export function ExamResultsModal({ open, onClose, exam, students }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Map studentId -> marks & grade
  const [entries, setEntries] = useState<Record<string, { marks: number; grade: string; remarks: string }>>({});

  const mutation = useMutation({
    mutationFn: () => {
      if (!exam) throw new Error('No exam selected');
      const payload = Object.entries(entries).map(([studentId, data]) => {
        if (data.marks > exam.maxMarks) {
          throw new Error(`Marks for student cannot exceed max marks (${exam.maxMarks})`);
        }
        return {
          studentId,
          marksObtained: data.marks,
          grade: data.grade || undefined,
          remarks: data.remarks || undefined,
        };
      });

      if (payload.length === 0) {
        throw new Error('Please enter marks for at least one student');
      }

      return recordExamResults(exam.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to record results');
    },
  });

  if (!exam) return null;

  const updateStudentEntry = (studentId: string, field: 'marks' | 'grade' | 'remarks', val: any) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        marks: prev[studentId]?.marks ?? 0,
        grade: prev[studentId]?.grade ?? '',
        remarks: prev[studentId]?.remarks ?? '',
        [field]: val,
      },
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title={`Record Results: ${exam.title} (Max: ${exam.maxMarks})`}>
      <div className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {students.map((st) => {
            const entry = entries[st.id] || { marks: '', grade: '', remarks: '' };
            return (
              <div key={st.id} className="grid grid-cols-12 items-center gap-2 p-3 text-sm">
                <div className="col-span-5">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {st.user.firstName} {st.user.lastName}
                  </div>
                  <div className="text-xs text-slate-500">{st.rollNumber}</div>
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    placeholder="Marks"
                    max={exam.maxMarks}
                    value={entry.marks}
                    onChange={(e) => updateStudentEntry(st.id, 'marks', Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Grade"
                    value={entry.grade}
                    onChange={(e) => updateStudentEntry(st.id, 'grade', e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Remarks"
                    value={entry.remarks}
                    onChange={(e) => updateStudentEntry(st.id, 'remarks', e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Results'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
