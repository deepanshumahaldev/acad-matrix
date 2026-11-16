import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { SupportController } from './support.controller';
import { SupportRepository } from './support.repository';
import {
  createTicketBody,
  idParam,
  replyTicketBody,
  updateTicketBody,
} from './support.schema';
import { SupportService } from './support.service';

export function createDefaultSupportService(): SupportService {
  return new SupportService(new SupportRepository(getPrisma), new PrismaAuditLogger(getPrisma));
}

export function createSupportRoutes(service: SupportService = createDefaultSupportService()): Router {
  const c = new SupportController(service);
  const router = Router();

  router.use(authenticate());

  router.get('/', asyncHandler(c.listTickets));
  router.get('/:id', validate({ params: idParam }), asyncHandler(c.getTicket));
  router.post('/', validate({ body: createTicketBody }), asyncHandler(c.createTicket));
  router.post('/:id/reply', validate({ params: idParam, body: replyTicketBody }), asyncHandler(c.replyTicket));
  router.patch(
    '/:id',
    requireRole('ADMIN'),
    validate({ params: idParam, body: updateTicketBody }),
    asyncHandler(c.updateTicket),
  );

  return router;
}
