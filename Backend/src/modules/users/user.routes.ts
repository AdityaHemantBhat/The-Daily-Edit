import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { conflict, notFound } from '../../shared/errors/AppError.js';
import { hashPassword } from '../../shared/security/password.js';
import { audit } from '../../shared/utils/audit.js';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(120),
  password: z
    .string()
    .min(10)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
  roleId: z.string().min(1),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(10).optional(),
});

const roleSchema = z.object({
  name: z.string().min(2).max(40),
  description: z.string().max(300).optional(),
  permissions: z.array(z.string()).default([]),
});

const router = Router();

router.get('/', requireAuth, requirePermission('users:write'), asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, email: true, username: true, name: true, isActive: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
      sessions: { select: { id: true, expiresAt: true } },
    },
  });
  res.json({ items: users });
}));

router.get('/roles', requireAuth, asyncHandler(async (_req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  res.json({ items: roles });
}));

router.post(
  '/roles',
  requireAuth,
  requirePermission('users:write'),
  validate(roleSchema),
  asyncHandler(async (req, res) => {
    const exists = await prisma.role.findUnique({ where: { name: req.body.name } });
    if (exists) throw conflict('Role name already exists');
    const role = await prisma.role.create({ data: req.body });
    await audit(req.authUser!.id, 'CREATE', 'Role', role.id, { name: role.name });
    res.status(201).json(role);
  }),
);

router.post(
  '/',
  requireAuth,
  requirePermission('users:write'),
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const clash = await prisma.user.findFirst({
      where: { OR: [{ email: req.body.email.toLowerCase() }, { username: req.body.username }] },
    });
    if (clash) throw conflict('Email or username already in use');

    const user = await prisma.user.create({
      data: {
        email: req.body.email.toLowerCase(),
        username: req.body.username,
        name: req.body.name,
        passwordHash: await hashPassword(req.body.password),
        roleId: req.body.roleId,
      },
      select: { id: true, email: true, username: true, name: true, isActive: true, role: { select: { name: true } } },
    });
    await audit(req.authUser!.id, 'CREATE', 'User', user.id, { username: user.username });
    res.status(201).json(user);
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requirePermission('users:write'),
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('User');

    if (target.id === req.authUser!.id && req.body.isActive === false) {
      throw conflict('You cannot deactivate your own account');
    }

    const data: Record<string, unknown> = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.roleId) data.roleId = req.body.roleId;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    if (req.body.password) {
      data.passwordHash = await hashPassword(req.body.password);
      await prisma.session.deleteMany({ where: { userId: target.id } });
    }

    const user = await prisma.user.update({
      where: { id: target.id },
      data,
      select: { id: true, email: true, username: true, name: true, isActive: true, role: { select: { name: true } } },
    });
    await audit(req.authUser!.id, 'UPDATE', 'User', user.id);
    res.json(user);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('users:write'),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.authUser!.id) {
      throw conflict('You cannot delete your own account');
    }
    await prisma.session.deleteMany({ where: { userId: req.params.id } });
    await prisma.user.delete({ where: { id: req.params.id } });
    await audit(req.authUser!.id, 'DELETE', 'User', req.params.id);
    res.json({ ok: true });
  }),
);

export default router;
