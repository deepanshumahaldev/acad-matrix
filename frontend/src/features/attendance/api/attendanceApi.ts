import { api } from '@/lib/apiClient';
import type {
  AttendanceHistoryRecord,
  AttendanceSessionItem,
  StudentRecordItem,
  StudentAttendanceSummary,
} from '../types';

const base = '/api/v1/attendance';

export const getMyAttendance = async () =>
  (await api.get<{ summary: StudentAttendanceSummary; history: AttendanceHistoryRecord[] }>(`${base}/my`)).data;

export const getRoster = async (allocationId: string) =>
  (
    await api.get<{
      allocation: { id: string; subject: { name: string; code: string }; section: { name: string } };
      students: Array<{ id: string; rollNumber: string; user: { firstName: string; lastName: string; email: string } }>;
    }>(`${base}/roster/${allocationId}`)
  ).data;

export const markAttendance = async (body: {
  allocationId: string;
  date: string;
  period: number;
  topic?: string;
  records: StudentRecordItem[];
}) => (await api.post<AttendanceSessionItem>(`${base}/mark`, body)).data;

export const updateAttendance = async (
  id: string,
  body: { topic?: string; records?: StudentRecordItem[] },
) => (await api.patch<AttendanceSessionItem>(`${base}/sessions/${id}`, body)).data;

export const getSessions = async (params?: { allocationId?: string; sectionId?: string; date?: string; facultyId?: string }) => {
  const q = new URLSearchParams();
  if (params?.allocationId) q.set('allocationId', params.allocationId);
  if (params?.sectionId) q.set('sectionId', params.sectionId);
  if (params?.date) q.set('date', params.date);
  if (params?.facultyId) q.set('facultyId', params.facultyId);
  const s = q.toString();
  return (await api.get<AttendanceSessionItem[]>(`${base}/sessions${s ? `?${s}` : ''}`)).data;
};

export const getSessionById = async (id: string) =>
  (await api.get<AttendanceSessionItem>(`${base}/sessions/${id}`)).data;

export const getStudentSummary = async (studentId: string) =>
  (await api.get<StudentAttendanceSummary>(`${base}/student/${studentId}/summary`)).data;
