import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { gradeSubmission } from '../api/assignmentsApi';
import type { SubmissionItem } from '../types';

const schema = z.object({
  marks: z.coerce.number().min(0, 'Marks cannot be negative'),
  feedback: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  submission: SubmissionItem | null;
  maxMarks: number;
}

export function GradingModal({ open, onClose, submission, maxMarks }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      marks: submission?.marks ?? 0,
      feedback: submission?.feedback ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!submission) throw new Error('No submission selected');
      if (data.marks > maxMarks) {
        throw new Error(`Marks cannot exceed ${maxMarks}`);
      }
      return gradeSubmission(submission.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to grade submission');
    },
  });

  if (!submission) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Grade: ${submission.student?.user.firstName} ${submission.student?.user.lastName} (${submission.student?.rollNumber})`}
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">
            <strong>File:</strong> {submission.fileName}
          </p>
          {submission.note && (
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              <strong>Student note:</strong> {submission.note}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Submitted: {new Date(submission.submittedAt).toLocaleString()} | Status: {submission.status}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Marks (Max: {maxMarks})
          </label>
          <input
            type="number"
            max={maxMarks}
            {...register('marks')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {errors.marks && <p className="mt-1 text-xs text-red-600">{errors.marks.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Feedback / Remarks</label>
          <textarea
            rows={3}
            placeholder="Feedback for the student..."
            {...register('feedback')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
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
            {mutation.isPending ? 'Saving...' : 'Save Grade'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
