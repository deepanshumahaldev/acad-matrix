export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TicketMessageItem {
  id: string;
  ticketId: string;
  senderId: string;
  body: string;
  attachmentKey?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface SupportTicketItem {
  id: string;
  number: number;
  raisedById: string;
  assignedToId?: string | null;
  subject: string;
  category?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  raisedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  messages?: TicketMessageItem[];
  _count?: { messages: number };
}

export interface CreateTicketPayload {
  subject: string;
  category?: string;
  priority?: TicketPriority;
  initialMessage: string;
  attachmentKey?: string;
}

export interface ReplyTicketPayload {
  body: string;
  attachmentKey?: string;
}

export interface UpdateTicketPayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
}
