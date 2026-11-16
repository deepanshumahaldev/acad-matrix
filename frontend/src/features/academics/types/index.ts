export type SubjectType = 'THEORY' | 'PRACTICAL' | 'ELECTIVE';

export interface Department {
  id: string;
  name: string;
  code: string;
  _count?: { courses: number; faculty: number };
}

export interface Course {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  durationSemesters: number;
  department?: { id: string; name: string; code: string };
  _count?: { semesters: number; students: number };
}

export interface Semester {
  id: string;
  courseId: string;
  number: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  course?: { id: string; name: string; code: string };
  sections?: Section[];
  subjects?: Subject[];
  _count?: { sections: number; subjects: number; students: number };
}

export interface Section {
  id: string;
  semesterId: string;
  name: string;
  semester?: { id: string; number: number; academicYear: string; course?: { id: string; name: string; code: string } };
  _count?: { students: number; allocations: number };
}

export interface Subject {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  credits: number;
  type: SubjectType;
  semester?: { id: string; number: number; academicYear: string; course?: { id: string; name: string; code: string } };
  _count?: { allocations: number };
}

export interface SubjectAllocation {
  id: string;
  subjectId: string;
  sectionId: string;
  facultyId: string;
  subject: { id: string; name: string; code: string; semesterId: string };
  section: { id: string; name: string; semesterId: string; semester?: { id: string; number: number; academicYear: string; course?: { name: string } } };
  faculty: { id: string; employeeId: string; user: { firstName: string; lastName: string; email: string } };
}
