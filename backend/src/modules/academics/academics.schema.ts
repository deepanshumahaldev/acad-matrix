import { SubjectType } from '@prisma/client';
import { z } from 'zod';

const codeSchema = z.string().trim().min(1).max(50);
const nameSchema = z.string().trim().min(1).max(150);
const uuidSchema = z.string().uuid();
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const idParam = z.object({ id: uuidSchema });

// ── Department ──
export const createDepartmentBody = z.object({
  name: nameSchema,
  code: codeSchema,
});

export const updateDepartmentBody = z.object({
  name: nameSchema.optional(),
  code: codeSchema.optional(),
});

// ── Course ──
export const createCourseBody = z.object({
  departmentId: uuidSchema,
  name: nameSchema,
  code: codeSchema,
  durationSemesters: z.coerce.number().int().min(1).max(16).default(8),
});

export const updateCourseBody = z.object({
  departmentId: uuidSchema.optional(),
  name: nameSchema.optional(),
  code: codeSchema.optional(),
  durationSemesters: z.coerce.number().int().min(1).max(16).optional(),
});

// ── Semester ──
export const createSemesterBody = z.object({
  courseId: uuidSchema,
  number: z.coerce.number().int().min(1).max(16),
  academicYear: z.string().trim().min(4).max(20),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  isCurrent: z.boolean().optional().default(false),
});

export const updateSemesterBody = z.object({
  number: z.coerce.number().int().min(1).max(16).optional(),
  academicYear: z.string().trim().min(4).max(20).optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  isCurrent: z.boolean().optional(),
});

// ── Section ──
export const createSectionBody = z.object({
  semesterId: uuidSchema,
  name: z.string().trim().min(1).max(20),
});

export const updateSectionBody = z.object({
  name: z.string().trim().min(1).max(20),
});

// ── Subject ──
export const createSubjectBody = z.object({
  semesterId: uuidSchema,
  code: codeSchema,
  name: nameSchema,
  credits: z.coerce.number().int().min(1).max(10).default(3),
  type: z.nativeEnum(SubjectType).default(SubjectType.THEORY),
});

export const updateSubjectBody = z.object({
  code: codeSchema.optional(),
  name: nameSchema.optional(),
  credits: z.coerce.number().int().min(1).max(10).optional(),
  type: z.nativeEnum(SubjectType).optional(),
});

// ── Allocation ──
export const createAllocationBody = z.object({
  subjectId: uuidSchema,
  sectionId: uuidSchema,
  facultyId: uuidSchema,
});

export const allocationQuerySchema = z.object({
  facultyId: uuidSchema.optional(),
  subjectId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
  semesterId: uuidSchema.optional(),
});
