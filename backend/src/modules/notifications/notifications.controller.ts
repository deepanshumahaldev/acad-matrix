import type { Request, Response } from 'express';
import { buildPageMeta } from '../../common/utils/pagination';
import { sendCreated, sendSuccess } from '../../common/utils/response';
import type { NotificationsService } from './notifications.service';
import type { NotificationFilterQuery } from './notifications.types';

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  sendNotification = async (req: Request, res: Response) => {
    const data = await this.service.sendNotification(
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendCreated(res, data);
  };

  getInbox = async (req: Request, res: Response) => {
    const query = req.query as unknown as NotificationFilterQuery;
    const { items, total } = await this.service.getInbox(req.user!.id, query);
    const meta = buildPageMeta(total, query);
    return sendSuccess(res, items, 200, meta);
  };

  getUnreadCount = async (req: Request, res: Response) => {
    const data = await this.service.getUnreadCount(req.user!.id);
    return sendSuccess(res, data);
  };

  markAsRead = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.markAsRead(id, req.user!.id);
    return sendSuccess(res, data);
  };

  markAllAsRead = async (req: Request, res: Response) => {
    const data = await this.service.markAllAsRead(req.user!.id);
    return sendSuccess(res, data);
  };
}
