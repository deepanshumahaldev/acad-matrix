import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { FeesController } from './fees.controller';
import { FeesRepository } from './fees.repository';
import {
  assignFeeStructureBody,
  createFeeStructureBody,
  idParam,
  recordPaymentBody,
} from './fees.schema';
import { FeesService } from './fees.service';

export function createDefaultFeesService(): FeesService {
  return new FeesService(new FeesRepository(getPrisma), new PrismaAuditLogger(getPrisma));
}

export function createFeesRoutes(service: FeesService = createDefaultFeesService()): Router {
  const c = new FeesController(service);
  const router = Router();

  router.use(authenticate());

  // Fee structures (Admin manages, faculty/student can view)
  router.get('/structures', asyncHandler(c.listStructures));
  router.post(
    '/structures',
    requireRole('ADMIN'),
    validate({ body: createFeeStructureBody }),
    asyncHandler(c.createStructure),
  );
  router.post(
    '/structures/assign',
    requireRole('ADMIN'),
    validate({ body: assignFeeStructureBody }),
    asyncHandler(c.assignStructure),
  );

  // Student fees
  router.get('/student-fees', asyncHandler(c.listStudentFees));
  router.get('/my-summary', requireRole('STUDENT'), asyncHandler(c.getMySummary));
  router.get('/student-fees/:id', validate({ params: idParam }), asyncHandler(c.getStudentFee));

  // Payments (Admin records payments)
  router.post(
    '/payments',
    requireRole('ADMIN'),
    validate({ body: recordPaymentBody }),
    asyncHandler(c.recordPayment),
  );

  return router;
}
