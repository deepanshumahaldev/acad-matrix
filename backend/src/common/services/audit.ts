import type { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
}

/** Audit writes must never break the request that triggered them, so failures are logged and swallowed. */
export class PrismaAuditLogger implements AuditLogger {
  constructor(private readonly getDb: () => PrismaClient) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.getDb().auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          metadata: (entry.metadata ?? undefined) as object | undefined,
          ipAddress: entry.ipAddress ?? null,
        },
      });
    } catch (err) {
      logger.error({ err, action: entry.action }, 'Failed to write audit log');
    }
  }
}
