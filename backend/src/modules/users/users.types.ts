import type { UserStatus } from '@prisma/client';
import type { PaginationQuery } from '../../common/utils/pagination';

export interface FacultyFilterQuery extends PaginationQuery {
  departmentId?: string;
  status?: UserStatus;
}

export interface StudentFilterQuery extends PaginationQuery {
  courseId?: string;
  semesterId?: string;
  sectionId?: string;
  status?: UserStatus;
}

export interface CreateFacultyInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId: string;
  departmentId: string;
  designation?: string;
  joiningDate?: string;
}

export interface UpdateFacultyInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  departmentId?: string;
  designation?: string;
  joiningDate?: string;
}

export interface CreateStudentInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  rollNumber: string;
  courseId: string;
  semesterId: string;
  sectionId: string;
  admissionYear: number;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  courseId?: string;
  semesterId?: string;
  sectionId?: string;
  admissionYear?: number;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface CsvImportError {
  row: number;
  identifier?: string;
  reason: string;
}

export interface CsvImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: CsvImportError[];
}
