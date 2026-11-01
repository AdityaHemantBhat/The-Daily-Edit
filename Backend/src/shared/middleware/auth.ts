import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../database/prisma.js';
import { forbidden, unauthorized } from '../errors/AppError.js';

export const AUTH_COOKIE = 'tde_session';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookie = req.cookies?.[AUTH_COOKIE];
  if (cookie) return cookie as string;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; sid: string };
    void (async () => {
      const session = await prisma.session.findUnique({
        where: { id: payload.sid },
        include: { user: { include: { role: true } } },
      });
      if (!session || session.expiresAt < new Date() || !session.user.isActive) {
        next(unauthorized('Session expired'));
        return;
      }
      req.authUser = {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        name: session.user.name,
        role: session.user.role.name,
        permissions: session.user.role.permissions,
      };
      void prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      }).catch(() => undefined);
      next();
    })().catch(next);
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

/** True when the request carries a valid session of a user with the given permission. */
export async function isStaffRequest(req: Request, permission: string): Promise<boolean> {
  const token = extractToken(req);
  if (!token) return false;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sid: string };
    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: { include: { role: true } } },
    });
    if (!session || session.expiresAt < new Date() || !session.user.isActive) return false;
    const u = session.user;
    return u.role.name === 'ADMIN' || u.role.permissions.includes('*') || u.role.permissions.includes(permission);
  } catch {
    return false;
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user) return next(unauthorized());
    if (user.role === 'ADMIN' || user.permissions.includes(permission)) return next();
    next(forbidden(`Missing permission: ${permission}`));
  };
}
