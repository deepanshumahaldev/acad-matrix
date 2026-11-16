import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const idParam = z.object({ id: uuidSchema });

export const createAssignmentBody = z.object({
  allocationId: uuidSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().optional().nullable().transform((v) => v || undefined),
  dueAt: z.string().datetime({ message: 'Must be a valid ISO datetime' }),
  maxMarks: z.coerce.number().int().min(1).max(1000).default(100),
  attachmentKey: z.string().trim().optional().nullable().transform((v) => v || undefined),
  attachmentName: z.string().trim().optional().nullable().transform((v) => v || undefined),
});

export const updateAssignmentBody = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().optional().nullable().transform((v) => v || undefined),
  dueAt: z.string().datetime().optional(),
  maxMarks: z.coerce.number().int().min(1).max(1000).optional(),
  attachmentKey: z.string().trim().optional().nullable().transform((v) => v || undefined),
  attachmentName: z.string().trim().optional().nullable().transform((v) => v || undefined),
});

export const submitAssignmentBody = z.object({
  fileKey: z.string().trim().min(1),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  sizeBytes: z.coerce.number().int().min(1).max(50_000_000), // Max 50MB
  note: z.string().trim().max(1000).optional().nullable().transform((v) => v || undefined),
});

export const gradeSubmissionBody = z.object({
  marks: z.coerce.number().int().min(0),
  feedback: z.string().trim().max(2000).optional().nullable().transform((v) => v || undefined),
});

export const assignmentQuerySchema = z.object({
  allocationId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
});
