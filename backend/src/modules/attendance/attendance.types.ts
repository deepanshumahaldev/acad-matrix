import type { AttendanceStatus } from '@prisma/client';

export interface StudentAttendanceItem {
  studentId: string;
  status: AttendanceStatus;
  remark?: string;
}

export interface MarkAttendanceInput {
  allocationId: string;
  date: string;
  period: number;
  topic?: string;
  records: StudentAttendanceItem[];
}

export interface UpdateAttendanceInput {
  topic?: string;
  records?: StudentAttendanceItem[];
}

export interface AttendanceSubjectSummary {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number;
  isLowAttendance: boolean;
}

export interface StudentAttendanceSummary {
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number;
  isLowAttendance: boolean;
  bySubject: AttendanceSubjectSummary[];
}
