import { api } from '@/lib/apiClient';
import type {
  CsvImportResult,
  FacultyFormData,
  FacultyItem,
  StudentFormData,
  StudentItem,
  UserStatus,
} from '../types';

const base = '/api/v1/users';

function toQueryString(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ── Faculty ──
export const getFacultyList = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: UserStatus;
}) => {
  const res = await api.get<FacultyItem[]>(`${base}/faculty${toQueryString(params)}`);
  return { items: res.data, meta: res.meta };
};

export const getFacultyById = async (id: string) =>
  (await api.get<FacultyItem>(`${base}/faculty/${id}`)).data;

export const createFaculty = async (body: FacultyFormData) =>
  (await api.post<FacultyItem & { temporaryPassword?: string }>(`${base}/faculty`, body)).data;

export const updateFaculty = async (id: string, body: Partial<FacultyFormData>) =>
  (await api.patch<FacultyItem>(`${base}/faculty/${id}`, body)).data;

export const setFacultyStatus = async (id: string, status: UserStatus) =>
  (await api.patch<{ id: string; status: UserStatus }>(`${base}/faculty/${id}/status`, { status })).data;

export const importFacultyCsv = async (csvData: string) =>
  (await api.post<CsvImportResult>(`${base}/faculty/import-csv`, { csvData })).data;

// ── Students ──
export const getStudentList = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
  semesterId?: string;
  sectionId?: string;
  status?: UserStatus;
}) => {
  const res = await api.get<StudentItem[]>(`${base}/students${toQueryString(params)}`);
  return { items: res.data, meta: res.meta };
};

export const getStudentById = async (id: string) =>
  (await api.get<StudentItem>(`${base}/students/${id}`)).data;

export const createStudent = async (body: StudentFormData) =>
  (await api.post<StudentItem & { temporaryPassword?: string }>(`${base}/students`, body)).data;

export const updateStudent = async (id: string, body: Partial<StudentFormData>) =>
  (await api.patch<StudentItem>(`${base}/students/${id}`, body)).data;

export const setStudentStatus = async (id: string, status: UserStatus) =>
  (await api.patch<{ id: string; status: UserStatus }>(`${base}/students/${id}/status`, { status })).data;

export const importStudentsCsv = async (csvData: string) =>
  (await api.post<CsvImportResult>(`${base}/students/import-csv`, { csvData })).data;

// ── Unlock ──
export const unlockUser = async (userId: string) =>
  (await api.post<{ id: string; failedLoginAttempts: number }>(`${base}/${userId}/unlock`)).data;
