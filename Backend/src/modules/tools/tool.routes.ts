import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { notFound } from '../../shared/errors/AppError.js';
import { uniqueSlug } from '../../shared/utils/text.js';
import { audit } from '../../shared/utils/audit.js';
import { emitInvalidation } from '../../shared/realtime/realtime.js';

const toolSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().min(10).max(1000),
  instructions: z.string().max(4000).optional(),
  componentKey: z.string().min(2).max(80),
  categoryId: z.string().min(1),
  enabled: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  faqs: z.array(z.object({ question: z.string().max(300), answer: z.string().max(1200) })).default([]),
});

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const includeDisabled = req.query.all === '1';
  if (includeDisabled) {
    // Including disabled/hidden tools is an admin-only view.
    if (!req.cookies?.tde_session) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
  }
  const tools = await prisma.tool.findMany({
    where: includeDisabled ? {} : { enabled: true },
    orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }, { name: 'asc' }],
    include: { category: true },
  });
  res.json({ items: tools });
}));

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const tool = await prisma.tool.findFirst({
      where: { slug: req.params.slug },
      include: { category: true },
    });
    if (!tool) throw notFound('Tool');
    const related = await prisma.tool.findMany({
      where: { categoryId: tool.categoryId, id: { not: tool.id }, enabled: true },
      take: 4,
      select: { name: true, slug: true, description: true },
    });
    res.json({ ...tool, related });
  }),
);

router.post(
  '/:slug/usage',
  asyncHandler(async (req, res) => {
    const tool = await prisma.tool.findFirst({ where: { slug: req.params.slug }, select: { id: true } });
    if (!tool) throw notFound('Tool');
    await prisma.toolUsage.create({ data: { toolId: tool.id } });
    await prisma.tool.update({ where: { id: tool.id }, data: { usageCount: { increment: 1 } } });
    res.json({ ok: true });
  }),
);

router.post('/', requireAuth, requirePermission('tools:write'), validate(toolSchema), asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.slug ?? req.body.name, (s) =>
    prisma.tool.findFirst({ where: { slug: s } }).then((r) => !!r));
  const tool = await prisma.tool.create({ data: { ...req.body, slug }, include: { category: true } });
  await audit(req.authUser!.id, 'CREATE', 'Tool', tool.id, { name: tool.name });
  emitInvalidation('tools');
  res.status(201).json(tool);
}));

router.patch('/:id', requireAuth, requirePermission('tools:write'), validate(toolSchema.partial()), asyncHandler(async (req, res) => {
  const tool = await prisma.tool.update({ where: { id: req.params.id }, data: req.body, include: { category: true } });
  await audit(req.authUser!.id, 'UPDATE', 'Tool', tool.id);
  emitInvalidation('tools');
  res.json(tool);
}));

router.delete('/:id', requireAuth, requirePermission('tools:write'), asyncHandler(async (req, res) => {
  await prisma.tool.delete({ where: { id: req.params.id } });
  await audit(req.authUser!.id, 'DELETE', 'Tool', req.params.id);
  emitInvalidation('tools');
  res.json({ ok: true });
}));

router.get('/categories/all', asyncHandler(async (_req, res) => {
  const categories = await prisma.toolCategory.findMany({
    orderBy: { order: 'asc' },
    include: { tools: { where: { enabled: true }, orderBy: { order: 'asc' } } },
  });
  res.json({ items: categories });
}));

export default router;
