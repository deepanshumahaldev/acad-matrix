import { DayOfWeek } from '@prisma/client';
import { z } from 'zod';

const timeMinuteSchema = z.coerce.number().int().min(0).max(1439);
const roomSchema = z.string().trim().min(1).max(50);
const uuidSchema = z.string().uuid();

export const idParam = z.object({ id: uuidSchema });

export const createSlotBody = z
  .object({
    allocationId: uuidSchema,
    dayOfWeek: z.nativeEnum(DayOfWeek),
    startMinute: timeMinuteSchema,
    endMinute: timeMinuteSchema,
    room: roomSchema,
  })
  .refine((d) => d.startMinute < d.endMinute, {
    message: 'Start time must be before end time',
    path: ['endMinute'],
  });

export const updateSlotBody = z
  .object({
    allocationId: uuidSchema.optional(),
    dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
    startMinute: timeMinuteSchema.optional(),
    endMinute: timeMinuteSchema.optional(),
    room: roomSchema.optional(),
  })
  .refine(
    (d) => {
      if (d.startMinute !== undefined && d.endMinute !== undefined) {
        return d.startMinute < d.endMinute;
      }
      return true;
    },
    { message: 'Start time must be before end time', path: ['endMinute'] },
  );

export const timetableQuerySchema = z.object({
  sectionId: uuidSchema.optional(),
  facultyId: uuidSchema.optional(),
  room: z.string().trim().optional(),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  semesterId: uuidSchema.optional(),
});
