import type { SubjectType } from '@prisma/client';

export interface CreateDepartmentInput {
  name: string;
  code: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
}

export interface CreateCourseInput {
  departmentId: string;
  name: string;
  code: string;
  durationSemesters?: number;
}

export interface UpdateCourseInput {
  departmentId?: string;
  name?: string;
  code?: string;
  durationSemesters?: number;
}

export interface CreateSemesterInput {
  courseId: string;
  number: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface UpdateSemesterInput {
  number?: number;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface CreateSectionInput {
  semesterId: string;
  name: string;
}

export interface UpdateSectionInput {
  name: string;
}

export interface CreateSubjectInput {
  semesterId: string;
  code: string;
  name: string;
  credits?: number;
  type?: SubjectType;
}

export interface UpdateSubjectInput {
  code?: string;
  name?: string;
  credits?: number;
  type?: SubjectType;
}

export interface CreateAllocationInput {
  subjectId: string;
  sectionId: string;
  facultyId: string;
}

export interface AllocationFilterQuery {
  facultyId?: string;
  subjectId?: string;
  sectionId?: string;
  semesterId?: string;
}
