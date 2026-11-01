import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../shared/database/prisma.js';
import { AppError, conflict, unauthorized } from '../../shared/errors/AppError.js';
import { hashPassword, verifyPassword } from '../../shared/security/password.js';

const SESSION_COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: env.NODE_ENV === 'production',
};

export interface LoginInput {
  identifier: string;
  password: string;
  remember: boolean;
}

function signToken(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function login(input: LoginInput, userAgent?: string, ip?: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.identifier.toLowerCase() }, { username: input.identifier }],
      isActive: true,
    },
    include: { role: true },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized('Invalid credentials');
  }

  const ttlDays = input.remember ? 30 : env.SESSION_TTL_DAYS;
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex'),
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
    },
  });

  const token = signToken(user.id, session.id);
  return {
    token,
    cookie: {
      value: token,
      maxAge: ttlDays * 86_400_000,
      options: SESSION_COOKIE_BASE,
    },
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role.name,
      permissions: user.role.permissions,
    },
  };
}

export async function logout(sessionToken: string) {
  try {
    const payload = jwt.verify(sessionToken, env.JWT_SECRET) as { sid: string };
    await prisma.session.delete({ where: { id: payload.sid } }).catch(() => undefined);
  } catch {
    // Already invalid — logging out is idempotent.
  }
  return { ...SESSION_COOKIE_BASE, maxAge: 0 };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw unauthorized('Current password is incorrect');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  // Invalidate all other sessions after a credential change.
  await prisma.session.deleteMany({ where: { userId } });
}

export async function updateProfile(
  userId: string,
  data: { email?: string; username?: string; name?: string },
) {
  const clash = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [
        ...(data.email ? [{ email: data.email.toLowerCase() }] : []),
        ...(data.username ? [{ username: data.username }] : []),
      ],
    },
  });
  if (clash) throw conflict('Email or username already in use');

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.email ? { email: data.email.toLowerCase() } : {}),
      ...(data.username ? { username: data.username } : {}),
      ...(data.name ? { name: data.name } : {}),
    },
    select: { id: true, email: true, username: true, name: true },
  });
}

export function clearCookieOptions() {
  return { ...SESSION_COOKIE_BASE, maxAge: 0 };
}

export { SESSION_COOKIE_BASE, AppError };
