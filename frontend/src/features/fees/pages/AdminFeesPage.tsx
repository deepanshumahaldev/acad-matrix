import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { getCourses, getSemesters } from '@/features/academics/api/academicsApi';
import { assignFeeStructure, listFeeStructures, listStudentFees } from '../api/feesApi';
import { FeeStructureModal } from '../components/FeeStructureModal';
import { PaymentEntryModal } from '../components/PaymentEntryModal';
import type { FeeStructureItem, StudentFeeItem } from '../types';

export function AdminFeesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'structures' | 'ledger'>('structures');
  const [createStructureOpen, setCreateStructureOpen] = useState(false);
  const [payingStudentFee, setPayingStudentFee] = useState<StudentFeeItem | null>(null);

  const { data: structures, isLoading: loadingStructures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => listFeeStructures(),
  });

  const { data: studentFees, isLoading: loadingFees } = useQuery({
    queryKey: ['student-fees'],
    queryFn: () => listStudentFees(),
    enabled: activeTab === 'ledger',
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses(),
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => getSemesters(),
  });

  const assignMutation = useMutation({
    mutationFn: (feeStructureId: string) => assignFeeStructure({ feeStructureId }),
    onSuccess: (data) => {
      alert(`Successfully assigned fees to ${data.assignedCount} students!`);
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      queryClient.invalidateQueries({ queryKey: ['student-fees'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to assign fee');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fee Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Define fee structures, assign fees to students, and record manual payments with receipts.
          </p>
        </div>
        {activeTab === 'structures' && (
          <button
            onClick={() => setCreateStructureOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create Fee Structure
          </button>
        )}
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('structures')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'structures'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            Fee Structures
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'ledger'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            Student Fee Ledger
          </button>
        </nav>
      </div>

      {activeTab === 'structures' && (
        <>
          {loadingStructures && <Skeleton className="h-64 w-full" />}
          {!loadingStructures && (!structures || structures.length === 0) && (
            <EmptyState title="No fee structures" description="Click the button above to define fee heads." />
          )}
          {!loadingStructures && structures && structures.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Table<FeeStructureItem>
                columns={[
                  {
                    key: 'name',
                    header: 'Structure Name & Course',
                    render: (s) => (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{s.name}</div>
                        <div className="text-xs text-slate-500">
                          {s.course?.name} ({s.academicYear})
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'amount',
                    header: 'Total Amount',
                    render: (s) => (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        ₹{Number(s.totalAmount).toLocaleString()}
                      </span>
                    ),
                  },
                  {
                    key: 'dueDate',
                    header: 'Due Date',
                    render: (s) => new Date(s.dueDate).toLocaleDateString(),
                  },
                  {
                    key: 'assigned',
                    header: 'Assigned Students',
                    render: (s) => (
                      <Badge tone="blue">{s._count?.studentFees ?? 0} Students</Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (s) => (
                      <button
                        onClick={() => assignMutation.mutate(s.id)}
                        disabled={assignMutation.isPending}
                        className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 disabled:opacity-50"
                      >
                        Assign to Students
                      </button>
                    ),
                  },
                ]}
                rows={structures}
                rowKey={(s) => s.id}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'ledger' && (
        <>
          {loadingFees && <Skeleton className="h-64 w-full" />}
          {!loadingFees && (!studentFees || studentFees.length === 0) && (
            <EmptyState title="No assigned student fees" description="Assign a fee structure to students first." />
          )}
          {!loadingFees && studentFees && studentFees.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Table<StudentFeeItem>
                columns={[
                  {
                    key: 'student',
                    header: 'Student',
                    render: (f) => (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {f.student?.user.firstName} {f.student?.user.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{f.student?.rollNumber} • {f.student?.course?.code}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'structure',
                    header: 'Fee Structure',
                    render: (f) => (
                      <span className="text-sm font-medium">{f.feeStructure?.name}</span>
                    ),
                  },
                  {
                    key: 'netDue',
                    header: 'Net Due',
                    render: (f) => (
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        ₹{(Number(f.amountDue) - Number(f.discount)).toLocaleString()}
                      </span>
                    ),
                  },
                  {
                    key: 'paid',
                    header: 'Paid Amount',
                    render: (f) => {
                      const paid = (f.payments || []).reduce((s, p) => s + Number(p.amount), 0);
                      return <span className="font-medium text-emerald-600">₹{paid.toLocaleString()}</span>;
                    },
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (f) => (
                      <Badge
                        tone={
                          f.status === 'PAID' ? 'green' : f.status === 'PARTIAL' ? 'amber' : f.status === 'OVERDUE' ? 'red' : 'gray'
                        }
                      >
                        {f.status}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (f) => (
                      <button
                        onClick={() => setPayingStudentFee(f)}
                        disabled={f.status === 'PAID'}
                        className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 disabled:opacity-40"
                      >
                        {f.status === 'PAID' ? 'Paid in Full' : 'Record Payment'}
                      </button>
                    ),
                  },
                ]}
                rows={studentFees}
                rowKey={(f) => f.id}
              />
            </div>
          )}
        </>
      )}

      <FeeStructureModal
        open={createStructureOpen}
        onClose={() => setCreateStructureOpen(false)}
        courses={courses || []}
        semesters={semesters || []}
      />

      <PaymentEntryModal
        open={!!payingStudentFee}
        onClose={() => setPayingStudentFee(null)}
        studentFee={payingStudentFee}
      />
    </div>
  );
}
