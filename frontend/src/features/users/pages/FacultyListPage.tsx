import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, EmptyState, Input, Table } from '@/components/ui';
import { getDepartments } from '@/features/academics/api/academicsApi';
import {
  createFaculty,
  getFacultyList,
  importFacultyCsv,
  setFacultyStatus,
  unlockUser,
  updateFaculty,
} from '../api/usersApi';
import { CsvImportModal } from '../components/CsvImportModal';
import { FacultyFormModal } from '../components/FacultyFormModal';
import type { FacultyFormData, FacultyItem, UserStatus } from '../types';

export function FacultyListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: depts = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  const { data, isLoading } = useQuery({
    queryKey: ['faculty', { page, search, departmentId, status }],
    queryFn: () =>
      getFacultyList({
        page,
        limit: 10,
        search: search.trim() || undefined,
        departmentId: departmentId || undefined,
        status: status || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: UserStatus }) => setFacultyStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });

  const unlockMutation = useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });

  const handleFormSubmit = async (formData: FacultyFormData) => {
    if (editingFaculty) {
      await updateFaculty(editingFaculty.id, formData);
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    } else {
      const res = await createFaculty(formData);
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      return res;
    }
  };

  const sampleCsv = `email,firstName,lastName,employeeId,departmentId,phone,designation\narun.verma@AcadMatrix.local,Arun,Verma,EMP010,${depts[0]?.id || 'DEPT_UUID'},+919876543210,Associate Professor`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty Management</h1>
          <p className="text-sm text-slate-500">Manage teaching staff profiles, departments, and credentials</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={() => { setEditingFaculty(null); setFormOpen(true); }}>
            + Add Faculty
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Search by name, email or employee ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
          className="h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
        >
          <option value="">All Departments</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1); }}
          className="h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading faculty records...</div>
      ) : data?.items.length === 0 ? (
        <EmptyState title="No faculty found" description="Try adjusting your search filters or add a new faculty member." />
      ) : (
        <div className="space-y-4">
          <Table<FacultyItem>
            columns={[
              {
                key: 'name',
                header: 'Faculty Member',
                render: (f) => (
                  <div>
                    <div className="font-semibold text-slate-900">{f.user.firstName} {f.user.lastName}</div>
                    <div className="text-xs text-slate-500">{f.user.email} {f.user.phone ? `• ${f.user.phone}` : ''}</div>
                  </div>
                ),
              },
              { key: 'empId', header: 'Emp ID', render: (f) => <span className="font-mono text-xs font-semibold">{f.employeeId}</span> },
              { key: 'dept', header: 'Department', render: (f) => `${f.department.name} (${f.department.code})` },
              { key: 'designation', header: 'Designation', render: (f) => f.designation || '—' },
              {
                key: 'status',
                header: 'Status',
                render: (f) => (
                  <div className="flex items-center gap-1.5">
                    <Badge tone={f.user.status === 'ACTIVE' ? 'green' : 'red'}>{f.user.status}</Badge>
                    {f.user.lockedUntil && <Badge tone="amber">Locked</Badge>}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'text-right',
                render: (f) => (
                  <div className="flex justify-end gap-1.5">
                    {f.user.lockedUntil && (
                      <Button
                        variant="secondary"
                        className="h-8 px-2 text-xs"
                        onClick={() => unlockMutation.mutate(f.user.id)}
                      >
                        Unlock
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="h-8 px-2 text-xs"
                      onClick={() => { setEditingFaculty(f); setFormOpen(true); }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={f.user.status === 'ACTIVE' ? 'danger' : 'secondary'}
                      className="h-8 px-2 text-xs"
                      onClick={() =>
                        statusMutation.mutate({
                          id: f.id,
                          nextStatus: f.user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                        })
                      }
                    >
                      {f.user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={data?.items || []}
            rowKey={(f) => f.id}
          />

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line pt-4 text-xs text-slate-500">
              <span>Showing {data.items.length} of {data.meta.total} records</span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="h-8 px-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span>Page {page} of {data.meta.totalPages}</span>
                <Button variant="secondary" className="h-8 px-2" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <FacultyFormModal
        open={formOpen}
        facultyToEdit={editingFaculty}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <CsvImportModal
        open={importOpen}
        title="Bulk Import Faculty"
        sampleCsv={sampleCsv}
        columnsDescription="email, firstName, lastName, employeeId, departmentId, phone (opt), designation (opt), joiningDate (opt)"
        onClose={() => setImportOpen(false)}
        onImport={(csv) => importFacultyCsv(csv)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['faculty'] })}
      />
    </div>
  );
}
