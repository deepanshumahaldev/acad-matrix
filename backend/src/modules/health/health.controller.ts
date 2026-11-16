import type { Request, Response } from 'express';
import { sendSuccess } from '../../common/utils/response';
import type { HealthService } from './health.service';

export class HealthController {
  constructor(private readonly service: HealthService) {}

  live = (_req: Request, res: Response) => sendSuccess(res, this.service.liveness());

  ready = async (_req: Request, res: Response) => {
    const { ready, body } = await this.service.readiness();
    if (ready) return sendSuccess(res, body);
    return res.status(503).json({ success: false, error: { code: 'NOT_READY', message: 'Dependency down' }, data: body });
  };
}
