import type { DayOfWeek } from '@prisma/client';

export interface CreateSlotInput {
  allocationId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  room: string;
}

export interface UpdateSlotInput {
  allocationId?: string;
  dayOfWeek?: DayOfWeek;
  startMinute?: number;
  endMinute?: number;
  room?: string;
}

export interface TimetableQuery {
  sectionId?: string;
  facultyId?: string;
  room?: string;
  dayOfWeek?: DayOfWeek;
  semesterId?: string;
}

export interface SlotConflictCheck {
  slotIdToIgnore?: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  room: string;
  facultyId: string;
  sectionId: string;
}
