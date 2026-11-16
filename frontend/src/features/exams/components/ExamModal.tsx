import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { createExam } from '../api/examsApi';

const schema = z.object({
  semesterId: z.string().min(1, 'Semester is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  sectionId: z.string().optional(),
  title: z.string().trim().min(2, 'Title is required'),
  type: z.enum(['QUIZ', 'INTERNAL', 'MID_TERM', 'END_TERM', 'PRACTICAL']),
  examDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().trim().optional(),
  maxMarks: z.coerce.number().min(1).max(1000).default(100),
});

type FormValues = z.infer<typeof schema>;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

interface Props {
  open: boolean;
  onClose: () => void;
  semesters: Array<{ id: string; number: number; academicYear: string }>;
  subjects: Array<{ id: string; name: string; code: string }>;
  sections: Array<{ id: string; name: string }>;
}

export function ExamModal({ open, onClose, semesters, subjects, sections }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'MID_TERM', maxMarks: 100, startTime: '09:00', endTime: '12:00' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const startMinute = timeToMinutes(data.startTime);
      const endMinute = timeToMinutes(data.endTime);
      if (endMinute <= startMinute) {
        throw new Error('End time must be after start time');
      }
      return createExam({
        semesterId: data.semesterId,
        subjectId: data.subjectId,
        sectionId: data.sectionId || undefined,
        title: data.title,
        type: data.type,
        examDate: data.examDate,
        startMinute,
        endMinute,
        room: data.room || undefined,
        maxMarks: data.maxMarks,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to schedule exam');
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Schedule Examination">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Exam Title</label>
          <input
            type="text"
            placeholder="e.g. Mid-Term Theory Examination"
            {...register('title')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Exam Type</label>
            <select
              {...register('type')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="MID_TERM">Mid Term</option>
              <option value="END_TERM">End Term</option>
              <option value="INTERNAL">Internal</option>
              <option value="QUIZ">Quiz</option>
              <option value="PRACTICAL">Practical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Max Marks</label>
            <input
              type="number"
              {...register('maxMarks')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Semester</label>
            <select
              {...register('semesterId')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Select semester</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  Sem {s.number} ({s.academicYear})
                </option>
              ))}
            </select>
            {errors.semesterId && <p className="mt-1 text-xs text-red-600">{errors.semesterId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
            <select
              {...register('subjectId')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Select subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
            {errors.subjectId && <p className="mt-1 text-xs text-red-600">{errors.subjectId.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Section (Optional)</label>
            <select
              {...register('sectionId')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Section {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Room / Hall</label>
            <input
              type="text"
              placeholder="e.g. Hall 4B"
              {...register('room')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Exam Date</label>
            <input
              type="date"
              {...register('examDate')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.examDate && <p className="mt-1 text-xs text-red-600">{errors.examDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Start Time</label>
            <input
              type="time"
              {...register('startTime')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">End Time</label>
            <input
              type="time"
              {...register('endTime')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
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
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Exam'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
