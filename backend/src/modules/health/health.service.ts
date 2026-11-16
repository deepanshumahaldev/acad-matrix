import type { HealthRepository } from './health.repository';
import type { LivenessStatus, ReadinessStatus } from './health.types';

export class HealthService {
  constructor(private readonly repo: Pick<HealthRepository, 'ping'>) {}

  liveness(): LivenessStatus {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<{ ready: boolean; body: ReadinessStatus }> {
    const started = Date.now();
    let dbUp = true;
    try {
      await this.repo.ping();
    } catch {
      dbUp = false;
    }
    return {
      ready: dbUp,
      body: {
        ...this.liveness(),
        checks: { database: { status: dbUp ? 'up' : 'down', latencyMs: dbUp ? Date.now() - started : null } },
      },
    };
  }
}
