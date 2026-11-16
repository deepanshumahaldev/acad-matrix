import type { Prisma, PrismaClient } from '@prisma/client';
import type { CreateTicketInput, TicketFilterQuery, UpdateTicketInput } from './support.types';

export class SupportRepository {
  constructor(private readonly prisma: () => PrismaClient) {}

  async findTickets(filter: TicketFilterQuery) {
    const where: Prisma.SupportTicketWhereInput = {
      status: filter.status,
      priority: filter.priority,
      category: filter.category,
      raisedById: filter.raisedById,
    };

    return this.prisma().supportTicket.findMany({
      where,
      include: {
        raisedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTicketById(id: string) {
    return this.prisma().supportTicket.findUnique({
      where: { id },
      include: {
        raisedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createTicket(raisedById: string, data: CreateTicketInput) {
    return this.prisma().$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          raisedById,
          subject: data.subject,
          category: data.category,
          priority: data.priority ?? 'MEDIUM',
          status: 'OPEN',
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: raisedById,
          body: data.initialMessage,
          attachmentKey: data.attachmentKey,
        },
      });

      return tx.supportTicket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: {
          raisedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          messages: true,
        },
      });
    });
  }

  async addMessage(ticketId: string, senderId: string, body: string, attachmentKey?: string) {
    return this.prisma().$transaction(async (tx) => {
      const message = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId,
          body,
          attachmentKey,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  async updateTicket(id: string, data: UpdateTicketInput) {
    const updateData: Prisma.SupportTicketUpdateInput = {
      priority: data.priority,
      assignedTo: data.assignedToId ? { connect: { id: data.assignedToId } } : undefined,
    };

    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        updateData.closedAt = new Date();
      } else {
        updateData.closedAt = null;
      }
    }

    return this.prisma().supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        raisedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}
