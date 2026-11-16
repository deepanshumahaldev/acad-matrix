import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../common/utils/response';
import type { AttendanceService } from './attendance.service';

export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  listSessions = async (req: Request, res: Response) => {
    const allocationId = typeof req.query.allocationId === 'string' ? req.query.allocationId : undefined;
    const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const facultyId = typeof req.query.facultyId === 'string' ? req.query.facultyId : undefined;

    const data = await this.service.listSessions({ allocationId, sectionId, date, facultyId });
    return sendSuccess(res, data);
  };

  getSession = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getSessionById(id);
    return sendSuccess(res, data);
  };

  getRoster = async (req: Request, res: Response) => {
    const allocationId = req.params.id as string;
    const data = await this.service.getRosterForAllocation(allocationId);
    return sendSuccess(res, data);
  };

  markAttendance = async (req: Request, res: Response) => {
    const data = await this.service.markAttendance(
      req.body,
      req.user!.id,
      req.user!.role,
      req.user?.id,
      req.ip,
    );
    return sendCreated(res, data);
  };

  updateAttendance = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateAttendance(
      id,
      req.body,
      req.user!.id,
      req.user!.role,
      req.user?.id,
      req.ip,
    );
    return sendSuccess(res, data);
  };

  getMyAttendance = async (req: Request, res: Response) => {
    const data = await this.service.getMyAttendance(req.user!.id);
    return sendSuccess(res, data);
  };

  getStudentSummary = async (req: Request, res: Response) => {
    const studentId = req.params.id as string;
    const data = await this.service.getStudentAttendanceSummary(studentId);
    return sendSuccess(res, data);
  };
}
