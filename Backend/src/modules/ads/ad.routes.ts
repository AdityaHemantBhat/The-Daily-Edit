import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { audit } from '../../shared/utils/audit.js';

// Standard editorial ad placements. Keys are referenced by frontend AdSlot components.
const DEFAULT_PLACEMENTS = [
  { key: 'home_top', label: 'Homepage top', description: 'Below the masthead on the homepage' },
  { key: 'home_mid', label: 'Homepage mid-content', description: 'Between homepage sections' },
  { key: 'article_top', label: 'Article top', description: 'Above article content' },
  { key: 'article_mid', label: 'Article in-content', description: 'After the second content block' },
  { key: 'article_bottom', label: 'Article bottom', description: 'After article content' },
  { key: 'sidebar', label: 'Sidebar', description: 'Desktop sidebar on article pages' },
  { key: 'tools_page', label: 'Tools page', description: 'Tools directory top' },
  { key: 'tool_page', label: 'Tool page', description: 'Individual tool pages' },
];

const adSchema = z.object({
  placementId: z.string().min(1),
  name: z.string().min(1).max(120),
  adClient: z.string().max(120).regex(/^ca-pub-\d+$|^$/, 'Must be a ca-pub-… publisher ID or empty').optional(),
  adSlot: z.string().max(60).regex(/^\d*$|^$/, 'Numeric slot ID or empty').optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).default('PAUSED'),
});

const router = Router();

router.get('/placements', requireAuth, asyncHandler(async (_req, res) => {
  const placements = await prisma.advertisementPlacement.findMany({
    orderBy: { key: 'asc' },
    include: { ads: true },
  });
  res.json({ items: placements });
}));

router.get('/live', asyncHandler(async (_req, res) => {
  // Public config consumed by the frontend: only active ads + global publisher ID.
  const [ads, settings] = await Promise.all([
    prisma.advertisement.findMany({
      where: { status: 'ACTIVE', adClient: { not: null }, adSlot: { not: null } },
      include: { placement: true },
    }),
    prisma.siteSetting.findUnique({ where: { key: 'adsense' } }),
  ]);
  res.json({
    publisherId: (settings?.value as { publisherId?: string } | null)?.publisherId ?? null,
    placements: ads.map((ad) => ({
      key: ad.placement.key,
      adClient: ad.adClient,
      adSlot: ad.adSlot,
      label: ad.placement.label,
    })),
  });
}));

router.post('/placements/seed-defaults', requireAuth, requirePermission('ads:write'), asyncHandler(async (_req, res) => {
  const created = [];
  for (const p of DEFAULT_PLACEMENTS) {
    created.push(
      await prisma.advertisementPlacement.upsert({
        where: { key: p.key },
        update: {},
        create: p,
      }),
    );
  }
  res.json({ items: created });
}));

router.post('/', requireAuth, requirePermission('ads:write'), validate(adSchema), asyncHandler(async (req, res) => {
  const ad = await prisma.advertisement.create({ data: req.body });
  await audit(req.authUser!.id, 'CREATE', 'Advertisement', ad.id, { name: ad.name });
  res.status(201).json(ad);
}));

router.patch('/:id', requireAuth, requirePermission('ads:write'), validate(adSchema.partial()), asyncHandler(async (req, res) => {
  const ad = await prisma.advertisement.update({ where: { id: req.params.id }, data: req.body });
  await audit(req.authUser!.id, 'UPDATE', 'Advertisement', ad.id);
  res.json(ad);
}));

router.delete('/:id', requireAuth, requirePermission('ads:write'), asyncHandler(async (req, res) => {
  await prisma.advertisement.delete({ where: { id: req.params.id } });
  await audit(req.authUser!.id, 'DELETE', 'Advertisement', req.params.id);
  res.json({ ok: true });
}));

export default router;
