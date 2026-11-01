import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { writeLimiter } from '../../shared/middleware/rateLimit.js';
import { validate } from '../../shared/middleware/validate.js';
import { notFound } from '../../shared/errors/AppError.js';
import { audit } from '../../shared/utils/audit.js';

const sendMessageSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});

const router = Router();

// Public: submit a contact message into the admin inbox.
router.post(
  '/',
  writeLimiter,
  validate(sendMessageSchema),
  asyncHandler(async (req, res) => {
    await prisma.contactMessage.create({ data: req.body });
    res.status(201).json({
      ok: true,
      message: 'Thanks for reaching out — your message has been received. The editorial team typically replies within a few business days.',
    });
  }),
);

// Admin: inbox.
router.get(
  '/',
  requireAuth,
  requirePermission('comments:write'),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : 'ALL';
    const [items, unread] = await Promise.all([
      prisma.contactMessage.findMany({
        where: status === 'ALL' ? {} : { status: status as never },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.contactMessage.count({ where: { status: 'NEW' } }),
    ]);
    res.json({ items, unread });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requirePermission('comments:write'),
  validate(z.object({ status: z.enum(['NEW', 'READ', 'REPLIED']), adminNote: z.string().max(2000).optional() })),
  asyncHandler(async (req, res) => {
    const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
    if (!message) throw notFound('Message');
    const updated = await prisma.contactMessage.update({
      where: { id: message.id },
      data: { status: req.body.status, ...(req.body.adminNote !== undefined ? { adminNote: req.body.adminNote } : {}) },
    });
    await audit(req.authUser!.id, 'UPDATE', 'ContactMessage', message.id, { status: req.body.status });
    res.json(updated);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('comments:write'),
  asyncHandler(async (req, res) => {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    await audit(req.authUser!.id, 'DELETE', 'ContactMessage', req.params.id);
    res.json({ ok: true });
  }),
);

export default router;
