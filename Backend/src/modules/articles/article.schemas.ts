import { z } from 'zod';

export const articleStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']);

export const listArticlesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
  status: articleStatusSchema.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  trending: z.coerce.boolean().optional(),
  editorsPick: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
  orderBy: z.enum(['publishedAt', 'viewCount', 'updatedAt']).default('publishedAt'),
});

const seoSchemaOptional = z
  .object({
    // nullish everywhere: the editor echoes back the stored SEO row, which
    // contains nulls for unset fields. URL fields also accept '' (cleared input).
    title: z.string().max(180).nullish(),
    description: z.string().max(320).nullish(),
    canonicalUrl: z.string().url().or(z.literal('')).nullish(),
    ogImage: z.string().url().or(z.literal('')).nullish(),
    noindex: z.boolean().nullish(),
  })
  .optional();

export const createArticleSchema = z.object({
  title: z.string().min(3).max(220),
  subtitle: z.string().max(320).nullish(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  content: z.string().min(1),
  status: articleStatusSchema.default('DRAFT'),
  categoryId: z.string().min(1),
  authorId: z.string().min(1),
  tagIds: z.array(z.string()).default([]),
  featuredImageId: z.string().optional(),
  imageCaption: z.string().max(300).nullish(),
  imageAlt: z.string().max(300).nullish(),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  editorsPick: z.boolean().default(false),
  scheduledAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().nullish(),
  seo: seoSchemaOptional,
});

export const updateArticleSchema = createArticleSchema.partial();

export type ListArticlesQuery = z.infer<typeof listArticlesSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
