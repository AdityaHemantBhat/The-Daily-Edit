import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { audit } from '../../shared/utils/audit.js';
import { emitInvalidation } from '../../shared/realtime/realtime.js';

const settingSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
});

const router = Router();

// Public settings the site needs to render. 'legal' powers the public
// About/Privacy/Terms/... pages, which are meant to be publicly readable.
const PUBLIC_KEYS = ['site', 'announcement', 'newsletter', 'homeSections', 'legal'];

router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const settings = await prisma.siteSetting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
    const out: Record<string, unknown> = {};
    for (const s of settings) out[s.key] = s.value;
    res.json(out);
  }),
);

router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const settings = await prisma.siteSetting.findMany();
  res.json({ items: settings });
}));

router.put('/', requireAuth, requirePermission('settings:write'), validate(settingSchema), asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.upsert({
    where: { key: req.body.key },
    update: { value: req.body.value as never },
    create: { key: req.body.key, value: req.body.value as never },
  });
  await audit(req.authUser!.id, 'UPDATE', 'SiteSetting', setting.key);
  emitInvalidation('settings');
  res.json(setting);
}));

export default router;
