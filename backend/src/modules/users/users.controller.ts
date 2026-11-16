import type { Request, Response } from 'express';
import { buildPageMeta } from '../../common/utils/pagination';
import { sendCreated, sendSuccess } from '../../common/utils/response';
import type { UsersService } from './users.service';
import type { FacultyFilterQuery, StudentFilterQuery } from './users.types';

export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ───────────────────────── Faculty ─────────────────────────

  listFaculty = async (req: Request, res: Response) => {
    const query = req.query as unknown as FacultyFilterQuery;
    const { data, total } = await this.service.listFaculty(query);
    const meta = buildPageMeta(total, query);
    return sendSuccess(res, data, 200, meta);
  };

  getFaculty = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getFacultyById(id);
    return sendSuccess(res, data);
  };

  createFaculty = async (req: Request, res: Response) => {
    const data = await this.service.createFaculty(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateFaculty = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateFaculty(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  setFacultyStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.setFacultyStatus(id, req.body.status, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  importFacultyCsv = async (req: Request, res: Response) => {
    const data = await this.service.importFacultyCsv(req.body.csvData, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  // ───────────────────────── Students ─────────────────────────

  listStudents = async (req: Request, res: Response) => {
    const query = req.query as unknown as StudentFilterQuery;
    const { data, total } = await this.service.listStudents(query);
    const meta = buildPageMeta(total, query);
    return sendSuccess(res, data, 200, meta);
  };

  getStudent = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getStudentById(id);
    return sendSuccess(res, data);
  };

  createStudent = async (req: Request, res: Response) => {
    const data = await this.service.createStudent(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateStudent = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateStudent(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  setStudentStatus = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.setStudentStatus(id, req.body.status, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  importStudentsCsv = async (req: Request, res: Response) => {
    const data = await this.service.importStudentsCsv(req.body.csvData, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  // ───────────────────────── Unlock ─────────────────────────

  unlockUser = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.unlockUser(id, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };
}
