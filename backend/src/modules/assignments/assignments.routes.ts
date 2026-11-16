import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsRepository } from './assignments.repository';
import {
  createAssignmentBody,
  gradeSubmissionBody,
  idParam,
  submitAssignmentBody,
  updateAssignmentBody,
} from './assignments.schema';
import { AssignmentsService } from './assignments.service';

export function createDefaultAssignmentsService(): AssignmentsService {
  return new AssignmentsService(new AssignmentsRepository(getPrisma), new PrismaAuditLogger(getPrisma));
}

export function createAssignmentsRoutes(service: AssignmentsService = createDefaultAssignmentsService()): Router {
  const c = new AssignmentsController(service);
  const router = Router();

  router.use(authenticate());

  router.get('/', asyncHandler(c.listAssignments));
  router.get('/:id', validate({ params: idParam }), asyncHandler(c.getAssignment));

  router.post(
    '/',
    requireRole('ADMIN', 'FACULTY'),
    validate({ body: createAssignmentBody }),
    asyncHandler(c.createAssignment),
  );

  router.patch(
    '/:id',
    requireRole('ADMIN', 'FACULTY'),
    validate({ params: idParam, body: updateAssignmentBody }),
    asyncHandler(c.updateAssignment),
  );

  router.delete(
    '/:id',
    requireRole('ADMIN', 'FACULTY'),
    validate({ params: idParam }),
    asyncHandler(c.deleteAssignment),
  );

  router.post(
    '/:id/submit',
    requireRole('STUDENT'),
    validate({ params: idParam, body: submitAssignmentBody }),
    asyncHandler(c.submitAssignment),
  );

  router.post(
    '/submissions/:id/grade',
    requireRole('ADMIN', 'FACULTY'),
    validate({ params: idParam, body: gradeSubmissionBody }),
    asyncHandler(c.gradeSubmission),
  );

  return router;
}
