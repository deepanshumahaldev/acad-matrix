export type ExamType = 'QUIZ' | 'INTERNAL' | 'MID_TERM' | 'END_TERM' | 'PRACTICAL';

export interface ExamItem {
  id: string;
  semesterId: string;
  subjectId: string;
  sectionId?: string | null;
  title: string;
  type: ExamType;
  examDate: string;
  startMinute: number;
  endMinute: number;
  room?: string | null;
  maxMarks: number;
  subject?: { id: string; name: string; code: string };
  semester?: { id: string; number: number; academicYear: string; course?: { name: string; code: string } };
  section?: { id: string; name: string } | null;
  results?: ExamResultItem[];
  _count?: { results: number };
}

export interface ExamResultItem {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  grade?: string | null;
  remarks?: string | null;
  createdAt?: string;
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
  };
  exam?: ExamItem;
}

export interface CreateExamPayload {
  semesterId: string;
  subjectId: string;
  sectionId?: string;
  title: string;
  type: ExamType;
  examDate: string; // YYYY-MM-DD
  startMinute: number;
  endMinute: number;
  room?: string;
  maxMarks?: number;
}

export interface RecordResultPayload {
  studentId: string;
  marksObtained: number;
  grade?: string;
  remarks?: string;
}
