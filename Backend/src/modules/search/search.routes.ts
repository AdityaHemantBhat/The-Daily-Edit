import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { validate } from '../../shared/middleware/validate.js';

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  type: z.enum(['all', 'articles', 'tools', 'categories']).default('all'),
});

interface ArticleRow {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  readingMinutes: number;
  publishedAt: Date;
  categoryName: string;
  categorySlug: string;
  authorName: string;
  authorSlug: string;
  imageUrl: string | null;
  rank: number;
}

const publishedFilter = Prisma.sql`
  a."deletedAt" IS NULL
  AND a.status = 'PUBLISHED'
  AND a."publishedAt" <= now()
`;

const tsVector = Prisma.sql`
  setweight(to_tsvector('english', a.title), 'A') ||
  setweight(to_tsvector('english', coalesce(a."plainText", '')), 'B')
`;

const router = Router();

/**
 * Full-text search over PostgreSQL (english configuration, title weighted above
 * body, prefix matching so "passw" finds "password"). No external services.
 */
router.get(
  '/',
  validate(searchSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { q, page, type } = req.query as unknown as z.infer<typeof searchSchema>;
    const perPage = 10;

    // Build a safe prefix tsquery: strip everything but letters/digits/spaces,
    // then join tokens with AND and allow prefix matching on each.
    const tokens = q.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean).slice(0, 8);
    const tsquery = tokens.map((t) => `${t}:*`).join(' & ');
    const emptyArticles = { items: [], total: 0, page, pages: 0 };

    const [articles, totalArticles, tools, categories] = await Promise.all([
      type === 'all' || type === 'articles'
        ? tsquery
          ? prisma.$queryRaw<ArticleRow[]>`
              SELECT a.id, a.title, a.subtitle, a.slug, a."readingMinutes", a."publishedAt",
                     c.name AS "categoryName", c.slug AS "categorySlug",
                     au.name AS "authorName", au.slug AS "authorSlug",
                     m.url AS "imageUrl",
                     ts_rank(${tsVector}, to_tsquery('english', ${tsquery})) AS rank
              FROM "Article" a
              JOIN "Category" c ON c.id = a."categoryId"
              JOIN "Author" au ON au.id = a."authorId"
              LEFT JOIN "Media" m ON m.id = a."featuredImageId"
              WHERE ${publishedFilter}
                AND ${tsVector} @@ to_tsquery('english', ${tsquery})
              ORDER BY rank DESC, a."publishedAt" DESC
              LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
            `
          : Promise.resolve([] as ArticleRow[])
        : Promise.resolve([] as ArticleRow[]),
      type === 'all' || type === 'articles'
        ? tsquery
          ? prisma.$queryRaw<{ count: bigint }[]>`
              SELECT COUNT(*) AS count
              FROM "Article" a
              WHERE ${publishedFilter}
                AND ${tsVector} @@ to_tsquery('english', ${tsquery})
            `.then((rows) => Number(rows[0]?.count ?? 0))
          : Promise.resolve(0)
        : Promise.resolve(0),
      type === 'all' || type === 'tools'
        ? prisma.tool.findMany({
            where: {
              enabled: true,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: { name: true, slug: true, description: true, category: { select: { name: true, slug: true } } },
            take: 8,
          })
        : Promise.resolve([]),
      type === 'all' || type === 'categories'
        ? prisma.category.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: { name: true, slug: true, description: true },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    res.json({
      articles: {
        items: articles.map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: a.subtitle,
          slug: a.slug,
          readingMinutes: a.readingMinutes,
          publishedAt: a.publishedAt,
          status: 'PUBLISHED',
          featured: false,
          trending: false,
          editorsPick: false,
          viewCount: 0,
          updatedAt: a.publishedAt,
          imageAlt: null,
          category: { name: a.categoryName, slug: a.categorySlug },
          author: { name: a.authorName, slug: a.authorSlug, avatarUrl: null },
          featuredImage: a.imageUrl ? { url: a.imageUrl } : null,
        })),
        total: totalArticles,
        page,
        pages: Math.ceil(totalArticles / perPage),
      },
      tools,
      categories,
    });
  }),
);

export default router;
