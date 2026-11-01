import http from 'node:http';
import { createApp, startScheduler } from './app.js';
import { env, isProd } from './config/env.js';
import { logger } from './shared/logger/logger.js';
import { initRealtime } from './shared/realtime/realtime.js';
import { prisma } from './shared/database/prisma.js';

const app = createApp();
const server = http.createServer(app);

initRealtime(server);

server.listen(env.PORT, () => {
  logger.info(`The Daily Edit API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  startScheduler();
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void isProd;
