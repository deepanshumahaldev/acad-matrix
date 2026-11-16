import { UserStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination';

const email = z.string().trim().toLowerCase().email().max(254);
const nameField = z.string().trim().min(1).max(100);
const optionalPhone = z.string().trim().max(20).optional().nullable().transform((v) => v || undefined);
const optionalDate = z.string().trim().optional().nullable().transform((v) => v || undefined);
const optionalString = z.string().trim().max(150).optional().nullable().transform((v) => v || undefined);

export const facultyQuerySchema = paginationQuerySchema.extend({
  departmentId: z.string().uuid().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const studentQuerySchema = paginationQuerySchema.extend({
  courseId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const createFacultyBody = z.object({
  email,
  firstName: nameField,
  lastName: nameField,
  phone: optionalPhone,
  employeeId: z.string().trim().min(1).max(50),
  departmentId: z.string().uuid(),
  designation: optionalString,
  joiningDate: optionalDate,
});

export const updateFacultyBody = z.object({
  firstName: nameField.optional(),
  lastName: nameField.optional(),
  phone: optionalPhone,
  departmentId: z.string().uuid().optional(),
  designation: optionalString,
  joiningDate: optionalDate,
});

export const createStudentBody = z.object({
  email,
  firstName: nameField,
  lastName: nameField,
  phone: optionalPhone,
  rollNumber: z.string().trim().min(1).max(50),
  courseId: z.string().uuid(),
  semesterId: z.string().uuid(),
  sectionId: z.string().uuid(),
  admissionYear: z.coerce.number().int().min(2000).max(2100),
  dateOfBirth: optionalDate,
  guardianName: optionalString,
  guardianPhone: optionalPhone,
});

export const updateStudentBody = z.object({
  firstName: nameField.optional(),
  lastName: nameField.optional(),
  phone: optionalPhone,
  courseId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  admissionYear: z.coerce.number().int().min(2000).max(2100).optional(),
  dateOfBirth: optionalDate,
  guardianName: optionalString,
  guardianPhone: optionalPhone,
});

export const updateStatusBody = z.object({
  status: z.nativeEnum(UserStatus),
});

export const csvImportBody = z.object({
  csvData: z.string().min(1, 'CSV data is required'),
});

export const idParam = z.object({
  id: z.string().uuid(),
});

export type CreateFacultyBody = z.infer<typeof createFacultyBody>;
export type UpdateFacultyBody = z.infer<typeof updateFacultyBody>;
export type CreateStudentBody = z.infer<typeof createStudentBody>;
export type UpdateStudentBody = z.infer<typeof updateStudentBody>;
export type UpdateStatusBody = z.infer<typeof updateStatusBody>;
export type CsvImportBody = z.infer<typeof csvImportBody>;
