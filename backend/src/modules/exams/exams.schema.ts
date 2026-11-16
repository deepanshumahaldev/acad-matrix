import { z } from 'zod';

const uuidSchema = z.string().uuid();
const examTypeEnum = z.enum(['QUIZ', 'INTERNAL', 'MID_TERM', 'END_TERM', 'PRACTICAL']);

export const idParam = z.object({ id: uuidSchema });

export const createExamBody = z
  .object({
    semesterId: uuidSchema,
    subjectId: uuidSchema,
    sectionId: uuidSchema.optional().nullable().transform((v) => v || undefined),
    title: z.string().trim().min(1).max(200),
    type: examTypeEnum,
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    startMinute: z.coerce.number().int().min(0).max(1439),
    endMinute: z.coerce.number().int().min(1).max(1440),
    room: z.string().trim().max(100).optional().nullable().transform((v) => v || undefined),
    maxMarks: z.coerce.number().int().min(1).max(1000).default(100),
  })
  .refine((d) => d.endMinute > d.startMinute, {
    message: 'endMinute must be greater than startMinute',
    path: ['endMinute'],
  });

export const updateExamBody = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    type: examTypeEnum.optional(),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startMinute: z.coerce.number().int().min(0).max(1439).optional(),
    endMinute: z.coerce.number().int().min(1).max(1440).optional(),
    room: z.string().trim().max(100).optional().nullable().transform((v) => v || undefined),
    maxMarks: z.coerce.number().int().min(1).max(1000).optional(),
  })
  .refine((d) => {
    if (d.startMinute !== undefined && d.endMinute !== undefined) {
      return d.endMinute > d.startMinute;
    }
    return true;
  }, {
    message: 'endMinute must be greater than startMinute',
    path: ['endMinute'],
  });

export const recordExamResultsBody = z.object({
  results: z.array(
    z.object({
      studentId: uuidSchema,
      marksObtained: z.coerce.number().min(0),
      grade: z.string().trim().max(10).optional().nullable().transform((v) => v || undefined),
      remarks: z.string().trim().max(500).optional().nullable().transform((v) => v || undefined),
    }),
  ).min(1, 'At least one student result is required'),
});

export const examQuerySchema = z.object({
  semesterId: uuidSchema.optional(),
  subjectId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
  type: examTypeEnum.optional(),
  upcoming: z.enum(['true', 'false']).optional(),
});
