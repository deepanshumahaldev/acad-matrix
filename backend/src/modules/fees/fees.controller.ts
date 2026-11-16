import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../common/utils/response';
import type { FeesService } from './fees.service';
import type { FeeStatus } from './fees.types';

export class FeesController {
  constructor(private readonly service: FeesService) {}

  listStructures = async (req: Request, res: Response) => {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const data = await this.service.listFeeStructures(courseId);
    return sendSuccess(res, data);
  };

  createStructure = async (req: Request, res: Response) => {
    const data = await this.service.createFeeStructure(req.body, req.user!.id, req.ip);
    return sendCreated(res, data);
  };

  assignStructure = async (req: Request, res: Response) => {
    const data = await this.service.assignFeeStructure(req.body, req.user!.id, req.ip);
    return sendSuccess(res, data);
  };

  listStudentFees = async (req: Request, res: Response) => {
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
    const semesterId = typeof req.query.semesterId === 'string' ? req.query.semesterId : undefined;
    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
    const status = typeof req.query.status === 'string' ? (req.query.status as FeeStatus) : undefined;

    const data = await this.service.listStudentFees(
      { courseId, semesterId, studentId, status },
      req.user!.id,
      req.user!.role,
    );
    return sendSuccess(res, data);
  };

  getStudentFee = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getStudentFeeById(id, req.user!.id, req.user!.role);
    return sendSuccess(res, data);
  };

  recordPayment = async (req: Request, res: Response) => {
    const data = await this.service.recordPayment(req.body, req.user!.id, req.ip);
    return sendCreated(res, data);
  };

  getMySummary = async (req: Request, res: Response) => {
    const data = await this.service.getStudentSummary(req.user!.id);
    return sendSuccess(res, data);
  };
}
