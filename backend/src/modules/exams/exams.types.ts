export type ExamType = 'QUIZ' | 'INTERNAL' | 'MID_TERM' | 'END_TERM' | 'PRACTICAL';

export interface CreateExamInput {
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

export interface UpdateExamInput {
  title?: string;
  type?: ExamType;
  examDate?: string;
  startMinute?: number;
  endMinute?: number;
  room?: string;
  maxMarks?: number;
}

export interface ExamResultItem {
  studentId: string;
  marksObtained: number;
  grade?: string;
  remarks?: string;
}

export interface RecordExamResultsInput {
  results: ExamResultItem[];
}

export interface ExamFilterQuery {
  semesterId?: string;
  subjectId?: string;
  sectionId?: string;
  type?: ExamType;
  upcoming?: boolean;
}
