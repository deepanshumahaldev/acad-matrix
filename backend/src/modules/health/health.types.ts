export interface LivenessStatus {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessStatus extends LivenessStatus {
  checks: {
    database: { status: 'up' | 'down'; latencyMs: number | null };
  };
}
