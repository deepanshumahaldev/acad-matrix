import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import {
  createAllocation,
  createCourse,
  createDepartment,
  createSection,
  createSemester,
  createSubject,
  deleteAllocation,
  deleteCourse,
  deleteDepartment,
  deleteSection,
  deleteSubject,
  getAllocations,
  getCourses,
  getDepartments,
  getSections,
  getSemesters,
  getSubjects,
  updateCourse,
  updateDepartment,
  updateSection,
  updateSemester,
  updateSubject,
} from '../api/academicsApi';
import {
  AllocationsTable,
  CoursesTable,
  DepartmentsTable,
  SectionsTable,
  SemestersTable,
  SubjectsTable,
} from '../components/AcademicTabs';
import { AllocationModal } from '../components/AllocationModal';
import { CourseModal } from '../components/CourseModal';
import { DepartmentModal } from '../components/DepartmentModal';
import { SectionModal } from '../components/SectionModal';
import { SemesterModal } from '../components/SemesterModal';
import { SubjectModal } from '../components/SubjectModal';
import type { Course, Department, Section, Semester, Subject } from '../types';

type Tab = 'departments' | 'courses' | 'semesters' | 'sections' | 'subjects' | 'allocations';

export function AcademicSetupPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('departments');

  // Modals state
  const [deptModal, setDeptModal] = useState<{ open: boolean; item?: Department | null }>({ open: false });
  const [courseModal, setCourseModal] = useState<{ open: boolean; item?: Course | null }>({ open: false });
  const [semModal, setSemModal] = useState<{ open: boolean; item?: Semester | null }>({ open: false });
  const [secModal, setSecModal] = useState<{ open: boolean; item?: Section | null }>({ open: false });
  const [subModal, setSubModal] = useState<{ open: boolean; item?: Subject | null }>({ open: false });
  const [allocModal, setAllocModal] = useState(false);

  // Queries
  const { data: depts = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => getCourses() });
  const { data: semesters = [] } = useQuery({ queryKey: ['semesters'], queryFn: () => getSemesters() });
  const { data: sections = [] } = useQuery({ queryKey: ['sections'], queryFn: () => getSections() });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => getSubjects() });
  const { data: allocations = [] } = useQuery({ queryKey: ['allocations'], queryFn: () => getAllocations() });

  const invalidate = (key: string) => queryClient.invalidateQueries({ queryKey: [key] });

  // Delete mutations
  const deleteDeptMut = useMutation({ mutationFn: deleteDepartment, onSuccess: () => invalidate('departments') });
  const deleteCourseMut = useMutation({ mutationFn: deleteCourse, onSuccess: () => invalidate('courses') });
  const deleteSecMut = useMutation({ mutationFn: deleteSection, onSuccess: () => invalidate('sections') });
  const deleteSubMut = useMutation({ mutationFn: deleteSubject, onSuccess: () => invalidate('subjects') });
  const deleteAllocMut = useMutation({ mutationFn: deleteAllocation, onSuccess: () => invalidate('allocations') });

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'departments', label: 'Departments', count: depts.length },
    { id: 'courses', label: 'Courses', count: courses.length },
    { id: 'semesters', label: 'Semesters', count: semesters.length },
    { id: 'sections', label: 'Sections', count: sections.length },
    { id: 'subjects', label: 'Subjects', count: subjects.length },
    { id: 'allocations', label: 'Faculty Allocations', count: allocations.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Structure</h1>
          <p className="text-sm text-slate-500">Configure programs, semesters, sections, subjects, and teaching assignments</p>
        </div>
        <div>
          {activeTab === 'departments' && <Button onClick={() => setDeptModal({ open: true, item: null })}>+ Add Department</Button>}
          {activeTab === 'courses' && <Button onClick={() => setCourseModal({ open: true, item: null })}>+ Add Course</Button>}
          {activeTab === 'semesters' && <Button onClick={() => setSemModal({ open: true, item: null })}>+ Add Semester</Button>}
          {activeTab === 'sections' && <Button onClick={() => setSecModal({ open: true, item: null })}>+ Add Section</Button>}
          {activeTab === 'subjects' && <Button onClick={() => setSubModal({ open: true, item: null })}>+ Add Subject</Button>}
          {activeTab === 'allocations' && <Button onClick={() => setAllocModal(true)}>+ Allocate Faculty</Button>}
        </div>
      </div>

      <div className="flex gap-2 border-b border-line overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'border-brand text-brand font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t.count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'departments' && (
        <DepartmentsTable
          items={depts}
          onEdit={(d) => setDeptModal({ open: true, item: d })}
          onDelete={(id) => deleteDeptMut.mutate(id)}
        />
      )}
      {activeTab === 'courses' && (
        <CoursesTable
          items={courses}
          onEdit={(c) => setCourseModal({ open: true, item: c })}
          onDelete={(id) => deleteCourseMut.mutate(id)}
        />
      )}
      {activeTab === 'semesters' && (
        <SemestersTable
          items={semesters}
          onEdit={(s) => setSemModal({ open: true, item: s })}
        />
      )}
      {activeTab === 'sections' && (
        <SectionsTable
          items={sections}
          onEdit={(s) => setSecModal({ open: true, item: s })}
          onDelete={(id) => deleteSecMut.mutate(id)}
        />
      )}
      {activeTab === 'subjects' && (
        <SubjectsTable
          items={subjects}
          onEdit={(s) => setSubModal({ open: true, item: s })}
          onDelete={(id) => deleteSubMut.mutate(id)}
        />
      )}
      {activeTab === 'allocations' && (
        <AllocationsTable
          items={allocations}
          onDelete={(id) => deleteAllocMut.mutate(id)}
        />
      )}

      {/* Modals */}
      <DepartmentModal
        open={deptModal.open}
        departmentToEdit={deptModal.item}
        onClose={() => setDeptModal({ open: false })}
        onSubmit={async (data) => {
          if (deptModal.item) await updateDepartment(deptModal.item.id, data);
          else await createDepartment(data);
          invalidate('departments');
        }}
      />
      <CourseModal
        open={courseModal.open}
        courseToEdit={courseModal.item}
        departments={depts}
        onClose={() => setCourseModal({ open: false })}
        onSubmit={async (data) => {
          if (courseModal.item) await updateCourse(courseModal.item.id, data);
          else await createCourse(data);
          invalidate('courses');
        }}
      />
      <SemesterModal
        open={semModal.open}
        semesterToEdit={semModal.item}
        courses={courses}
        onClose={() => setSemModal({ open: false })}
        onSubmit={async (data) => {
          if (semModal.item) await updateSemester(semModal.item.id, data);
          else await createSemester(data);
          invalidate('semesters');
        }}
      />
      <SectionModal
        open={secModal.open}
        sectionToEdit={secModal.item}
        semesters={semesters}
        onClose={() => setSecModal({ open: false })}
        onSubmit={async (data) => {
          if (secModal.item) await updateSection(secModal.item.id, data);
          else await createSection(data);
          invalidate('sections');
        }}
      />
      <SubjectModal
        open={subModal.open}
        subjectToEdit={subModal.item}
        semesters={semesters}
        onClose={() => setSubModal({ open: false })}
        onSubmit={async (data) => {
          if (subModal.item) await updateSubject(subModal.item.id, data);
          else await createSubject(data);
          invalidate('subjects');
        }}
      />
      <AllocationModal
        open={allocModal}
        semesters={semesters}
        onClose={() => setAllocModal(false)}
        onSubmit={async (data) => {
          await createAllocation(data);
          invalidate('allocations');
        }}
      />
    </div>
  );
}
