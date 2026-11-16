import type { Request, Response } from 'express';
import { sendSuccess } from '../../common/utils/response';
import type { DashboardService } from './dashboard.service';

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  getDashboard = async (req: Request, res: Response) => {
    const data = await this.service.getDashboard(req.user!.id, req.user!.role);
    return sendSuccess(res, data);
  };
}
