import { api } from '@/lib/apiClient';
import type {
  CreateTicketPayload,
  ReplyTicketPayload,
  SupportTicketItem,
  TicketMessageItem,
  TicketPriority,
  TicketStatus,
  UpdateTicketPayload,
} from '../types';

const base = '/api/v1/support';

export const listTickets = async (params?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
}) => {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.priority) q.set('priority', params.priority);
  if (params?.category) q.set('category', params.category);
  const s = q.toString();
  return (await api.get<SupportTicketItem[]>(`${base}${s ? `?${s}` : ''}`)).data;
};

export const getTicketById = async (id: string) =>
  (await api.get<SupportTicketItem>(`${base}/${id}`)).data;

export const createTicket = async (payload: CreateTicketPayload) =>
  (await api.post<SupportTicketItem>(base, payload)).data;

export const replyTicket = async (id: string, payload: ReplyTicketPayload) =>
  (await api.post<TicketMessageItem>(`${base}/${id}/reply`, payload)).data;

export const updateTicket = async (id: string, payload: UpdateTicketPayload) =>
  (await api.patch<SupportTicketItem>(`${base}/${id}`, payload)).data;
