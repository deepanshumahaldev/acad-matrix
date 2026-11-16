import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../common/utils/response';
import type { SupportService } from './support.service';
import type { TicketPriority, TicketStatus } from './support.types';

export class SupportController {
  constructor(private readonly service: SupportService) {}

  listTickets = async (req: Request, res: Response) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as TicketStatus) : undefined;
    const priority = typeof req.query.priority === 'string' ? (req.query.priority as TicketPriority) : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;

    const data = await this.service.listTickets(
      { status, priority, category },
      req.user!.id,
      req.user!.role,
    );
    return sendSuccess(res, data);
  };

  getTicket = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getTicketById(id, req.user!.id, req.user!.role);
    return sendSuccess(res, data);
  };

  createTicket = async (req: Request, res: Response) => {
    const data = await this.service.createTicket(req.body, req.user!.id, req.ip);
    return sendCreated(res, data);
  };

  replyTicket = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.replyTicket(
      id,
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendCreated(res, data);
  };

  updateTicket = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateTicket(
      id,
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendSuccess(res, data);
  };
}
