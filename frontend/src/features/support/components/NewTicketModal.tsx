import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { createTicket } from '../api/supportApi';

const schema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters'),
  category: z.string().trim().min(1, 'Category is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  initialMessage: z.string().trim().min(10, 'Please explain your query in at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewTicketModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', category: 'Academic' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit ticket');
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Raise Support Ticket">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
          <input
            type="text"
            placeholder="e.g. Issue with semester fee receipt or grade discrepancy"
            {...register('subject')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
            <select
              {...register('category')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="Academic">Academic</option>
              <option value="Fees & Accounts">Fees & Accounts</option>
              <option value="Hostel & Facilities">Hostel & Facilities</option>
              <option value="IT & Portal">IT & Portal</option>
              <option value="Examinations">Examinations</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Priority</label>
            <select
              {...register('priority')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High (Urgent)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
          <textarea
            rows={4}
            placeholder="Please describe the issue in detail..."
            {...register('initialMessage')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {errors.initialMessage && <p className="mt-1 text-xs text-red-600">{errors.initialMessage.message}</p>}
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
            {mutation.isPending ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
