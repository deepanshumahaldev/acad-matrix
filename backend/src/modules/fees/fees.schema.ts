import { z } from 'zod';

const uuidSchema = z.string().uuid();
const paymentMethodEnum = z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']);
const feeStatusEnum = z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']);

export const idParam = z.object({ id: uuidSchema });

export const feeComponentSchema = z.object({
  label: z.string().trim().min(1).max(100),
  amount: z.coerce.number().min(0),
});

export const createFeeStructureBody = z.object({
  courseId: uuidSchema,
  semesterId: uuidSchema.optional().nullable().transform((v) => v || undefined),
  name: z.string().trim().min(1).max(150),
  academicYear: z.string().trim().min(1).max(20),
  totalAmount: z.coerce.number().positive(),
  components: z.array(feeComponentSchema).min(1, 'At least one fee component is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export const assignFeeStructureBody = z.object({
  feeStructureId: uuidSchema,
  studentIds: z.array(uuidSchema).optional(),
  discount: z.coerce.number().min(0).default(0),
});

export const recordPaymentBody = z.object({
  studentFeeId: uuidSchema,
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  method: paymentMethodEnum,
  reference: z.string().trim().max(100).optional().nullable().transform((v) => v || undefined),
  note: z.string().trim().max(500).optional().nullable().transform((v) => v || undefined),
});

export const feeFilterQuerySchema = z.object({
  courseId: uuidSchema.optional(),
  semesterId: uuidSchema.optional(),
  status: feeStatusEnum.optional(),
  studentId: uuidSchema.optional(),
});
