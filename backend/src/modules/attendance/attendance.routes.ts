import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AttendanceController } from './attendance.controller';
import { AttendanceRepository } from './attendance.repository';
import { idParam, markAttendanceBody, updateAttendanceBody } from './attendance.schema';
import { AttendanceService } from './attendance.service';

export function createDefaultAttendanceService(): AttendanceService {
  return new AttendanceService(new AttendanceRepository(getPrisma), new PrismaAuditLogger(getPrisma));
}

export function createAttendanceRoutes(service: AttendanceService = createDefaultAttendanceService()): Router {
  const c = new AttendanceController(service);
  const router = Router();

  router.use(authenticate());

  router.get('/my', asyncHandler(c.getMyAttendance));
  router.get('/roster/:id', validate({ params: idParam }), asyncHandler(c.getRoster));
  router.get('/sessions', asyncHandler(c.listSessions));
  router.get('/sessions/:id', validate({ params: idParam }), asyncHandler(c.getSession));
  router.get('/student/:id/summary', validate({ params: idParam }), asyncHandler(c.getStudentSummary));

  router.post(
    '/mark',
    requireRole('ADMIN', 'FACULTY'),
    validate({ body: markAttendanceBody }),
    asyncHandler(c.markAttendance),
  );
  router.patch(
    '/sessions/:id',
    requireRole('ADMIN', 'FACULTY'),
    validate({ params: idParam, body: updateAttendanceBody }),
    asyncHandler(c.updateAttendance),
  );

  return router;
}
