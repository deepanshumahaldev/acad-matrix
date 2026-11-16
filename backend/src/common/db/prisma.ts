import { PrismaClient } from '@prisma/client';
import { config } from '../config';

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Lazily creates the single shared client (pooled Neon URL). Reused across hot reloads in dev
 * so we do not exhaust connections, and never constructed unless a route actually needs the DB.
 */
export function getPrisma(): PrismaClient {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      datasources: { db: { url: config.db.url } },
      log: config.isProd ? ['error'] : ['warn', 'error'],
    });
  }
  return globalThis.__prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (globalThis.__prisma) {
    await globalThis.__prisma.$disconnect();
    globalThis.__prisma = undefined;
  }
}
