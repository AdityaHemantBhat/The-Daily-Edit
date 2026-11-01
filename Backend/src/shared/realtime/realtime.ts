import { Server, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

let io: Server | null = null;

/** Attaches the Socket.IO server to the HTTP server. */
export function initRealtime(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN.split(','), credentials: true },
  });

  io.on('connection', (socket: Socket) => {
    socket.emit('site:hello', { at: Date.now() });
  });

  logger.info('Realtime (Socket.IO) ready');
}

/** Broadcasts invalidation scopes; the frontend refetches the matching queries. */
export function emitInvalidation(...scopes: string[]): void {
  if (!io) return;
  io.emit('site:invalidate', { scopes, at: Date.now() });
}
