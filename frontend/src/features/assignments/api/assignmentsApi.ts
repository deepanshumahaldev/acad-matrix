import { api } from '@/lib/apiClient';
import type {
  AssignmentItem,
  CreateAssignmentPayload,
  GradeSubmissionPayload,
  SubmissionItem,
  SubmitAssignmentPayload,
} from '../types';

const base = '/api/v1/assignments';

export const listAssignments = async (params?: { allocationId?: string; sectionId?: string; upcoming?: boolean }) => {
  const q = new URLSearchParams();
  if (params?.allocationId) q.set('allocationId', params.allocationId);
  if (params?.sectionId) q.set('sectionId', params.sectionId);
  if (params?.upcoming) q.set('upcoming', 'true');
  const s = q.toString();
  return (await api.get<AssignmentItem[]>(`${base}${s ? `?${s}` : ''}`)).data;
};

export const getAssignmentById = async (id: string) =>
  (await api.get<AssignmentItem>(`${base}/${id}`)).data;

export const createAssignment = async (payload: CreateAssignmentPayload) =>
  (await api.post<AssignmentItem>(base, payload)).data;

export const updateAssignment = async (id: string, payload: Partial<CreateAssignmentPayload>) =>
  (await api.patch<AssignmentItem>(`${base}/${id}`, payload)).data;

export const deleteAssignment = async (id: string) =>
  (await api.delete<{ id: string }>(`${base}/${id}`)).data;

export const submitAssignment = async (assignmentId: string, payload: SubmitAssignmentPayload) =>
  (await api.post<SubmissionItem>(`${base}/${assignmentId}/submit`, payload)).data;

export const gradeSubmission = async (submissionId: string, payload: GradeSubmissionPayload) =>
  (await api.post<SubmissionItem>(`${base}/submissions/${submissionId}/grade`, payload)).data;
