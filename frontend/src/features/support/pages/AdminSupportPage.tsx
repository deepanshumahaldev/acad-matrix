import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table } from '@/components/ui/Table';
import { listTickets } from '../api/supportApi';
import { TicketThreadModal } from '../components/TicketThreadModal';
import type { SupportTicketItem, TicketPriority, TicketStatus } from '../types';

export function AdminSupportPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter, priorityFilter],
    queryFn: () =>
      listTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Support Helpdesk</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review student grievances, respond to queries, and resolve help tickets.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && (!tickets || tickets.length === 0) && (
        <EmptyState title="Inbox empty" description="No support tickets match the selected filters." />
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
                key: 'student',
                header: 'Student',
                render: (t) => (
                  <div>
                    <div className="text-sm font-medium">
                      {t.raisedBy?.firstName} {t.raisedBy?.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{t.raisedBy?.email}</div>
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
                header: 'Created',
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
                    View Thread
                  </button>
                ),
              },
            ]}
            rows={tickets}
            rowKey={(t) => t.id}
          />
        </div>
      )}

      <TicketThreadModal
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId}
        isAdmin={true}
      />
    </div>
  );
}
