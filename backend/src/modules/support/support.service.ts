import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { SupportRepository } from './support.repository';
import type {
  CreateTicketInput,
  ReplyTicketInput,
  TicketFilterQuery,
  UpdateTicketInput,
} from './support.types';

export class SupportService {
  constructor(
    private readonly repo: SupportRepository,
    private readonly audit: AuditLogger,
  ) {}

  async createTicket(input: CreateTicketInput, userId: string, ip?: string) {
    const ticket = await this.repo.createTicket(userId, input);

    await this.audit.log({
      actorId: userId,
      action: 'TICKET_CREATED',
      entity: 'SupportTicket',
      entityId: ticket.id,
      metadata: { subject: input.subject, priority: input.priority },
      ipAddress: ip,
    });

    return ticket;
  }

  async listTickets(filter: TicketFilterQuery, userId: string, role: string) {
    if (role !== 'ADMIN') {
      return this.repo.findTickets({ ...filter, raisedById: userId });
    }
    return this.repo.findTickets(filter);
  }

  async getTicketById(id: string, userId: string, role: string) {
    const ticket = await this.repo.findTicketById(id);
    if (!ticket) throw new NotFoundError('Support ticket not found');

    if (role !== 'ADMIN' && ticket.raisedById !== userId) {
      throw new ForbiddenError('You can only view your own tickets');
    }

    return ticket;
  }

  async replyTicket(ticketId: string, input: ReplyTicketInput, userId: string, role: string, ip?: string) {
    const ticket = await this.getTicketById(ticketId, userId, role);

    if (ticket.status === 'CLOSED') {
      throw new BadRequestError('Cannot reply to a closed ticket. Please open a new ticket.');
    }

    const message = await this.repo.addMessage(ticketId, userId, input.body, input.attachmentKey);

    await this.audit.log({
      actorId: userId,
      action: 'TICKET_REPLIED',
      entity: 'SupportTicket',
      entityId: ticketId,
      metadata: { messageId: message.id },
      ipAddress: ip,
    });

    return message;
  }

  async updateTicket(id: string, input: UpdateTicketInput, userId: string, _role: string, ip?: string) {
    await this.repo.findTicketById(id); // Throws if invalid id
    const updated = await this.repo.updateTicket(id, input);

    await this.audit.log({
      actorId: userId,
      action: 'TICKET_UPDATED',
      entity: 'SupportTicket',
      entityId: id,
      metadata: { status: input.status, priority: input.priority, assignedToId: input.assignedToId },
      ipAddress: ip,
    });

    return updated;
  }
}
