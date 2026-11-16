import type { Server } from 'node:http';
import { createApp } from './app';
import { config } from './common/config';
import { disconnectPrisma } from './common/db/prisma';
import { logger } from './common/utils/logger';

const app = createApp();

const server: Server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'AcadMatrix API listening');
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down');
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
