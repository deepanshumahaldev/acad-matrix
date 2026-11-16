import { z } from 'zod';

const uuidSchema = z.string().uuid();
const statusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const idParam = z.object({ id: uuidSchema });

export const createTicketBody = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.string().trim().max(100).optional().nullable().transform((v) => v || undefined),
  priority: priorityEnum.default('MEDIUM'),
  initialMessage: z.string().trim().min(1).max(5000),
  attachmentKey: z.string().trim().optional().nullable().transform((v) => v || undefined),
});

export const replyTicketBody = z.object({
  body: z.string().trim().min(1).max(5000),
  attachmentKey: z.string().trim().optional().nullable().transform((v) => v || undefined),
});

export const updateTicketBody = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assignedToId: uuidSchema.optional().nullable().transform((v) => v || undefined),
});

export const ticketQuerySchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  category: z.string().optional(),
});
