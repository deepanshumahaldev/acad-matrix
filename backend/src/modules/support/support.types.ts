export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CreateTicketInput {
  subject: string;
  category?: string;
  priority?: TicketPriority;
  initialMessage: string;
  attachmentKey?: string;
}

export interface ReplyTicketInput {
  body: string;
  attachmentKey?: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
}

export interface TicketFilterQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  raisedById?: string;
}
