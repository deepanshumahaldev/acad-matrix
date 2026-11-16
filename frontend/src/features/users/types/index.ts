export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: UserStatus;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
}

export interface FacultyItem {
  id: string;
  userId: string;
  employeeId: string;
  departmentId: string;
  designation?: string | null;
  joiningDate?: string | null;
  user: UserSummary;
  department: { id: string; name: string; code: string };
  allocations?: Array<{
    id: string;
    subject: { id: string; name: string; code: string };
    section: { id: string; name: string };
  }>;
}

export interface StudentItem {
  id: string;
  userId: string;
  rollNumber: string;
  courseId: string;
  semesterId: string;
  sectionId: string;
  admissionYear: number;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  user: UserSummary;
  course: { id: string; name: string; code: string };
  semester: { id: string; number: number; academicYear: string };
  section: { id: string; name: string };
}

export interface FacultyFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId: string;
  departmentId: string;
  designation?: string;
  joiningDate?: string;
}

export interface StudentFormData {
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
