import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../common/utils/response';
import type { ExamsService } from './exams.service';
import type { ExamType } from './exams.types';

export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  listExams = async (req: Request, res: Response) => {
    const semesterId = typeof req.query.semesterId === 'string' ? req.query.semesterId : undefined;
    const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
    const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
    const type = typeof req.query.type === 'string' ? (req.query.type as ExamType) : undefined;
    const upcoming = req.query.upcoming === 'true';

    const data = await this.service.listExams(
      { semesterId, subjectId, sectionId, type, upcoming },
      req.user!.id,
      req.user!.role,
    );
    return sendSuccess(res, data);
  };

  getExam = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getExamById(id);
    return sendSuccess(res, data);
  };

  createExam = async (req: Request, res: Response) => {
    const data = await this.service.createExam(
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendCreated(res, data);
  };

  updateExam = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateExam(
      id,
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendSuccess(res, data);
  };

  deleteExam = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.deleteExam(
      id,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendSuccess(res, data);
  };

  recordResults = async (req: Request, res: Response) => {
    const examId = req.params.id as string;
    const data = await this.service.recordResults(
      examId,
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendSuccess(res, data);
  };

  getMyResults = async (req: Request, res: Response) => {
    const data = await this.service.getMyResults(req.user!.id);
    return sendSuccess(res, data);
  };
}
