import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { BadRequestError, ForbiddenError } from '../src/common/errors';
import { SupportService } from '../src/modules/support/support.service';
import type { SupportRepository } from '../src/modules/support/support.repository';
import { FakeAudit } from './helpers/fakes';

function createMockSupportRepo() {
  const tickets = new Map<string, any>();
  const messages: any[] = [];

  const repo: Partial<SupportRepository> = {
    findTickets: async (filter: any) => {
      let list = Array.from(tickets.values());
      if (filter.raisedById) {
        list = list.filter((t) => t.raisedById === filter.raisedById);
      }
      return list;
    },
    findTicketById: async (id: string) => {
      const t = tickets.get(id);
      if (!t) return null;
      return {
        ...t,
        messages: messages.filter((m) => m.ticketId === id),
      };
    },
    createTicket: async (raisedById: string, data: any) => {
      const id = randomUUID();
      const ticket = {
        id,
        raisedById,
        subject: data.subject,
        category: data.category,
        priority: data.priority ?? 'MEDIUM',
        status: 'OPEN',
        createdAt: new Date(),
      };
      tickets.set(id, ticket);
      messages.push({
        id: randomUUID(),
        ticketId: id,
        senderId: raisedById,
        body: data.initialMessage,
      });
      return ticket;
    },
    addMessage: async (ticketId: string, senderId: string, body: string, attachmentKey?: string) => {
      const msg = {
        id: randomUUID(),
        ticketId,
        senderId,
        body,
        attachmentKey,
        createdAt: new Date(),
      };
      messages.push(msg);
      return msg;
    },
    updateTicket: async (id: string, data: any) => {
      const t = tickets.get(id);
      const updated = {
        ...t,
        ...data,
        closedAt: data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : null,
      };
      tickets.set(id, updated);
      return updated;
    },
  };

  return { repo: repo as SupportRepository, tickets, messages };
}

describe('SupportService', () => {
  it('creates ticket with initial message', async () => {
    const { repo, messages } = createMockSupportRepo();
    const audit = new FakeAudit();
    const service = new SupportService(repo, audit);

    const ticket = await service.createTicket(
      {
        subject: 'WiFi issue in hostel',
        category: 'Network',
        priority: 'HIGH',
        initialMessage: 'Cannot connect to Block B router',
      },
      'stud-user-1',
    );

    expect(ticket.subject).toBe('WiFi issue in hostel');
    expect(messages.length).toBe(1);
    expect(messages[0].body).toBe('Cannot connect to Block B router');
    expect(audit.entries.length).toBe(1);
  });

  it('prevents non-owner student from viewing other ticket', async () => {
    const { repo, tickets } = createMockSupportRepo();
    const audit = new FakeAudit();
    const service = new SupportService(repo, audit);

    const ticketId = randomUUID();
    tickets.set(ticketId, { id: ticketId, raisedById: 'stud-user-1', status: 'OPEN' });

    await expect(
      service.getTicketById(ticketId, 'stud-user-2', 'STUDENT'),
    ).rejects.toThrow(ForbiddenError);

    // Admin can view any ticket
    const adminView = await service.getTicketById(ticketId, 'admin-user', 'ADMIN');
    expect(adminView.id).toBe(ticketId);
  });

  it('allows reply on open ticket and rejects reply on closed ticket', async () => {
    const { repo, tickets, messages } = createMockSupportRepo();
    const audit = new FakeAudit();
    const service = new SupportService(repo, audit);

    const ticketId = randomUUID();
    tickets.set(ticketId, { id: ticketId, raisedById: 'stud-1', status: 'OPEN' });

    // Reply on open ticket
    await service.replyTicket(ticketId, { body: 'Any update?' }, 'stud-1', 'STUDENT');
    expect(messages.length).toBe(1);

    // Close ticket
    await service.updateTicket(ticketId, { status: 'CLOSED' }, 'admin-1', 'ADMIN');

    // Attempt reply on closed ticket -> BadRequestError
    await expect(
      service.replyTicket(ticketId, { body: 'More questions' }, 'stud-1', 'STUDENT'),
    ).rejects.toThrow(BadRequestError);
  });
});
