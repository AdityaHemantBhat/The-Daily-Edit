import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { notFound } from '../../shared/errors/AppError.js';
import { uniqueSlug } from '../../shared/utils/text.js';
import { emitInvalidation } from '../../shared/realtime/realtime.js';

const authorSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  jobTitle: z.string().max(120).optional(),
  social: z.record(z.string().url()).optional(),
});

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const authors = await prisma.author.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { articles: { where: { status: 'PUBLISHED', deletedAt: null } } } } },
  });
  res.json({ items: authors });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const author = await prisma.author.findFirst({
    where: { slug: req.params.slug },
    include: {
      articles: {
        where: { status: 'PUBLISHED', deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        take: 20,
        select: { id: true, title: true, slug: true, publishedAt: true, readingMinutes: true, category: { select: { name: true, slug: true } } },
      },
    },
  });
  if (!author) throw notFound('Author');
  res.json(author);
}));

router.post('/', requireAuth, requirePermission('authors:write'), validate(authorSchema), asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.slug ?? req.body.name, (s) =>
    prisma.author.findFirst({ where: { slug: s } }).then((r) => !!r));
  const author = await prisma.author.create({ data: { ...req.body, slug } });
  emitInvalidation('authors');
  res.status(201).json(author);
}));

router.patch('/:id', requireAuth, requirePermission('authors:write'), validate(authorSchema.partial()), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body } as Record<string, unknown>;
  if (typeof data.slug === 'string') {
    data.slug = await uniqueSlug(data.slug, (s) =>
      prisma.author.findFirst({ where: { slug: s, id: { not: id } } }).then((r) => !!r));
  }
  const author = await prisma.author.update({ where: { id }, data });
  emitInvalidation('authors');
  res.json(author);
}));

router.delete('/:id', requireAuth, requirePermission('authors:write'), asyncHandler(async (req, res) => {
  const inUse = await prisma.article.count({ where: { authorId: req.params.id, deletedAt: null } });
  if (inUse > 0) {
    res.status(409).json({
      error: { code: 'AUTHOR_IN_USE', message: `Author still has ${inUse} articles. Reassign them first.` },
    });
    return;
  }
  await prisma.author.delete({ where: { id: req.params.id } });
  emitInvalidation('authors');
  res.json({ ok: true });
}));

export default router;
