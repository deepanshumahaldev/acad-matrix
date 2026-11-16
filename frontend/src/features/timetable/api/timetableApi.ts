import { api } from '@/lib/apiClient';
import type { CreateSlotPayload, DayOfWeek, TimetableSlotItem } from '../types';

const base = '/api/v1/timetable';

export const getSlots = async (params: {
  sectionId?: string;
  facultyId?: string;
  room?: string;
  dayOfWeek?: DayOfWeek;
  semesterId?: string;
}) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return (await api.get<TimetableSlotItem[]>(`${base}${s ? `?${s}` : ''}`)).data;
};

export const getMyTimetable = async () => (await api.get<TimetableSlotItem[]>(`${base}/my`)).data;

export const getSlotById = async (id: string) => (await api.get<TimetableSlotItem>(`${base}/${id}`)).data;

export const createSlot = async (body: CreateSlotPayload) =>
  (await api.post<TimetableSlotItem>(base, body)).data;

export const updateSlot = async (id: string, body: Partial<CreateSlotPayload>) =>
  (await api.patch<TimetableSlotItem>(`${base}/${id}`, body)).data;

export const deleteSlot = async (id: string) => (await api.delete(`${base}/${id}`)).data;
