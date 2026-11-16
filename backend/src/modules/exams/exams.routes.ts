import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ExamsController } from './exams.controller';
import { ExamsRepository } from './exams.repository';
import {
  createExamBody,
  idParam,
  recordExamResultsBody,
  updateExamBody,
} from './exams.schema';
import { ExamsService } from './exams.service';

export function createDefaultExamsService(): ExamsService {
  return new ExamsService(new ExamsRepository(getPrisma), new PrismaAuditLogger(getPrisma));
}

export function createExamsRoutes(service: ExamsService = createDefaultExamsService()): Router {
  const c = new ExamsController(service);
  const router = Router();

  router.use(authenticate());

  router.get('/', asyncHandler(c.listExams));
  router.get('/my-results', requireRole('STUDENT'), asyncHandler(c.getMyResults));
  router.get('/:id', validate({ params: idParam }), asyncHandler(c.getExam));

  router.post(
    '/',
    requireRole('ADMIN', 'FACULTY'),
    validate({ body: createExamBody }),
    asyncHandler(c.createExam),
  );

  router.patch(
    '/:id',
    requireRole('ADMIN', 'FACULTY'),
    validate({ params: idParam, body: updateExamBody }),
    asyncHandler(c.updateExam),
  );

  router.delete(
    '/:id',
    requireRole('ADMIN'),
    validate({ params: idParam }),
    asyncHandler(c.deleteExam),
  );

  router.post(
    '/:id/results',
    requireRole('ADMIN', 'FACULTY'),
    validate({ params: idParam, body: recordExamResultsBody }),
    asyncHandler(c.recordResults),
  );

  return router;
}
