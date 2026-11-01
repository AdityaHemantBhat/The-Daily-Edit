import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { uniqueSlug } from '../../shared/utils/text.js';
import { emitInvalidation } from '../../shared/realtime/realtime.js';

const tagSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
});

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const tags = await prisma.tag.findMany({
    where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' },
    take: 100,
    include: { _count: { select: { articles: true } } },
  });
  res.json({ items: tags });
}));

router.post('/', requireAuth, requirePermission('articles:write'), validate(tagSchema), asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.slug ?? req.body.name, (s) =>
    prisma.tag.findFirst({ where: { slug: s } }).then((r) => !!r));
  const tag = await prisma.tag.create({ data: { name: req.body.name, slug } });
  emitInvalidation('tags');
  res.status(201).json(tag);
}));

router.delete('/:id', requireAuth, requirePermission('articles:write'), asyncHandler(async (req, res) => {
  await prisma.tag.delete({ where: { id: req.params.id } });
  emitInvalidation('tags');
  res.json({ ok: true });
}));

export default router;
