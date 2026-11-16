import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { getMyFeeSummary } from '../api/feesApi';
import type { PaymentItem, StudentFeeItem } from '../types';

export function StudentFeesPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['my-fee-summary'],
    queryFn: () => getMyFeeSummary(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fee Statement & Receipts</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track semester fee dues, payment history, and download payment receipts.
        </p>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && !summary && (
        <EmptyState title="No fee records found" description="You have no fee records allocated to your account." />
      )}

      {!isLoading && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Net Fees</span>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                ₹{summary.netDue.toLocaleString()}
              </p>
              {summary.totalDiscount > 0 && (
                <span className="text-xs text-emerald-600">Includes scholarship discount: ₹{summary.totalDiscount.toLocaleString()}</span>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Paid</span>
              <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{summary.totalPaid.toLocaleString()}
              </p>
              <span className="text-xs text-slate-500">Confirmed transactions</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Balance</span>
              <p className={`mt-2 text-2xl font-bold ${summary.balanceRemaining > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>
                ₹{summary.balanceRemaining.toLocaleString()}
              </p>
              <span className="text-xs text-slate-500">
                {summary.balanceRemaining === 0 ? 'No pending balance' : 'Pending payment'}
              </span>
            </div>
          </div>

          {/* Fee Items & Receipts */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Fee Items & Receipts</h2>

            {summary.fees.map((fee: StudentFeeItem) => {
              const paid = (fee.payments || []).reduce((s, p) => s + Number(p.amount), 0);
              const due = Number(fee.amountDue) - Number(fee.discount);
              const pending = Math.max(0, due - paid);

              return (
                <div
                  key={fee.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {fee.feeStructure?.name || 'Academic Fee'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Due Date: {new Date(fee.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          ₹{due.toLocaleString()}
                        </span>
                        {pending > 0 && (
                          <div className="text-xs text-red-500 font-medium">Pending: ₹{pending.toLocaleString()}</div>
                        )}
                      </div>
                      <Badge
                        tone={
                          fee.status === 'PAID' ? 'green' : fee.status === 'PARTIAL' ? 'amber' : 'gray'
                        }
                      >
                        {fee.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Payment receipts */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Receipts for this fee:</h4>
                    {(!fee.payments || fee.payments.length === 0) ? (
                      <p className="text-xs italic text-slate-400">No payment receipts issued yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 rounded border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                        {fee.payments.map((p: PaymentItem) => (
                          <div key={p.id} className="flex items-center justify-between p-3 text-xs">
                            <div>
                              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                {p.receiptNumber}
                              </span>
                              <div className="text-slate-500">
                                Paid on {new Date(p.paidAt).toLocaleDateString()} via {p.method}
                                {p.reference && ` (Ref: ${p.reference})`}
                              </div>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              ₹{Number(p.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
