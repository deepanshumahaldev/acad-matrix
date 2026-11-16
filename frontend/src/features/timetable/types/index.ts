export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface TimetableSlotItem {
  id: string;
  allocationId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  room: string;
  allocation: {
    id: string;
    subject: { id: string; name: string; code: string };
    section: {
      id: string;
      name: string;
      semester?: { id: string; number: number; course?: { code: string; name: string } };
    };
    faculty: {
      id: string;
      user: { firstName: string; lastName: string; email: string };
    };
  };
}

export interface CreateSlotPayload {
  allocationId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  room: string;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${ampm}`;
}

export function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToInputVal(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
