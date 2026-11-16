import { api } from '@/lib/apiClient';
import type { CreateExamPayload, ExamItem, ExamResultItem, ExamType, RecordResultPayload } from '../types';

const base = '/api/v1/exams';

export const listExams = async (params?: {
  semesterId?: string;
  subjectId?: string;
  sectionId?: string;
  type?: ExamType;
  upcoming?: boolean;
}) => {
  const q = new URLSearchParams();
  if (params?.semesterId) q.set('semesterId', params.semesterId);
  if (params?.subjectId) q.set('subjectId', params.subjectId);
  if (params?.sectionId) q.set('sectionId', params.sectionId);
  if (params?.type) q.set('type', params.type);
  if (params?.upcoming) q.set('upcoming', 'true');
  const s = q.toString();
  return (await api.get<ExamItem[]>(`${base}${s ? `?${s}` : ''}`)).data;
};

export const getExamById = async (id: string) =>
  (await api.get<ExamItem>(`${base}/${id}`)).data;

export const createExam = async (payload: CreateExamPayload) =>
  (await api.post<ExamItem>(base, payload)).data;

export const updateExam = async (id: string, payload: Partial<CreateExamPayload>) =>
  (await api.patch<ExamItem>(`${base}/${id}`, payload)).data;

export const deleteExam = async (id: string) =>
  (await api.delete<{ id: string }>(`${base}/${id}`)).data;

export const recordExamResults = async (examId: string, results: RecordResultPayload[]) =>
  (await api.post<ExamResultItem[]>(`${base}/${examId}/results`, { results })).data;

export const getMyExamResults = async () =>
  (await api.get<ExamResultItem[]>(`${base}/my-results`)).data;
