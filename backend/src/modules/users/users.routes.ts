import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { createEmailService } from '../../common/services/email';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import {
  createFacultyBody,
  createStudentBody,
  csvImportBody,
  facultyQuerySchema,
  idParam,
  studentQuerySchema,
  updateFacultyBody,
  updateStatusBody,
  updateStudentBody,
} from './users.schema';
import { UsersService } from './users.service';

export function createDefaultUsersService(): UsersService {
  return new UsersService(new UsersRepository(getPrisma), createEmailService(), new PrismaAuditLogger(getPrisma));
}

export function createUsersRoutes(service: UsersService = createDefaultUsersService()): Router {
  const c = new UsersController(service);
  const router = Router();

  // Enforce authentication & ADMIN role for all user management actions
  router.use(authenticate(), requireRole('ADMIN'));

  // ── Faculty ──
  router.get('/faculty', validate({ query: facultyQuerySchema }), asyncHandler(c.listFaculty));
  router.post('/faculty', validate({ body: createFacultyBody }), asyncHandler(c.createFaculty));
  router.post('/faculty/import-csv', validate({ body: csvImportBody }), asyncHandler(c.importFacultyCsv));
  router.get('/faculty/:id', validate({ params: idParam }), asyncHandler(c.getFaculty));
  router.patch(
    '/faculty/:id',
    validate({ params: idParam, body: updateFacultyBody }),
    asyncHandler(c.updateFaculty),
  );
  router.patch(
    '/faculty/:id/status',
    validate({ params: idParam, body: updateStatusBody }),
    asyncHandler(c.setFacultyStatus),
  );

  // ── Students ──
  router.get('/students', validate({ query: studentQuerySchema }), asyncHandler(c.listStudents));
  router.post('/students', validate({ body: createStudentBody }), asyncHandler(c.createStudent));
  router.post('/students/import-csv', validate({ body: csvImportBody }), asyncHandler(c.importStudentsCsv));
  router.get('/students/:id', validate({ params: idParam }), asyncHandler(c.getStudent));
  router.patch(
    '/students/:id',
    validate({ params: idParam, body: updateStudentBody }),
    asyncHandler(c.updateStudent),
  );
  router.patch(
    '/students/:id/status',
    validate({ params: idParam, body: updateStatusBody }),
    asyncHandler(c.setStudentStatus),
  );

  // ── Account Unlock ──
  router.post('/:id/unlock', validate({ params: idParam }), asyncHandler(c.unlockUser));

  return router;
}
