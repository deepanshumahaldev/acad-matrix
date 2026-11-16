import type { Request, Response } from 'express';
import { sendCreated, sendNoContent, sendSuccess } from '../../common/utils/response';
import type { AcademicsService } from './academics.service';
import type { AllocationFilterQuery } from './academics.types';

export class AcademicsController {
  constructor(private readonly service: AcademicsService) {}

  // ── Departments ──
  listDepartments = async (_req: Request, res: Response) => {
    const data = await this.service.listDepartments();
    return sendSuccess(res, data);
  };

  getDepartment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getDepartmentById(id);
    return sendSuccess(res, data);
  };

  createDepartment = async (req: Request, res: Response) => {
    const data = await this.service.createDepartment(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateDepartment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateDepartment(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  deleteDepartment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.service.deleteDepartment(id, req.user?.id, req.ip);
    return sendNoContent(res);
  };

  // ── Courses ──
  listCourses = async (req: Request, res: Response) => {
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined;
    const data = await this.service.listCourses(departmentId);
    return sendSuccess(res, data);
  };

  getCourse = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getCourseById(id);
    return sendSuccess(res, data);
  };

  createCourse = async (req: Request, res: Response) => {
    const data = await this.service.createCourse(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateCourse = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateCourse(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  deleteCourse = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.service.deleteCourse(id, req.user?.id, req.ip);
    return sendNoContent(res);
  };

  // ── Semesters ──
  listSemesters = async (req: Request, res: Response) => {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const academicYear = typeof req.query.academicYear === 'string' ? req.query.academicYear : undefined;
    const data = await this.service.listSemesters(courseId, academicYear);
    return sendSuccess(res, data);
  };

  getSemester = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getSemesterById(id);
    return sendSuccess(res, data);
  };

  createSemester = async (req: Request, res: Response) => {
    const data = await this.service.createSemester(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateSemester = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateSemester(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  // ── Sections ──
  listSections = async (req: Request, res: Response) => {
    const semesterId = typeof req.query.semesterId === 'string' ? req.query.semesterId : undefined;
    const data = await this.service.listSections(semesterId);
    return sendSuccess(res, data);
  };

  getSection = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getSectionById(id);
    return sendSuccess(res, data);
  };

  createSection = async (req: Request, res: Response) => {
    const data = await this.service.createSection(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateSection = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateSection(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  deleteSection = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.service.deleteSection(id, req.user?.id, req.ip);
    return sendNoContent(res);
  };

  // ── Subjects ──
  listSubjects = async (req: Request, res: Response) => {
    const semesterId = typeof req.query.semesterId === 'string' ? req.query.semesterId : undefined;
    const data = await this.service.listSubjects(semesterId);
    return sendSuccess(res, data);
  };

  getSubject = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getSubjectById(id);
    return sendSuccess(res, data);
  };

  createSubject = async (req: Request, res: Response) => {
    const data = await this.service.createSubject(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateSubject = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateSubject(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  deleteSubject = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.service.deleteSubject(id, req.user?.id, req.ip);
    return sendNoContent(res);
  };

  // ── Allocations ──
  listAllocations = async (req: Request, res: Response) => {
    const filter = req.query as unknown as AllocationFilterQuery;
    const data = await this.service.listAllocations(filter);
    return sendSuccess(res, data);
  };

  createAllocation = async (req: Request, res: Response) => {
    const data = await this.service.createAllocation(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  deleteAllocation = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.service.deleteAllocation(id, req.user?.id, req.ip);
    return sendNoContent(res);
  };
}
