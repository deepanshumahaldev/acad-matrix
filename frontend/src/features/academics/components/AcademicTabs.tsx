import { Badge, Button, EmptyState, Table } from '@/components/ui';
import type { Course, Department, Section, Semester, Subject, SubjectAllocation } from '../types';

export function DepartmentsTable({
  items,
  onEdit,
  onDelete,
}: {
  items: Department[];
  onEdit: (d: Department) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table<Department>
      columns={[
        { key: 'name', header: 'Name', render: (d) => <span className="font-semibold text-slate-900">{d.name}</span> },
        { key: 'code', header: 'Code', render: (d) => <span className="font-mono text-xs font-bold">{d.code}</span> },
        { key: 'courses', header: 'Courses', render: (d) => d._count?.courses ?? 0 },
        { key: 'faculty', header: 'Faculty Members', render: (d) => d._count?.faculty ?? 0 },
        {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (d) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => onEdit(d)}>Edit</Button>
              <Button variant="danger" className="h-8 px-2 text-xs" onClick={() => onDelete(d.id)}>Delete</Button>
            </div>
          ),
        },
      ]}
      rows={items}
      rowKey={(d) => d.id}
      empty={<EmptyState title="No departments" description="Add your first department to get started." />}
    />
  );
}

export function CoursesTable({
  items,
  onEdit,
  onDelete,
}: {
  items: Course[];
  onEdit: (c: Course) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table<Course>
      columns={[
        { key: 'name', header: 'Course Name', render: (c) => <span className="font-semibold text-slate-900">{c.name}</span> },
        { key: 'code', header: 'Code', render: (c) => <span className="font-mono text-xs font-bold">{c.code}</span> },
        { key: 'dept', header: 'Department', render: (c) => c.department?.name || '—' },
        { key: 'dur', header: 'Duration', render: (c) => `${c.durationSemesters} Semesters` },
        {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (c) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => onEdit(c)}>Edit</Button>
              <Button variant="danger" className="h-8 px-2 text-xs" onClick={() => onDelete(c.id)}>Delete</Button>
            </div>
          ),
        },
      ]}
      rows={items}
      rowKey={(c) => c.id}
      empty={<EmptyState title="No courses" description="Add degree programs or courses." />}
    />
  );
}

export function SemestersTable({
  items,
  onEdit,
}: {
  items: Semester[];
  onEdit: (s: Semester) => void;
}) {
  return (
    <Table<Semester>
      columns={[
        { key: 'course', header: 'Course', render: (s) => s.course?.name || '—' },
        { key: 'num', header: 'Semester', render: (s) => `Semester ${s.number}` },
        { key: 'year', header: 'Academic Year', render: (s) => s.academicYear },
        { key: 'dates', header: 'Term Dates', render: (s) => `${s.startDate.slice(0, 10)} to ${s.endDate.slice(0, 10)}` },
        { key: 'status', header: 'Status', render: (s) => s.isCurrent ? <Badge tone="green">Current Term</Badge> : <Badge tone="gray">Inactive</Badge> },
        {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (s) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => onEdit(s)}>Edit</Button>
            </div>
          ),
        },
      ]}
      rows={items}
      rowKey={(s) => s.id}
      empty={<EmptyState title="No semesters" description="Create semesters for your active courses." />}
    />
  );
}

export function SectionsTable({
  items,
  onEdit,
  onDelete,
}: {
  items: Section[];
  onEdit: (s: Section) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table<Section>
      columns={[
        { key: 'name', header: 'Section', render: (s) => <span className="font-bold text-slate-900">Section {s.name}</span> },
        { key: 'sem', header: 'Semester & Course', render: (s) => `${s.semester?.course?.code || ''} - Sem ${s.semester?.number || ''} (${s.semester?.academicYear || ''})` },
        { key: 'students', header: 'Students Enrolled', render: (s) => s._count?.students ?? 0 },
        {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (s) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => onEdit(s)}>Edit</Button>
              <Button variant="danger" className="h-8 px-2 text-xs" onClick={() => onDelete(s.id)}>Delete</Button>
            </div>
          ),
        },
      ]}
      rows={items}
      rowKey={(s) => s.id}
      empty={<EmptyState title="No sections" description="Add sections (e.g. A, B) to divide classes." />}
    />
  );
}

export function SubjectsTable({
  items,
  onEdit,
  onDelete,
}: {
  items: Subject[];
  onEdit: (s: Subject) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table<Subject>
      columns={[
        { key: 'code', header: 'Code', render: (s) => <span className="font-mono text-xs font-bold">{s.code}</span> },
        { key: 'name', header: 'Subject Name', render: (s) => <span className="font-semibold text-slate-900">{s.name}</span> },
        { key: 'sem', header: 'Semester', render: (s) => `Sem ${s.semester?.number || ''} (${s.semester?.academicYear || ''})` },
        { key: 'credits', header: 'Credits', render: (s) => s.credits },
        {
          key: 'type',
          header: 'Type',
          render: (s) => (
            <Badge tone={s.type === 'THEORY' ? 'blue' : s.type === 'PRACTICAL' ? 'green' : 'amber'}>
              {s.type}
            </Badge>
          ),
        },
        {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (s) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => onEdit(s)}>Edit</Button>
              <Button variant="danger" className="h-8 px-2 text-xs" onClick={() => onDelete(s.id)}>Delete</Button>
            </div>
          ),
        },
      ]}
      rows={items}
      rowKey={(s) => s.id}
      empty={<EmptyState title="No subjects" description="Add curriculum subjects." />}
    />
  );
}

export function AllocationsTable({
  items,
  onDelete,
}: {
  items: SubjectAllocation[];
  onDelete: (id: string) => void;
}) {
  return (
    <Table<SubjectAllocation>
      columns={[
        { key: 'sub', header: 'Subject', render: (a) => `${a.subject.name} (${a.subject.code})` },
        { key: 'sec', header: 'Section', render: (a) => `Sec ${a.section.name}` },
        { key: 'sem', header: 'Semester & Course', render: (a) => `${a.section.semester?.course?.name || ''} - Sem ${a.section.semester?.number || ''}` },
        {
          key: 'fac',
          header: 'Assigned Faculty',
          render: (a) => (
            <div>
              <span className="font-semibold text-slate-900">{a.faculty.user.firstName} {a.faculty.user.lastName}</span>
              <span className="ml-2 font-mono text-xs text-slate-500">({a.faculty.employeeId})</span>
            </div>
          ),
        },
        {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (a) => (
            <div className="flex justify-end gap-2">
              <Button variant="danger" className="h-8 px-2 text-xs" onClick={() => onDelete(a.id)}>Remove</Button>
            </div>
          ),
        },
      ]}
      rows={items}
      rowKey={(a) => a.id}
      empty={<EmptyState title="No allocations" description="Assign teachers to subjects and sections." />}
    />
  );
}
