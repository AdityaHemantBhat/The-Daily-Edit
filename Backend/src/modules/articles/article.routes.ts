import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AUTH_COOKIE, isStaffRequest, requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { writeLimiter } from '../../shared/middleware/rateLimit.js';
import { validate } from '../../shared/middleware/validate.js';
import { emitInvalidation } from '../../shared/realtime/realtime.js';
import { visitorHash } from '../../shared/utils/text.js';
import { audit } from '../../shared/utils/audit.js';
import * as service from './article.service.js';
import { createArticleSchema, listArticlesSchema, updateArticleSchema } from './article.schemas.js';

const router = Router();

// ---- Public (strictly published content) ----
router.get(
  '/',
  validate(listArticlesSchema, 'query'),
  asyncHandler(async (req, res) => {
    // The public site NEVER shows drafts — even to logged-in staff. Drafts are
    // listed via /admin (below) and previewed via the slug route for staff.
    const query = { ...req.query, status: 'PUBLISHED' } as Record<string, unknown>;
    res.json(await service.list(query as never));
  }),
);

// ---- Admin listing (drafts, archived, search) ----
router.get(
  '/admin',
  requireAuth,
  requirePermission('articles:write'),
  validate(listArticlesSchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await service.list(req.query as never));
  }),
);

router.get(
  '/home-sections',
  asyncHandler(async (_req, res) => {
    res.json(await service.listHomeSections());
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    // Staff may preview drafts on the site; anonymous visitors see published only.
    const includeDrafts = await isStaffRequest(req, 'articles:write');
    res.json(await service.getBySlug(req.params.slug, includeDrafts));
  }),
);

router.post(
  '/:slug/view',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const hash = visitorHash(req.ip ?? 'unknown', req.headers['user-agent'] ?? '', env.JWT_SECRET);
    await service.recordView(req.params.slug, hash, req.headers.referer);
    res.json({ ok: true });
  }),
);

// ---- Admin ----
router.get(
  '/admin/by-id/:id',
  requireAuth,
  requirePermission('articles:write'),
  asyncHandler(async (req, res) => {
    res.json(await service.getById(req.params.id));
  }),
);

router.post(
  '/',
  requireAuth,
  requirePermission('articles:write'),
  validate(createArticleSchema),
  asyncHandler(async (req, res) => {
    const article = await service.create(req.body, req.authUser!.id);
    await audit(req.authUser!.id, 'CREATE', 'Article', article.id, { title: article.title }, req.ip);
    emitInvalidation('articles');
    res.status(201).json(article);
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requirePermission('articles:write'),
  validate(updateArticleSchema),
  asyncHandler(async (req, res) => {
    const article = await service.update(req.params.id, req.body, req.authUser!.id);
    await audit(req.authUser!.id, 'UPDATE', 'Article', article.id, { title: article.title }, req.ip);
    emitInvalidation('articles');
    res.json(article);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('articles:write'),
  asyncHandler(async (req, res) => {
    await service.softDelete(req.params.id);
    await audit(req.authUser!.id, 'DELETE', 'Article', req.params.id, undefined, req.ip);
    emitInvalidation('articles');
    res.json({ ok: true });
  }),
);

const bulkSchema = z.object({ ids: z.array(z.string()).min(1), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) });

router.post(
  '/bulk-status',
  requireAuth,
  requirePermission('articles:write'),
  validate(bulkSchema),
  asyncHandler(async (req, res) => {
    const data = req.body.status === 'PUBLISHED' ? { status: 'PUBLISHED' as const, publishedAt: new Date() } : { status: req.body.status };
    const result = await (await import('../../shared/database/prisma.js')).prisma.article.updateMany({
      where: { id: { in: req.body.ids }, deletedAt: null },
      data,
    });
    await audit(req.authUser!.id, 'BULK_STATUS', 'Article', undefined, { count: result.count }, req.ip);
    emitInvalidation('articles');
    res.json({ ok: true, count: result.count });
  }),
);

export default router;
