import { Badge, Skeleton } from '@/components/ui';
import { ApiError } from '@/lib/apiClient';
import { useReadiness } from '../hooks/useReadiness';

export function StatusPage() {
  const { data, error, isLoading } = useReadiness();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">AcadMatrix</h1>
        <p className="text-sm text-slate-500">College student management system</p>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">API status</h2>
        {isLoading && <Skeleton className="h-6 w-40" />}
        {error && (
          <div className="space-y-1">
            <Badge tone="red">Unreachable</Badge>
            <p className="text-xs text-slate-500">
              {error instanceof ApiError ? error.message : 'Could not reach the API. Is the backend running and CORS configured?'}
            </p>
          </div>
        )}
        {data && (
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Server</dt>
              <dd><Badge tone="green">Online</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Database</dt>
              <dd>
                <Badge tone={data.checks.database.status === 'up' ? 'green' : 'red'}>
                  {data.checks.database.status === 'up' ? `Up · ${data.checks.database.latencyMs} ms` : 'Down'}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
}
