import { AttendanceStatus } from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.string().uuid();
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const idParam = z.object({ id: uuidSchema });

export const studentAttendanceRecordSchema = z.object({
  studentId: uuidSchema,
  status: z.nativeEnum(AttendanceStatus),
  remark: z.string().trim().max(255).optional().nullable().transform((v) => v || undefined),
});

export const markAttendanceBody = z.object({
  allocationId: uuidSchema,
  date: dateStringSchema,
  period: z.coerce.number().int().min(1).max(12).default(1),
  topic: z.string().trim().max(255).optional().nullable().transform((v) => v || undefined),
  records: z.array(studentAttendanceRecordSchema).min(1, 'At least one student record is required'),
});

export const updateAttendanceBody = z.object({
  topic: z.string().trim().max(255).optional().nullable().transform((v) => v || undefined),
  records: z.array(studentAttendanceRecordSchema).optional(),
});

export const attendanceQuerySchema = z.object({
  allocationId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
  date: dateStringSchema.optional(),
  studentId: uuidSchema.optional(),
});
