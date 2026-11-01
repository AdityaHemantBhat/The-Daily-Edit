import { prisma } from '../database/prisma.js';
import { logger } from '../logger/logger.js';

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  ip?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata: metadata as never, ip },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to write audit log');
  }
}
