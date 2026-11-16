import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { createFeeStructure } from '../api/feesApi';

const schema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  semesterId: z.string().optional(),
  name: z.string().trim().min(3, 'Fee structure name is required'),
  academicYear: z.string().trim().min(4, 'Academic year is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  components: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Component label required'),
        amount: z.coerce.number().min(0, 'Amount must be non-negative'),
      }),
    )
    .min(1, 'At least one fee breakdown component is required'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  courses: Array<{ id: string; name: string; code: string }>;
  semesters: Array<{ id: string; number: number; academicYear: string }>;
}

export function FeeStructureModal({ open, onClose, courses, semesters }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      academicYear: '2026-27',
      components: [
        { label: 'Tuition Fee', amount: 45000 },
        { label: 'Library & Laboratory', amount: 5000 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const watchedComponents = watch('components');
  const computedTotal = (watchedComponents || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      return createFeeStructure({
        courseId: data.courseId,
        semesterId: data.semesterId || undefined,
        name: data.name,
        academicYear: data.academicYear,
        totalAmount: computedTotal,
        components: data.components,
        dueDate: data.dueDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create fee structure');
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Fee Structure">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Structure Name</label>
          <input
            type="text"
            placeholder="e.g. B.Tech Computer Science - Year 1 Fee"
            {...register('name')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Course</label>
            <select
              {...register('courseId')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {errors.courseId && <p className="mt-1 text-xs text-red-600">{errors.courseId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Semester (Optional)</label>
            <select
              {...register('semesterId')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  Semester {s.number} ({s.academicYear})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Academic Year</label>
            <input
              type="text"
              placeholder="2026-27"
              {...register('academicYear')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Payment Due Date</label>
            <input
              type="date"
              {...register('dueDate')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Fee Breakdown Components</label>
            <button
              type="button"
              onClick={() => append({ label: '', amount: 0 })}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              + Add Component
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Component (e.g. Tuition)"
                  {...register(`components.${idx}.label` as const)}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  {...register(`components.${idx}.amount` as const)}
                  className="w-32 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="pt-2 text-right text-sm font-semibold text-slate-800 dark:text-slate-200">
            Total Amount: ₹{computedTotal.toLocaleString()}
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
            {mutation.isPending ? 'Creating...' : 'Create Structure'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
