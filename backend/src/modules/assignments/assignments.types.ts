import type { SubmissionStatus } from '@prisma/client';

export interface CreateAssignmentInput {
  allocationId: string;
  title: string;
  description?: string;
  dueAt: string;
  maxMarks?: number;
  attachmentKey?: string;
  attachmentName?: string;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  dueAt?: string;
  maxMarks?: number;
  attachmentKey?: string;
  attachmentName?: string;
}

export interface SubmitAssignmentInput {
  assignmentId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note?: string;
}

export interface GradeSubmissionInput {
  marks: number;
  feedback?: string;
}

export interface AssignmentFilterQuery {
  allocationId?: string;
  sectionId?: string;
  facultyId?: string;
  status?: SubmissionStatus;
  upcoming?: boolean;
}
