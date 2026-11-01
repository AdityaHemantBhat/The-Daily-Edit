import { Router } from 'express';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';

const router = Router();

router.get(
  '/overview',
  requireAuth,
  requirePermission('dashboard:view'),
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 86_400_000);
    const since7 = new Date(now.getTime() - 7 * 86_400_000);

    const [
      totalArticles, published, drafts, scheduled,
      totalViews, views30, views7,
      toolUsage30, subscribers,
      popularArticles, recentArticles,
      usageByTool, viewsByDay,
    ] = await Promise.all([
      prisma.article.count({ where: { deletedAt: null } }),
      prisma.article.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.article.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.article.count({ where: { deletedAt: null, status: 'SCHEDULED' } }),
      prisma.articleView.count(),
      prisma.articleView.count({ where: { viewedAt: { gte: since30 } } }),
      prisma.articleView.count({ where: { viewedAt: { gte: since7 } } }),
      prisma.toolUsage.count({ where: { usedAt: { gte: since30 } } }),
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
      prisma.article.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, viewCount: true },
      }),
      prisma.article.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: { id: true, title: true, slug: true, status: true, updatedAt: true },
      }),
      prisma.toolUsage.groupBy({
        by: ['toolId'],
        where: { usedAt: { gte: since30 } },
        _count: { toolId: true },
        orderBy: { _count: { toolId: 'desc' } },
        take: 5,
      }),
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "viewedAt") AS day, COUNT(*) AS count
        FROM "ArticleView"
        WHERE "viewedAt" >= ${since30}
        GROUP BY 1 ORDER BY 1 ASC
      `,
    ]);

    const toolIds = usageByTool.map((u) => u.toolId);
    const tools = toolIds.length
      ? await prisma.tool.findMany({ where: { id: { in: toolIds } }, select: { id: true, name: true, slug: true } })
      : [];
    const toolName = new Map(tools.map((t) => [t.id, t]));

    res.json({
      articles: { total: totalArticles, published, drafts, scheduled },
      views: { total: totalViews, last30: views30, last7: views7 },
      toolUsage30,
      subscribers,
      popularArticles,
      recentArticles,
      topTools: usageByTool.map((u) => ({
        tool: toolName.get(u.toolId) ?? { name: 'Deleted tool', slug: '' },
        count: u._count.toolId,
      })),
      viewsTimeline: viewsByDay.map((r) => ({ day: r.day, count: Number(r.count) })),
    });
  }),
);

router.get(
  '/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Admin quick search across content for the dashboard search box.
    const q = String(req.query.q ?? '').slice(0, 120);
    if (!q) { res.json({ articles: [], tools: [] }); return; }
    const [articles, tools] = await Promise.all([
      prisma.article.findMany({
        where: { deletedAt: null, title: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, title: true, slug: true, status: true },
      }),
      prisma.tool.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, slug: true, enabled: true },
      }),
    ]);
    res.json({ articles, tools });
  }),
);

export default router;
