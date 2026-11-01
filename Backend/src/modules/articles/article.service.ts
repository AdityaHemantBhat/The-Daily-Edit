import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { AppError, badRequest, notFound } from '../../shared/errors/AppError.js';
import { readingMinutes, uniqueSlug } from '../../shared/utils/text.js';
import type { CreateArticleInput, ListArticlesQuery, UpdateArticleInput } from './article.schemas.js';

const CARD_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  slug: true,
  status: true,
  featured: true,
  trending: true,
  editorsPick: true,
  readingMinutes: true,
  viewCount: true,
  publishedAt: true,
  scheduledAt: true,
  updatedAt: true,
  imageAlt: true,
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, slug: true, avatarUrl: true } },
  featuredImage: { select: { url: true, width: true, height: true, altText: true } },
} as const;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function list(query: ListArticlesQuery) {
  const where = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
    ...(query.author ? { author: { slug: query.author } } : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.trending !== undefined ? { trending: query.trending } : {}),
    ...(query.editorsPick !== undefined ? { editorsPick: query.editorsPick } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            { plainText: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: CARD_SELECT,
      orderBy:
        query.orderBy === 'viewCount'
          ? { viewCount: 'desc' }
          : query.orderBy === 'updatedAt'
            ? { updatedAt: 'desc' }
            : { publishedAt: 'desc' },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    }),
    prisma.article.count({ where }),
  ]);

  return { items, total, page: query.page, perPage: query.perPage, pages: Math.ceil(total / query.perPage) };
}

export async function listHomeSections() {
  const base = {
    deletedAt: null,
    status: 'PUBLISHED' as const,
    publishedAt: { lte: new Date() },
  };

  const [featured, latest, trendingFlagged, topViewed, editorsPicks, recentlyUpdated] = await Promise.all([
    prisma.article.findMany({
      where: { ...base, featured: true },
      select: CARD_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 5,
    }),
    prisma.article.findMany({ where: base, select: CARD_SELECT, orderBy: { publishedAt: 'desc' }, take: 9 }),
    // "Mark as trending" pins an article to the top of Trending Now; the rest
    // of the list fills with genuinely most-viewed stories.
    prisma.article.findMany({
      where: { ...base, trending: true },
      select: CARD_SELECT,
      orderBy: { viewCount: 'desc' },
      take: 5,
    }),
    prisma.article.findMany({
      where: { ...base, trending: false },
      select: CARD_SELECT,
      orderBy: { viewCount: 'desc' },
      take: 5,
    }),
    prisma.article.findMany({
      where: { ...base, editorsPick: true },
      select: CARD_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 4,
    }),
    prisma.article.findMany({ where: base, select: CARD_SELECT, orderBy: { updatedAt: 'desc' }, take: 4 }),
  ]);

  const seen = new Set<string>();
  const trending: typeof featured = [];
  for (const article of [...trendingFlagged, ...topViewed]) {
    if (seen.has(article.id)) continue;
    seen.add(article.id);
    trending.push(article);
    if (trending.length >= 5) break;
  }

  return { featured, latest, trending, editorsPicks, recentlyUpdated };
}

export async function getBySlug(slug: string, includeDrafts = false) {
  const article = await prisma.article.findFirst({
    where: { slug, deletedAt: null, ...(includeDrafts ? {} : { status: 'PUBLISHED', publishedAt: { lte: new Date() } }) },
    include: {
      category: true,
      author: true,
      tags: { include: { tag: true } },
      featuredImage: true,
      seo: true,
      revisions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, createdAt: true, title: true },
      },
    },
  });
  if (!article) throw notFound('Article');

  const related = await prisma.article.findMany({
    where: {
      deletedAt: null,
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      categoryId: article.categoryId,
      id: { not: article.id },
    },
    select: CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });

  return { ...article, related };
}

export async function getById(id: string) {
  const article = await prisma.article.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      author: true,
      tags: { include: { tag: true } },
      featuredImage: true,
      seo: true,
    },
  });
  if (!article) throw notFound('Article');
  return article;
}

async function resolveTagIds(tagIds: string[]): Promise<string[]> {
  if (!tagIds.length) return [];
  const tags = await prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } });
  if (tags.length !== tagIds.length) throw badRequest('One or more tags do not exist');
  return tagIds;
}

function seoCreateData(seo?: UpdateArticleInput['seo']): Prisma.ArticleCreateInput['seo'] {
  if (!seo) return undefined;
  // Prisma create inputs treat null and undefined differently in strict typings;
  // nulls mean "unset" here, so normalize them out.
  return {
    create: {
      title: seo.title ?? undefined,
      description: seo.description ?? undefined,
      canonicalUrl: seo.canonicalUrl || undefined,
      ogImage: seo.ogImage || undefined,
      noindex: seo.noindex ?? undefined,
    },
  };
}

