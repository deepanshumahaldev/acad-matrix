import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, EmptyState, Input, Table } from '@/components/ui';
import { getCourses, getSections, getSemesters } from '@/features/academics/api/academicsApi';
import {
  createStudent,
  getStudentList,
  importStudentsCsv,
  setStudentStatus,
  unlockUser,
  updateStudent,
} from '../api/usersApi';
import { CsvImportModal } from '../components/CsvImportModal';
import { StudentFormModal } from '../components/StudentFormModal';
import type { StudentFormData, StudentItem, UserStatus } from '../types';

export function StudentListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => getCourses() });
  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters', courseId],
    queryFn: () => getSemesters(courseId),
    enabled: !!courseId,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ['sections', semesterId],
    queryFn: () => getSections(semesterId),
    enabled: !!semesterId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', { page, search, courseId, semesterId, sectionId, status }],
    queryFn: () =>
      getStudentList({
        page,
        limit: 10,
        search: search.trim() || undefined,
        courseId: courseId || undefined,
        semesterId: semesterId || undefined,
        sectionId: sectionId || undefined,
        status: status || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: UserStatus }) => setStudentStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const unlockMutation = useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const handleFormSubmit = async (formData: StudentFormData) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, formData);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } else {
      const res = await createStudent(formData);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      return res;
    }
  };

  const sampleCsv = `email,firstName,lastName,rollNumber,courseId,semesterId,sectionId,admissionYear\nrahul.verma@AcadMatrix.local,Rahul,Verma,CS26001,${courses[0]?.id || 'COURSE_UUID'},${semesters[0]?.id || 'SEM_UUID'},${sections[0]?.id || 'SEC_UUID'},2026`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Management</h1>
          <p className="text-sm text-slate-500">Manage enrolled student rosters, programs, and statuses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button onClick={() => { setEditingStudent(null); setFormOpen(true); }}>+ Add Student</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-4">
        <div className="min-w-[180px] flex-1">
          <Input
            placeholder="Search by name, roll no or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setSemesterId(''); setSectionId(''); setPage(1); }}
          className="h-11 rounded-md border border-line bg-white px-2 text-xs text-ink"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.code})</option>))}
        </select>
        <select
          value={semesterId}
          disabled={!courseId}
          onChange={(e) => { setSemesterId(e.target.value); setSectionId(''); setPage(1); }}
          className="h-11 rounded-md border border-line bg-white px-2 text-xs text-ink"
        >
          <option value="">All Semesters</option>
          {semesters.map((s) => (<option key={s.id} value={s.id}>Sem {s.number} ({s.academicYear})</option>))}
        </select>
        <select
          value={sectionId}
          disabled={!semesterId}
          onChange={(e) => { setSectionId(e.target.value); setPage(1); }}
          className="h-11 rounded-md border border-line bg-white px-2 text-xs text-ink"
        >
          <option value="">All Sections</option>
          {sections.map((sec) => (<option key={sec.id} value={sec.id}>Sec {sec.name}</option>))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1); }}
          className="h-11 rounded-md border border-line bg-white px-2 text-xs text-ink"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading student records...</div>
      ) : data?.items.length === 0 ? (
        <EmptyState title="No students found" description="Try adjusting your filter options or enroll a student." />
      ) : (
        <div className="space-y-4">
          <Table<StudentItem>
            columns={[
              { key: 'roll', header: 'Roll No', render: (s) => <span className="font-mono text-xs font-bold text-slate-900">{s.rollNumber}</span> },
              {
                key: 'name',
                header: 'Student',
                render: (s) => (
                  <div>
                    <div className="font-semibold text-slate-900">{s.user.firstName} {s.user.lastName}</div>
                    <div className="text-xs text-slate-500">{s.user.email} {s.user.phone ? `• ${s.user.phone}` : ''}</div>
                  </div>
                ),
              },
              { key: 'course', header: 'Course', render: (s) => s.course.code },
              { key: 'semSec', header: 'Sem & Sec', render: (s) => `Sem ${s.semester.number} - Sec ${s.section.name}` },
              { key: 'adm', header: 'Admission Year', render: (s) => s.admissionYear },
              {
                key: 'status',
                header: 'Status',
                render: (s) => (
                  <div className="flex items-center gap-1.5">
                    <Badge tone={s.user.status === 'ACTIVE' ? 'green' : 'red'}>{s.user.status}</Badge>
                    {s.user.lockedUntil && <Badge tone="amber">Locked</Badge>}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'text-right',
                render: (s) => (
                  <div className="flex justify-end gap-1.5">
                    {s.user.lockedUntil && (
                      <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => unlockMutation.mutate(s.user.id)}>
                        Unlock
                      </Button>
                    )}
                    <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => { setEditingStudent(s); setFormOpen(true); }}>
                      Edit
                    </Button>
                    <Button
                      variant={s.user.status === 'ACTIVE' ? 'danger' : 'secondary'}
                      className="h-8 px-2 text-xs"
                      onClick={() => statusMutation.mutate({ id: s.id, nextStatus: s.user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                    >
                      {s.user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={data?.items || []}
            rowKey={(s) => s.id}
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

      <StudentFormModal
        open={formOpen}
        studentToEdit={editingStudent}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <CsvImportModal
        open={importOpen}
        title="Bulk Import Students"
        sampleCsv={sampleCsv}
        columnsDescription="email, firstName, lastName, rollNumber, courseId, semesterId, sectionId, admissionYear, phone (opt), dateOfBirth (opt), guardianName (opt), guardianPhone (opt)"
        onClose={() => setImportOpen(false)}
        onImport={(csv) => importStudentsCsv(csv)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
      />
    </div>
  );
}
