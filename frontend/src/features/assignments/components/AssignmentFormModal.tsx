import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { createAssignment } from '../api/assignmentsApi';

const schema = z.object({
  allocationId: z.string().min(1, 'Please select a subject allocation'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().optional(),
  dueAt: z.string().min(1, 'Due date is required'),
  maxMarks: z.coerce.number().min(1).max(1000).default(100),
  attachmentName: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  allocations: Array<{ id: string; subject: { name: string; code: string }; section: { name: string } }>;
}

export function AssignmentFormModal({ open, onClose, allocations }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { maxMarks: 100 },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      createAssignment({
        ...data,
        dueAt: new Date(data.dueAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create assignment');
    },
  });

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Assignment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Subject & Section</label>
          <select
            {...register('allocationId')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Select subject and section</option>
            {allocations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.subject.name} ({a.subject.code}) - Section {a.section.name}
              </option>
            ))}
          </select>
          {errors.allocationId && <p className="mt-1 text-xs text-red-600">{errors.allocationId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Assignment Title</label>
          <input
            type="text"
            placeholder="e.g. Problem Set 1"
            {...register('title')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Instructions / Description</label>
          <textarea
            rows={3}
            placeholder="Provide assignment guidelines or submission criteria..."
            {...register('description')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Due Date & Time</label>
            <input
              type="datetime-local"
              {...register('dueAt')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.dueAt && <p className="mt-1 text-xs text-red-600">{errors.dueAt.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Max Marks</label>
            <input
              type="number"
              {...register('maxMarks')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.maxMarks && <p className="mt-1 text-xs text-red-600">{errors.maxMarks.message}</p>}
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
            {mutation.isPending ? 'Publishing...' : 'Publish Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
