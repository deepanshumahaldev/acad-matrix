import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { TimetableController } from './timetable.controller';
import { TimetableRepository } from './timetable.repository';
import { createSlotBody, idParam, timetableQuerySchema, updateSlotBody } from './timetable.schema';
import { TimetableService } from './timetable.service';

export function createDefaultTimetableService(): TimetableService {
  return new TimetableService(new TimetableRepository(getPrisma), new PrismaAuditLogger(getPrisma));
}

export function createTimetableRoutes(service: TimetableService = createDefaultTimetableService()): Router {
  const c = new TimetableController(service);
  const router = Router();

  router.use(authenticate());

  router.get('/my', asyncHandler(c.getMyTimetable));
  router.get('/', validate({ query: timetableQuerySchema }), asyncHandler(c.listSlots));
  router.get('/:id', validate({ params: idParam }), asyncHandler(c.getSlot));

  router.post('/', requireRole('ADMIN'), validate({ body: createSlotBody }), asyncHandler(c.createSlot));
  router.patch('/:id', requireRole('ADMIN'), validate({ params: idParam, body: updateSlotBody }), asyncHandler(c.updateSlot));
  router.delete('/:id', requireRole('ADMIN'), validate({ params: idParam }), asyncHandler(c.deleteSlot));

  return router;
}
