import { api } from '@/lib/apiClient';
import type {
  AssignFeePayload,
  CreateFeeStructurePayload,
  FeeStatus,
  FeeStructureItem,
  PaymentItem,
  RecordPaymentPayload,
  StudentFeeItem,
  StudentFeeSummary,
} from '../types';

const base = '/api/v1/fees';

export const listFeeStructures = async (courseId?: string) => {
  const q = courseId ? `?courseId=${courseId}` : '';
  return (await api.get<FeeStructureItem[]>(`${base}/structures${q}`)).data;
};

export const createFeeStructure = async (payload: CreateFeeStructurePayload) =>
  (await api.post<FeeStructureItem>(`${base}/structures`, payload)).data;

export const assignFeeStructure = async (payload: AssignFeePayload) =>
  (await api.post<{ assignedCount: number }>(`${base}/structures/assign`, payload)).data;

export const listStudentFees = async (params?: {
  courseId?: string;
  semesterId?: string;
  studentId?: string;
  status?: FeeStatus;
}) => {
  const q = new URLSearchParams();
  if (params?.courseId) q.set('courseId', params.courseId);
  if (params?.semesterId) q.set('semesterId', params.semesterId);
  if (params?.studentId) q.set('studentId', params.studentId);
  if (params?.status) q.set('status', params.status);
  const s = q.toString();
  return (await api.get<StudentFeeItem[]>(`${base}/student-fees${s ? `?${s}` : ''}`)).data;
};

export const getStudentFeeById = async (id: string) =>
  (await api.get<StudentFeeItem>(`${base}/student-fees/${id}`)).data;

export const recordPayment = async (payload: RecordPaymentPayload) =>
  (await api.post<PaymentItem>(`${base}/payments`, payload)).data;

export const getMyFeeSummary = async () =>
  (await api.get<StudentFeeSummary>(`${base}/my-summary`)).data;
