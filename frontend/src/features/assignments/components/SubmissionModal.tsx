import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { submitAssignment } from '../api/assignmentsApi';
import type { AssignmentItem } from '../types';

const schema = z.object({
  fileName: z.string().trim().min(1, 'File name is required'),
  note: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  assignment: AssignmentItem | null;
}

export function SubmissionModal({ open, onClose, assignment }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!assignment) throw new Error('No assignment selected');
      return submitAssignment(assignment.id, {
        fileKey: `submissions/${assignment.id}/${Date.now()}-${data.fileName}`,
        fileName: data.fileName,
        mimeType: 'application/pdf',
        sizeBytes: 1024 * 1024,
        note: data.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit assignment');
    },
  });

  if (!assignment) return null;

  const isPastDue = new Date() > new Date(assignment.dueAt);

  return (
    <Modal open={open} onClose={onClose} title={`Submit Assignment: ${assignment.title}`}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {isPastDue && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <strong>Warning:</strong> The deadline has passed. Your submission will be marked as LATE.
          </div>
        )}

        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Submission File Name / Document Reference
          </label>
          <input
            type="text"
            placeholder="e.g. Roll101_Assignment1.pdf"
            {...register('fileName')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {errors.fileName && <p className="mt-1 text-xs text-red-600">{errors.fileName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Notes / Comments for Instructor (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Any remarks regarding your solution..."
            {...register('note')}
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
            {mutation.isPending ? 'Submitting...' : 'Submit Work'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
