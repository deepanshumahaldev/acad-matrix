import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { listTickets } from '../api/supportApi';
import { NewTicketModal } from '../components/NewTicketModal';
import { TicketThreadModal } from '../components/TicketThreadModal';
import type { SupportTicketItem } from '../types';

export function StudentSupportPage() {
  const [newOpen, setNewOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => listTickets(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Help & Support</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Have questions or issues? Raise a ticket and track administrative support.
          </p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Raise New Ticket
        </button>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (!tickets || tickets.length === 0) && (
        <EmptyState
          title="No support tickets"
          description="If you need assistance regarding academics, fees, or facilities, click above."
        />
      )}

      {!isLoading && tickets && tickets.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Table<SupportTicketItem>
            columns={[
              {
                key: 'ticket',
                header: 'Ticket # & Subject',
                render: (t) => (
                  <div>
                    <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      #{t.number}
                    </span>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{t.subject}</div>
                    <span className="text-xs text-slate-500">{t.category || 'General'}</span>
                  </div>
                ),
              },
              {
                key: 'priority',
                header: 'Priority',
                render: (t) => (
                  <Badge tone={t.priority === 'HIGH' ? 'red' : t.priority === 'MEDIUM' ? 'amber' : 'gray'}>
                    {t.priority}
                  </Badge>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (t) => (
                  <Badge tone={t.status === 'RESOLVED' ? 'green' : t.status === 'CLOSED' ? 'gray' : 'amber'}>
                    {t.status}
                  </Badge>
                ),
              },
              {
                key: 'created',
                header: 'Created On',
                render: (t) => (
                  <span className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                ),
              },
              {
                key: 'actions',
                header: 'Action',
                render: (t) => (
                  <button
                    onClick={() => setSelectedTicketId(t.id)}
                    className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
                  >
                    View Conversation
                  </button>
                ),
              },
            ]}
            rows={tickets}
            rowKey={(t) => t.id}
          />
        </div>
      )}

      <NewTicketModal open={newOpen} onClose={() => setNewOpen(false)} />

      <TicketThreadModal
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId}
        isAdmin={false}
      />
    </div>
  );
}
