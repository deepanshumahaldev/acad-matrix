import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTicketById, replyTicket, updateTicket } from '../api/supportApi';
import type { TicketMessageItem, TicketStatus } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
  isAdmin?: boolean;
}

export function TicketThreadModal({ open, onClose, ticketId, isAdmin }: Props) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => (ticketId ? getTicketById(ticketId) : null),
    enabled: !!ticketId && open,
  });

  const replyMutation = useMutation({
    mutationFn: () => {
      if (!ticketId) throw new Error('No ticket selected');
      if (!replyText.trim()) throw new Error('Message cannot be empty');
      return replyTicket(ticketId, { body: replyText.trim() });
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to post reply');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: TicketStatus) => {
      if (!ticketId) throw new Error('No ticket selected');
      return updateTicket(ticketId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update status');
    },
  });

  if (!ticketId) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Ticket #${ticket?.number || ''}: ${ticket?.subject || 'Loading...'}`}>
      <div className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !ticket ? (
          <p className="text-sm text-slate-500">Ticket not found.</p>
        ) : (
          <>
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Raised by: {ticket.raisedBy?.firstName} {ticket.raisedBy?.lastName} ({ticket.raisedBy?.role})
                </span>
                <span>•</span>
                <span className="text-slate-500">Category: {ticket.category || 'General'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={ticket.status === 'RESOLVED' ? 'green' : ticket.status === 'CLOSED' ? 'gray' : 'amber'}>
                  {ticket.status}
                </Badge>
                {isAdmin && (
                  <select
                    value={ticket.status}
                    onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
                    className="rounded border border-slate-300 px-2 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="OPEN">Mark Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                )}
              </div>
            </div>

            {/* Message thread */}
            <div className="max-h-80 space-y-3 overflow-y-auto p-1">
              {ticket.messages?.map((msg: TicketMessageItem) => {
                const isStaff = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'FACULTY';
                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 text-sm ${
                      isStaff
                        ? 'bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50'
                        : 'bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {msg.sender?.firstName} {msg.sender?.lastName} {isStaff && '(Staff)'}
                      </span>
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{msg.body}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            {ticket.status === 'CLOSED' ? (
              <p className="text-center text-xs italic text-slate-400">
                This ticket has been marked closed. No further replies can be posted.
              </p>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response..."
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => replyMutation.mutate()}
                    disabled={replyMutation.isPending || !replyText.trim()}
                    className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
