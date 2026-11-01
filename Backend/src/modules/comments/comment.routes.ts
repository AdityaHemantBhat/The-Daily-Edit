import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { writeLimiter } from '../../shared/middleware/rateLimit.js';
import { validate } from '../../shared/middleware/validate.js';
import { notFound } from '../../shared/errors/AppError.js';
import { emitInvalidation } from '../../shared/realtime/realtime.js';

const createCommentSchema = z.object({
  articleSlug: z.string().min(1),
  authorName: z.string().min(2).max(80),
  authorEmail: z.string().email().max(254),
  body: z.string().min(3).max(3000),
});

const router = Router();

// Public: approved comments for a published article (no auth — read-only, moderated content).
router.get(
  '/public/:slug',
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findFirst({
      where: { slug: req.params.slug, status: 'PUBLISHED', deletedAt: null },
      select: { id: true },
    });
    if (!article) throw notFound('Article');
    const comments = await prisma.comment.findMany({
      where: { articleId: article.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, authorName: true, body: true, createdAt: true },
    });
    res.json({ items: comments });
  }),
);

// Public: submit a comment. It goes to moderation, never straight to the page.
router.post(
  '/',
  writeLimiter,
  validate(createCommentSchema),
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findFirst({
      where: { slug: req.body.articleSlug, status: 'PUBLISHED', deletedAt: null },
      select: { id: true },
    });
    if (!article) throw notFound('Article');

    await prisma.comment.create({
      data: {
        articleId: article.id,
        authorName: req.body.authorName,
        authorEmail: req.body.authorEmail,
        body: req.body.body,
        status: 'PENDING',
      },
    });
    res.status(201).json({ ok: true, message: 'Your comment was submitted and will appear after moderation.' });
  }),
);

router.get(
  '/',
  requireAuth,
  requirePermission('comments:write'),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : 'PENDING';
    const comments = await prisma.comment.findMany({
      where: status === 'ALL' ? {} : { status: status as never },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { article: { select: { title: true, slug: true } } },
    });
    res.json({ items: comments });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requirePermission('comments:write'),
  validate(z.object({ status: z.enum(['APPROVED', 'SPAM', 'TRASHED', 'PENDING']) })),
  asyncHandler(async (req, res) => {
    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    emitInvalidation('comments');
    res.json(comment);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('comments:write'),
  asyncHandler(async (req, res) => {
    await prisma.comment.delete({ where: { id: req.params.id } });
    emitInvalidation('comments');
    res.json({ ok: true });
  }),
);

export default router;
