import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AcademicsController } from './academics.controller';
import { AcademicsRepository } from './academics.repository';
import {
  allocationQuerySchema,
  createAllocationBody,
  createCourseBody,
  createDepartmentBody,
  createSectionBody,
  createSemesterBody,
  createSubjectBody,
  idParam,
  updateCourseBody,
  updateDepartmentBody,
  updateSectionBody,
  updateSemesterBody,
  updateSubjectBody,
} from './academics.schema';
import { AcademicsService } from './academics.service';

export function createDefaultAcademicsService(): AcademicsService {
  return new AcademicsService(new AcademicsRepository(getPrisma), new PrismaAuditLogger(getPrisma));
}

export function createAcademicsRoutes(service: AcademicsService = createDefaultAcademicsService()): Router {
  const c = new AcademicsController(service);
  const router = Router();

  // All academics routes require authentication
  router.use(authenticate());

  // ── Departments ──
  router.get('/departments', asyncHandler(c.listDepartments));
  router.get('/departments/:id', validate({ params: idParam }), asyncHandler(c.getDepartment));
  router.post('/departments', requireRole('ADMIN'), validate({ body: createDepartmentBody }), asyncHandler(c.createDepartment));
  router.patch('/departments/:id', requireRole('ADMIN'), validate({ params: idParam, body: updateDepartmentBody }), asyncHandler(c.updateDepartment));
  router.delete('/departments/:id', requireRole('ADMIN'), validate({ params: idParam }), asyncHandler(c.deleteDepartment));

  // ── Courses ──
  router.get('/courses', asyncHandler(c.listCourses));
  router.get('/courses/:id', validate({ params: idParam }), asyncHandler(c.getCourse));
  router.post('/courses', requireRole('ADMIN'), validate({ body: createCourseBody }), asyncHandler(c.createCourse));
  router.patch('/courses/:id', requireRole('ADMIN'), validate({ params: idParam, body: updateCourseBody }), asyncHandler(c.updateCourse));
  router.delete('/courses/:id', requireRole('ADMIN'), validate({ params: idParam }), asyncHandler(c.deleteCourse));

  // ── Semesters ──
  router.get('/semesters', asyncHandler(c.listSemesters));
  router.get('/semesters/:id', validate({ params: idParam }), asyncHandler(c.getSemester));
  router.post('/semesters', requireRole('ADMIN'), validate({ body: createSemesterBody }), asyncHandler(c.createSemester));
  router.patch('/semesters/:id', requireRole('ADMIN'), validate({ params: idParam, body: updateSemesterBody }), asyncHandler(c.updateSemester));

  // ── Sections ──
  router.get('/sections', asyncHandler(c.listSections));
  router.get('/sections/:id', validate({ params: idParam }), asyncHandler(c.getSection));
  router.post('/sections', requireRole('ADMIN'), validate({ body: createSectionBody }), asyncHandler(c.createSection));
  router.patch('/sections/:id', requireRole('ADMIN'), validate({ params: idParam, body: updateSectionBody }), asyncHandler(c.updateSection));
  router.delete('/sections/:id', requireRole('ADMIN'), validate({ params: idParam }), asyncHandler(c.deleteSection));

  // ── Subjects ──
  router.get('/subjects', asyncHandler(c.listSubjects));
  router.get('/subjects/:id', validate({ params: idParam }), asyncHandler(c.getSubject));
  router.post('/subjects', requireRole('ADMIN'), validate({ body: createSubjectBody }), asyncHandler(c.createSubject));
  router.patch('/subjects/:id', requireRole('ADMIN'), validate({ params: idParam, body: updateSubjectBody }), asyncHandler(c.updateSubject));
  router.delete('/subjects/:id', requireRole('ADMIN'), validate({ params: idParam }), asyncHandler(c.deleteSubject));

  // ── Allocations ──
  router.get('/allocations', validate({ query: allocationQuerySchema }), asyncHandler(c.listAllocations));
  router.post('/allocations', requireRole('ADMIN'), validate({ body: createAllocationBody }), asyncHandler(c.createAllocation));
  router.delete('/allocations/:id', requireRole('ADMIN'), validate({ params: idParam }), asyncHandler(c.deleteAllocation));

  return router;
}
