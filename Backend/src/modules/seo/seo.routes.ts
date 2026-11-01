import { Router } from 'express';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { escapeXml } from '../../shared/security/sanitize.js';
import { env } from '../../config/env.js';

const router = Router();

function siteUrl(pathname = ''): string {
  return `${env.SITE_URL.replace(/\/$/, '')}${pathname}`;
}

router.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const [categories, tools, articles] = await Promise.all([
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.tool.findMany({ where: { enabled: true }, select: { slug: true, updatedAt: true } }),
      prisma.article.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: new Date() } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
      }),
    ]);

    const staticPages = ['', '/tools', '/about', '/contact', '/privacy-policy', '/terms', '/disclaimer', '/editorial-policy', '/cookie-policy']
      .map((p) => ({ loc: siteUrl(p), lastmod: new Date().toISOString(), priority: p === '' ? '1.0' : '0.6', changefreq: p === '' ? 'daily' : 'monthly' }));

    const urls = [
      ...staticPages,
      ...articles.map((a) => ({ loc: siteUrl(`/articles/${a.slug}`), lastmod: a.updatedAt.toISOString(), priority: '0.8', changefreq: 'weekly' })),
      ...categories.map((c) => ({ loc: siteUrl(`/category/${c.slug}`), lastmod: c.updatedAt.toISOString(), priority: '0.5', changefreq: 'weekly' })),
      ...tools.map((t) => ({ loc: siteUrl(`/tools/${t.slug}`), lastmod: t.updatedAt.toISOString(), priority: '0.7', changefreq: 'monthly' })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml').send(xml);
  }),
);

router.get(
  '/robots.txt',
  asyncHandler(async (_req, res) => {
    const site = await prisma.siteSetting.findUnique({ where: { key: 'site' } });
    const adminPath = ((site?.value as { adminPath?: string } | null)?.adminPath ?? '/admin').replace(/\/+$/, '');
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        `Disallow: ${adminPath}`,
        'Disallow: /api',
        '',
        `Sitemap: ${siteUrl('/api/seo/sitemap.xml')}`,
        '',
      ].join('\n'),
    );
  }),
);

router.get(
  '/ads.txt',
  asyncHandler(async (_req, res) => {
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'adsense' } });
    const publisherId = (setting?.value as { publisherId?: string } | null)?.publisherId;

    res.type('text/plain');
    // Only serve a real ads.txt record once a verified publisher ID is configured.
    if (publisherId && /^ca-pub-\d+$/.test(publisherId)) {
      res.send(`google.com, ${publisherId.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);
    } else {
      res.send('# ads.txt will be published here once a valid Google AdSense publisher ID is configured in the admin panel.\n');
    }
  }),
);

export default router;
