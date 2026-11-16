import type { PrismaClient } from '@prisma/client';

export class HealthRepository {
  constructor(private readonly getDb: () => PrismaClient) {}

  /** Cheapest possible round-trip to verify the database is reachable. */
  async ping(): Promise<void> {
    await this.getDb().$queryRaw`SELECT 1`;
  }
}
