export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface StudentRecordItem {
  studentId: string;
  status: AttendanceStatus;
  remark?: string;
}

export interface AttendanceSubjectStats {
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
  bySubject: AttendanceSubjectStats[];
}

export interface AttendanceSessionItem {
  id: string;
  allocationId: string;
  markedById: string;
  date: string;
  period: number;
  topic?: string | null;
  allocation: {
    id: string;
    subject: { id: string; name: string; code: string };
    section: { id: string; name: string };
    faculty: { user: { firstName: string; lastName: string } };
  };
  records?: Array<{
    id: string;
    studentId: string;
    status: AttendanceStatus;
    remark?: string | null;
    student: {
      rollNumber: string;
      user: { firstName: string; lastName: string; email: string };
    };
  }>;
  _count?: { records: number };
}

export interface AttendanceHistoryRecord {
  id: string;
  status: AttendanceStatus;
  remark?: string | null;
  session: {
    date: string;
    period: number;
    topic?: string | null;
    allocation: {
      subject: { code: string; name: string };
      section: { name: string };
    };
  };
}