function seoUpdateData(seo?: UpdateArticleInput['seo']): Prisma.ArticleUpdateInput['seo'] {
  if (!seo) return undefined;
  // Upsert: nulls in the update payload legitimately clear the columns.
  const values = {
    title: seo.title ?? null,
    description: seo.description ?? null,
    canonicalUrl: seo.canonicalUrl || null,
    ogImage: seo.ogImage || null,
    noindex: seo.noindex ?? false,
  };
  return { upsert: { create: values, update: values } };
}

export async function create(input: CreateArticleInput, userId: string) {
  const slug = await uniqueSlug(input.slug ?? input.title, (s) =>
    prisma.article.findFirst({ where: { slug: s } }).then((r) => !!r),
  );

  const tagIds = await resolveTagIds(input.tagIds);
  const plainText = stripHtml(input.content);

  return prisma.article.create({
    data: {
      title: input.title,
      subtitle: input.subtitle,
      slug,
      content: input.content,
      plainText,
      status: input.status,
      readingMinutes: readingMinutes(plainText),
      categoryId: input.categoryId,
      authorId: input.authorId,
      featuredImageId: input.featuredImageId,
      imageCaption: input.imageCaption,
      imageAlt: input.imageAlt,
      featured: input.featured,
      trending: input.trending,
      editorsPick: input.editorsPick,
      scheduledAt: input.scheduledAt,
      publishedAt: input.publishedAt ?? (input.status === 'PUBLISHED' ? new Date() : null),
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
      seo: seoCreateData(input.seo),
      revisions: {
        create: { title: input.title, content: input.content, createdBy: userId },
      },
    },
    include: { tags: { include: { tag: true } }, category: true, author: true, seo: true },
  });
}

export async function update(id: string, input: UpdateArticleInput, userId: string) {
  const existing = await getById(id);

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await uniqueSlug(input.slug, (s) =>
      prisma.article.findFirst({ where: { slug: s, id: { not: id } } }).then((r) => !!r),
    );
  }

  const plainText = input.content ? stripHtml(input.content) : existing.plainText ?? undefined;
  const tagIds = input.tagIds ? await resolveTagIds(input.tagIds) : null;

  const becamePublished =
    input.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

  return prisma.article.update({
    where: { id },
    data: {
      title: input.title,
      subtitle: input.subtitle,
      slug,
      content: input.content,
      plainText,
      status: input.status,
      readingMinutes: plainText ? readingMinutes(plainText) : undefined,
      categoryId: input.categoryId,
      authorId: input.authorId,
      featuredImageId: input.featuredImageId,
      imageCaption: input.imageCaption,
      imageAlt: input.imageAlt,
      featured: input.featured,
      trending: input.trending,
      editorsPick: input.editorsPick,
      scheduledAt: input.scheduledAt,
      // An explicitly provided publishedAt (manual backdating) always wins;
      // otherwise the transition to PUBLISHED stamps "now".
      publishedAt: input.publishedAt !== undefined ? input.publishedAt : becamePublished ? new Date() : existing.publishedAt,
      ...(tagIds ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } } : {}),
      ...(input.content ? { revisions: { create: { title: input.title ?? existing.title, content: input.content, createdBy: userId } } } : {}),
      seo: seoUpdateData(input.seo),
    },
    include: { tags: { include: { tag: true } }, category: true, author: true, seo: true },
  });
}

export async function softDelete(id: string) {
  await getById(id);
  await prisma.article.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
}

export async function recordView(slug: string, visitorKey: string, referrer?: string) {
  const article = await prisma.article.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  });
  if (!article) return;

  // Deduplicate: same visitor on same article within 30 minutes counts once.
  const cutoff = new Date(Date.now() - 30 * 60_000);
  const recent = await prisma.articleView.findFirst({
    where: { articleId: article.id, visitorHash: visitorKey, viewedAt: { gte: cutoff } },
    select: { id: true },
  });
  if (recent) return;

  await prisma.$transaction([
    prisma.articleView.create({
      data: { articleId: article.id, visitorHash: visitorKey, referrer },
    }),
    prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }),
  ]);
}

export async function publishScheduled(): Promise<number> {
  const due = await prisma.article.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() }, deletedAt: null },
    select: { id: true },
  });
  if (!due.length) return 0;
  await prisma.article.updateMany({
    where: { id: { in: due.map((a) => a.id) } },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  return due.length;
}
