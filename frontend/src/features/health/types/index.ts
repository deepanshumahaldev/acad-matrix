export interface ReadinessStatus {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
  checks: { database: { status: 'up' | 'down'; latencyMs: number | null } };
}
