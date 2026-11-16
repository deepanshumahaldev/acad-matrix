export type SubmissionStatus = 'SUBMITTED' | 'LATE' | 'GRADED';

export interface AssignmentItem {
  id: string;
  allocationId: string;
  createdById: string;
  title: string;
  description?: string | null;
  dueAt: string;
  maxMarks: number;
  attachmentKey?: string | null;
  attachmentName?: string | null;
  allocation?: {
    subject?: { name: string; code: string };
    section?: { name: string };
    faculty?: { user: { firstName: string; lastName: string } };
  };
  submissions?: SubmissionItem[];
  _count?: { submissions: number };
}

export interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note?: string | null;
  status: SubmissionStatus;
  submittedAt: string;
  marks?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
  student?: {
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface CreateAssignmentPayload {
  allocationId: string;
  title: string;
  description?: string;
  dueAt: string;
  maxMarks?: number;
  attachmentKey?: string;
  attachmentName?: string;
}

export interface SubmitAssignmentPayload {
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note?: string;
}

export interface GradeSubmissionPayload {
  marks: number;
  feedback?: string;
}
