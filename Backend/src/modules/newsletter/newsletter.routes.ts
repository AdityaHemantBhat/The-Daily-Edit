import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { writeLimiter } from '../../shared/middleware/rateLimit.js';
import { validate } from '../../shared/middleware/validate.js';
import { audit } from '../../shared/utils/audit.js';

const subscribeSchema = z.object({
  email: z.string().email().max(254),
  consent: z.literal(true, { message: 'Consent is required to subscribe' }),
});

const router = Router();

router.post(
  '/subscribe',
  writeLimiter,
  validate(subscribeSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

    if (existing?.unsubscribedAt) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribedAt: null, confirmed: false, token: crypto.randomBytes(24).toString('hex') },
      });
    } else if (!existing) {
      await prisma.newsletterSubscriber.create({
        data: { email, token: crypto.randomBytes(24).toString('hex') },
      });
    }

    // Always respond the same way — no email enumeration.
    res.json({ ok: true, message: 'If this address is valid, a confirmation link is on its way.' });
  }),
);

router.get(
  '/confirm',
  asyncHandler(async (req, res) => {
    const token = String(req.query.token ?? '');
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { token } });
    if (!sub) {
      res.status(400).send('Invalid or expired confirmation link.');
      return;
    }
    await prisma.newsletterSubscriber.update({ where: { id: sub.id }, data: { confirmed: true } });
    res.send('<h1 style="font-family:sans-serif">Subscription confirmed</h1><p>You can close this window.</p>');
  }),
);

router.get(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const token = String(req.query.token ?? '');
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { token } });
    if (!sub) {
      res.status(400).send('Invalid unsubscribe link.');
      return;
    }
    await prisma.newsletterSubscriber.update({
      where: { id: sub.id },
      data: { unsubscribedAt: new Date(), confirmed: false },
    });
    res.send('<h1 style="font-family:sans-serif">Unsubscribed</h1><p>You will no longer receive emails.</p>');
  }),
);

router.get(
  '/',
  requireAuth,
  requirePermission('settings:write'),
  asyncHandler(async (_req, res) => {
    const [total, confirmed, recent] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null, confirmed: true } }),
      prisma.newsletterSubscriber.findMany({
        where: { unsubscribedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, email: true, confirmed: true, createdAt: true },
      }),
    ]);
    res.json({ total, confirmed, items: recent });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('settings:write'),
  asyncHandler(async (req, res) => {
    await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
    await audit(req.authUser!.id, 'DELETE', 'NewsletterSubscriber', req.params.id);
    res.json({ ok: true });
  }),
);

export default router;
