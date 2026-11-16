import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { recordPayment } from '../api/feesApi';
import type { StudentFeeItem } from '../types';

const schema = z.object({
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  reference: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  studentFee: StudentFeeItem | null;
}

export function PaymentEntryModal({ open, onClose, studentFee }: Props) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalDue = studentFee ? Number(studentFee.amountDue) - Number(studentFee.discount) : 0;
  const alreadyPaid = (studentFee?.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, totalDue - alreadyPaid);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      amount: remaining,
      method: 'UPI',
      reference: '',
      note: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!studentFee) throw new Error('No student fee selected');
      if (data.amount > remaining) {
        throw new Error(`Payment cannot exceed outstanding balance (₹${remaining.toLocaleString()})`);
      }
      return recordPayment({
        studentFeeId: studentFee.id,
        amount: data.amount,
        method: data.method,
        reference: data.reference || undefined,
        note: data.note || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-fees'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to record payment');
    },
  });

  if (!studentFee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record Payment: ${studentFee.student?.user.firstName} ${studentFee.student?.user.lastName} (${studentFee.student?.rollNumber})`}
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-xs text-slate-500">Net Due</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">₹{totalDue.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Already Paid</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">₹{alreadyPaid.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Outstanding</span>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400">₹{remaining.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Amount to Record (₹)</label>
            <input
              type="number"
              max={remaining}
              {...register('amount')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Payment Mode</label>
            <select
              {...register('method')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="UPI">UPI / QR Code</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Transaction / UTR Reference ID
          </label>
          <input
            type="text"
            placeholder="e.g. UPI Ref 32901239"
            {...register('reference')}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Remarks / Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Installment 1 approved by bursar"
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
            {mutation.isPending ? 'Recording...' : 'Generate Receipt & Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
