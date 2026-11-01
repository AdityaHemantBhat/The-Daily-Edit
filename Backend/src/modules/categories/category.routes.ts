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

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  order: z.number().int().default(0),
});

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { articles: { where: { status: 'PUBLISHED', deletedAt: null } } } } },
  });
  res.json({ items: categories });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const category = await prisma.category.findFirst({
    where: { slug: req.params.slug },
    include: { _count: { select: { articles: { where: { status: 'PUBLISHED', deletedAt: null } } } } },
  });
  if (!category) throw notFound('Category');
  res.json(category);
}));

router.post('/', requireAuth, requirePermission('categories:write'), validate(categorySchema), asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.slug ?? req.body.name, (s) =>
    prisma.category.findFirst({ where: { slug: s } }).then((r) => !!r));
  const category = await prisma.category.create({ data: { ...req.body, slug } });
  await audit(req.authUser!.id, 'CREATE', 'Category', category.id, { name: category.name });
  emitInvalidation('categories');
  res.status(201).json(category);
}));

router.patch('/:id', requireAuth, requirePermission('categories:write'), validate(categorySchema.partial()), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body } as Record<string, unknown>;
  if (typeof data.slug === 'string') {
    data.slug = await uniqueSlug(data.slug, (s) =>
      prisma.category.findFirst({ where: { slug: s, id: { not: id } } }).then((r) => !!r));
  }
  const category = await prisma.category.update({ where: { id }, data });
  await audit(req.authUser!.id, 'UPDATE', 'Category', category.id);
  emitInvalidation('categories');
  res.json(category);
}));

// Refuse to hard-delete a category with articles; offer reassignment instead.
router.delete('/:id', requireAuth, requirePermission('categories:write'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const moveTo = req.query.moveTo as string | undefined;
  const inUse = await prisma.article.count({ where: { categoryId: id, deletedAt: null } });

  if (inUse > 0 && !moveTo) {
    res.status(409).json({
      error: {
        code: 'CATEGORY_IN_USE',
        message: `This category has ${inUse} articles. Reassign them before deleting.`,
        details: { articleCount: inUse },
      },
    });
    return;
  }
  if (moveTo) {
    const target = await prisma.category.findUnique({ where: { id: moveTo } });
    if (!target || target.id === id) throw notFound('Target category');
    await prisma.article.updateMany({ where: { categoryId: id }, data: { categoryId: moveTo } });
  }
  await prisma.category.delete({ where: { id } });
  await audit(req.authUser!.id, 'DELETE', 'Category', id);
  emitInvalidation('categories');
  res.json({ ok: true });
}));

export default router;
