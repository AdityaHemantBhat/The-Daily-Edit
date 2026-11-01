import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import type { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { escapeXml } from '../security/sanitize.js';
import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedTemplate: string | null = null;

async function template(): Promise<string> {
  if (!cachedTemplate) {
    // Backend/src/shared/seo → repo root → Frontend/dist
    cachedTemplate = await fs.readFile(
      path.resolve(__dirname, '..', '..', '..', '..', 'Frontend', 'dist', 'index.html'),
      'utf8',
    );
  }
  return cachedTemplate;
}

function inject(html: string, tags: string, jsonLd: unknown[]): string {
  // The injected tags carry their own <title>; drop the template's static one.
  let out = html.replace(/<title>.*?<\/title>/, '').replace('<head>', `<head>\n${tags}`);
  if (jsonLd.length) {
    out = out.replace('</head>', `${jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}</head>`);
  }
  return out;
}

function metaTags({ title, description, image, canonical, type, noindex }: {
  title: string; description?: string | null; image?: string | null; canonical: string; type: string; noindex?: boolean;
}): string {
  const tags = [
    `<title>${escapeXml(title)}</title>`,
    `<meta property="og:title" content="${escapeXml(title)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${escapeXml(canonical)}" />`,
    `<link rel="canonical" href="${escapeXml(canonical)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}" />`,
  ];
  if (description) {
    tags.push(`<meta name="description" content="${escapeXml(description)}" />`);
    tags.push(`<meta property="og:description" content="${escapeXml(description)}" />`);
    tags.push(`<meta name="twitter:description" content="${escapeXml(description)}" />`);
  }
  if (image) {
    const url = image.startsWith('http') ? image : `${env.SITE_URL.replace(/\/$/, '')}${image}`;
    tags.push(`<meta property="og:image" content="${escapeXml(url)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeXml(url)}" />`);
  }
  return tags.join('\n');
}

const SITE_NAME = 'The Daily Edit';

/**
 * Server-side metadata injection for crawler-critical routes. The SPA still
 * renders the full page client-side; this guarantees titles, descriptions,
 * canonicals and structured data are present in the initial HTML response.
 */
export async function renderWithMeta(req: Request, res: Response, next: import('express').NextFunction) {
  try {
    const html = await template();
    const url = `${env.SITE_URL.replace(/\/$/, '')}${req.path}`;
    let tags = metaTags({ title: SITE_NAME, description: 'Technology, tools, and the ideas behind them — edited daily.', canonical: url, type: 'website' });
    let jsonLd: unknown[] = [];

    const articleMatch = req.path.match(/^\/articles\/([\w-]+)$/);
    const toolMatch = req.path.match(/^\/tools\/([\w-]+)$/);
    const categoryMatch = req.path.match(/^\/category\/([\w-]+)$/);

    if (articleMatch) {
      const article = await prisma.article.findFirst({
        where: { slug: articleMatch[1], status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: new Date() } },
        include: { seo: true, author: true, category: true, featuredImage: true },
      });
      if (article) {
        const title = article.seo?.title ?? article.title;
        const description = article.seo?.description ?? article.subtitle;
        tags = metaTags({
          title, description, type: 'article',
          image: article.featuredImage?.url,
          canonical: url,
          noindex: article.seo?.noindex,
        });
        jsonLd = [{
          '@context': 'https://schema.org', '@type': 'Article',
          headline: article.title,
          author: { '@type': 'Person', name: article.author.name },
          articleSection: article.category.name,
          ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
          dateModified: article.updatedAt,
          ...(article.featuredImage ? { image: article.featuredImage.url } : {}),
        }];
      }
    } else if (toolMatch) {
      const tool = await prisma.tool.findFirst({ where: { slug: toolMatch[1], enabled: true } });
      if (tool) {
        tags = metaTags({ title: tool.seoTitle ?? tool.name, description: tool.seoDescription ?? tool.description, canonical: url, type: 'website' });
        jsonLd = [{
          '@context': 'https://schema.org', '@type': 'SoftwareApplication',
          name: tool.name, description: tool.description, applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any', url,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }];
      }
    } else if (categoryMatch) {
      const category = await prisma.category.findFirst({ where: { slug: categoryMatch[1] } });
      if (category) {
        tags = metaTags({ title: category.seoTitle ?? category.name, description: category.seoDescription ?? category.description, canonical: url, type: 'website' });
        jsonLd = [{
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: env.SITE_URL },
            { '@type': 'ListItem', position: 2, name: category.name, item: url },
          ],
        }];
      }
    }

    res.type('html').send(inject(html, tags, jsonLd));
  } catch (err) {
    logger.error({ err }, 'renderWithMeta failed');
    next(err);
  }
}
