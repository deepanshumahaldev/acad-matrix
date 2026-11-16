import { api } from '@/lib/apiClient';
import type {
  Course,
  Department,
  Section,
  Semester,
  Subject,
  SubjectAllocation,
  SubjectType,
} from '../types';

const base = '/api/v1/academics';

// ── Departments ──
export const getDepartments = async () => (await api.get<Department[]>(`${base}/departments`)).data;
export const createDepartment = async (body: { name: string; code: string }) =>
  (await api.post<Department>(`${base}/departments`, body)).data;
export const updateDepartment = async (id: string, body: { name?: string; code?: string }) =>
  (await api.patch<Department>(`${base}/departments/${id}`, body)).data;
export const deleteDepartment = async (id: string) => (await api.delete(`${base}/departments/${id}`)).data;

// ── Courses ──
export const getCourses = async (departmentId?: string) => {
  const query = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
  return (await api.get<Course[]>(`${base}/courses${query}`)).data;
};
export const createCourse = async (body: {
  departmentId: string;
  name: string;
  code: string;
  durationSemesters?: number;
}) => (await api.post<Course>(`${base}/courses`, body)).data;
export const updateCourse = async (
  id: string,
  body: { departmentId?: string; name?: string; code?: string; durationSemesters?: number },
) => (await api.patch<Course>(`${base}/courses/${id}`, body)).data;
export const deleteCourse = async (id: string) => (await api.delete(`${base}/courses/${id}`)).data;

// ── Semesters ──
export const getSemesters = async (courseId?: string, academicYear?: string) => {
  const params = new URLSearchParams();
  if (courseId) params.set('courseId', courseId);
  if (academicYear) params.set('academicYear', academicYear);
  const q = params.toString();
  return (await api.get<Semester[]>(`${base}/semesters${q ? `?${q}` : ''}`)).data;
};
export const createSemester = async (body: {
  courseId: string;
  number: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}) => (await api.post<Semester>(`${base}/semesters`, body)).data;
export const updateSemester = async (
  id: string,
  body: { number?: number; academicYear?: string; startDate?: string; endDate?: string; isCurrent?: boolean },
) => (await api.patch<Semester>(`${base}/semesters/${id}`, body)).data;

// ── Sections ──
export const getSections = async (semesterId?: string) => {
  const q = semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : '';
  return (await api.get<Section[]>(`${base}/sections${q}`)).data;
};
export const createSection = async (body: { semesterId: string; name: string }) =>
  (await api.post<Section>(`${base}/sections`, body)).data;
export const updateSection = async (id: string, body: { name: string }) =>
  (await api.patch<Section>(`${base}/sections/${id}`, body)).data;
export const deleteSection = async (id: string) => (await api.delete(`${base}/sections/${id}`)).data;

// ── Subjects ──
export const getSubjects = async (semesterId?: string) => {
  const q = semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : '';
  return (await api.get<Subject[]>(`${base}/subjects${q}`)).data;
};
export const createSubject = async (body: {
  semesterId: string;
  code: string;
  name: string;
  credits?: number;
  type?: SubjectType;
}) => (await api.post<Subject>(`${base}/subjects`, body)).data;
export const updateSubject = async (
  id: string,
  body: { code?: string; name?: string; credits?: number; type?: SubjectType },
) => (await api.patch<Subject>(`${base}/subjects/${id}`, body)).data;
export const deleteSubject = async (id: string) => (await api.delete(`${base}/subjects/${id}`)).data;

// ── Allocations ──
export const getAllocations = async (filter?: {
  facultyId?: string;
  subjectId?: string;
  sectionId?: string;
  semesterId?: string;
}) => {
  const params = new URLSearchParams();
  if (filter?.facultyId) params.set('facultyId', filter.facultyId);
  if (filter?.subjectId) params.set('subjectId', filter.subjectId);
  if (filter?.sectionId) params.set('sectionId', filter.sectionId);
  if (filter?.semesterId) params.set('semesterId', filter.semesterId);
  const q = params.toString();
  return (await api.get<SubjectAllocation[]>(`${base}/allocations${q ? `?${q}` : ''}`)).data;
};
export const createAllocation = async (body: { subjectId: string; sectionId: string; facultyId: string }) =>
  (await api.post<SubjectAllocation>(`${base}/allocations`, body)).data;
export const deleteAllocation = async (id: string) => (await api.delete(`${base}/allocations/${id}`)).data;
