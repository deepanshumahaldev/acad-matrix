import type { Request, Response } from 'express';
import { sendCreated, sendNoContent, sendSuccess } from '../../common/utils/response';
import type { TimetableService } from './timetable.service';
import type { TimetableQuery } from './timetable.types';

export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  listSlots = async (req: Request, res: Response) => {
    const query = req.query as unknown as TimetableQuery;
    const data = await this.service.listSlots(query);
    return sendSuccess(res, data);
  };

  getMyTimetable = async (req: Request, res: Response) => {
    const data = await this.service.getMyTimetable(req.user!.id, req.user!.role);
    return sendSuccess(res, data);
  };

  getSlot = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getSlotById(id);
    return sendSuccess(res, data);
  };

  createSlot = async (req: Request, res: Response) => {
    const data = await this.service.createSlot(req.body, req.user?.id, req.ip);
    return sendCreated(res, data);
  };

  updateSlot = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateSlot(id, req.body, req.user?.id, req.ip);
    return sendSuccess(res, data);
  };

  deleteSlot = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.service.deleteSlot(id, req.user?.id, req.ip);
    return sendNoContent(res);
  };
}
