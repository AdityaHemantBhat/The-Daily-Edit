import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { newsA } from './content/news-a.js';
import { newsB } from './content/news-b.js';
import { newsD } from './content/news-d.js';
import { evergreenA } from './content/evergreen-a.js';
import { evergreenB } from './content/evergreen-b.js';
import { evergreenC } from './content/evergreen-c.js';
import { evergreenE } from './content/evergreen-d.js';
import { evergreenF } from './content/evergreen-f.js';
import type { SeedArticle } from './content/types.js';

/**
 * Editorial content population — inserts researched articles as DRAFTS.
 *
 * - Idempotent: keyed by slug; re-running never duplicates.
 * - Every article arrives with status DRAFT for human editorial review.
 * - Featured images are ORIGINAL editorial graphics generated locally (SVG),
 *   so no third-party image licensing is involved. Source URLs are cited
 *   inside each article's "Sources" section.
 * - The byline is the editorial desk ("The Editors") — honest attribution for
 *   staff-produced content. Individual reporters can be reassigned in the CMS.
 */
const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';

// Run with --publish to insert directly as PUBLISHED (operator-authorized
// batches); default remains DRAFT for human review.
// Env-var switch (tsx swallows --publish style flags): PUBLISH=1 npx tsx …
const PUBLISH = process.env.PUBLISH === '1' || process.argv.includes('--publish');

const ARTICLES: SeedArticle[] = [
  ...newsA, ...newsB, ...newsD,
  ...evergreenA, ...evergreenB, ...evergreenC, ...evergreenE, ...evergreenF,
];

// ---------------------------------------------------------------------------
// Original cover graphic generator (no third-party imagery, no licensing risk)
// ---------------------------------------------------------------------------

const PALETTES = [
  { bg: '#1c1917', accent: '#a16207', text: '#fafaf9', sub: '#d6d3d1', shape: '#292524' },
  { bg: '#0c4a6e', accent: '#fbbf24', text: '#f0f9ff', sub: '#bae6fd', shape: '#075985' },
  { bg: '#14532d', accent: '#fde68a', text: '#f0fdf4', sub: '#bbf7d0', shape: '#166534' },
  { bg: '#4c1d95', accent: '#fbbf24', text: '#f5f3ff', sub: '#ddd6fe', shape: '#5b21b6' },
  { bg: '#7c2d12', accent: '#fde68a', text: '#fff7ed', sub: '#fed7aa', shape: '#9a3412' },
  { bg: '#fafaf9', accent: '#a16207', text: '#1c1917', sub: '#57534e', shape: '#e7e5e4' },
];

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapTitle(title: string, maxChars = 20): string[] {
  const words = title.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function generateCover(title: string, category: string, variant: number): { filename: string; svg: string; width: number; height: number } {
  const p = PALETTES[variant % PALETTES.length];
  const W = 1200;
  const H = 675;
  const lines = wrapTitle(title);
  const fontSize = lines.length >= 4 ? 62 : lines.length === 3 ? 72 : 84;
  const startY = H / 2 - ((lines.length - 1) * fontSize * 1.1) / 2 + fontSize * 0.35;

  const shapes: string[] = [];
  const v = variant % 6;
  if (v === 0) {
    shapes.push(`<circle cx="${W - 180}" cy="140" r="220" fill="${p.shape}"/>`);
    shapes.push(`<circle cx="${W - 180}" cy="140" r="130" fill="none" stroke="${p.accent}" stroke-width="3"/>`);
  } else if (v === 1) {
    for (let i = 0; i < 7; i++) shapes.push(`<rect x="${W - 420 + i * 56}" y="0" width="26" height="${H}" fill="${p.shape}" opacity="${0.4 + i * 0.08}"/>`);
  } else if (v === 2) {
    shapes.push(`<rect x="0" y="${H - 190}" width="${W}" height="190" fill="${p.shape}"/>`);
    shapes.push(`<path d="M0 ${H - 190} L${W} ${H} L0 ${H} Z" fill="${p.accent}" opacity="0.25"/>`);
  } else if (v === 3) {
    for (let i = 0; i < 5; i++) shapes.push(`<circle cx="${180 + i * 210}" cy="${H - 90}" r="${34 + i * 14}" fill="none" stroke="${p.accent}" stroke-width="2.5" opacity="0.7"/>`);
  } else if (v === 4) {
    shapes.push(`<rect x="${W - 320}" y="80" width="240" height="240" fill="${p.accent}" opacity="0.9" transform="rotate(12 ${W - 200} 200)"/>`);
    shapes.push(`<rect x="${W - 380}" y="40" width="240" height="240" fill="none" stroke="${p.text}" stroke-width="2"/>`);
  } else {
    shapes.push(`<path d="M${W} 0 L${W} 340 L${W - 340} 0 Z" fill="${p.shape}"/>`);
    shapes.push(`<path d="M${W} 80 L${W} 240 L${W - 160} 80 Z" fill="${p.accent}" opacity="0.85"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  ${shapes.join('\n  ')}
  <rect x="48" y="48" width="14" height="52" fill="${p.accent}"/>
  <text x="76" y="86" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="bold" letter-spacing="6" fill="${p.text}">THE DAILY EDIT</text>
  <text x="76" y="130" font-family="Verdana, sans-serif" font-size="15" font-weight="bold" letter-spacing="4" fill="${p.accent}">${escapeXml(category.toUpperCase())}</text>
  ${lines
    .map(
      (line, i) =>
        `<text x="76" y="${Math.round(startY + i * fontSize * 1.1)}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="bold" fill="${p.text}">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  <line x1="76" y1="${H - 60}" x2="${76 + 220}" y2="${H - 60}" stroke="${p.accent}" stroke-width="4"/>
  <text x="76" y="${H - 34}" font-family="Verdana, sans-serif" font-size="14" letter-spacing="3" fill="${p.sub}">thedailyedit · digital publication</text>
</svg>`;

  return { filename: `cover-${slugifyLocal(title)}.svg`, svg, width: W, height: H };
}

function slugifyLocal(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96);
}

async function ensureCover(title: string, category: string, variant: number, uploadedById: string): Promise<string> {
  const { filename, svg, width, height } = generateCover(title, category, variant);
  const dir = path.resolve(UPLOAD_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), svg, 'utf8');

  const existing = await prisma.media.findFirst({ where: { filename, deletedAt: null } });
  if (existing) return existing.id;

  const media = await prisma.media.create({
    data: {
      filename,
      originalName: filename,
      mimeType: 'image/svg+xml',
      size: Buffer.byteLength(svg, 'utf8'),
      width,
      height,
      altText: `${title} — original editorial cover graphic by The Daily Edit`,
      caption: 'Original editorial graphic by The Daily Edit design desk.',
      url: `/media/${filename}`,
      folder: 'IMAGES',
      uploadedById,
    },
  });
  return media.id;
}

async function main() {
  console.log('Populating The Daily Edit with researched editorial content (all as DRAFTS)…\n');

  const admin = await prisma.user.findFirstOrThrow({ where: { role: { name: 'ADMIN' } } });

  // Desk byline — honest attribution for staff-produced editorial content.
  const author = await prisma.author.upsert({
    where: { slug: 'the-editors' },
    update: {},
    create: {
      name: 'The Editors',
      slug: 'the-editors',
      jobTitle: 'Editorial Desk',
      bio: 'Reported, written and fact-checked by The Daily Edit editorial desk. Every piece is reviewed by a human editor before publication.',
    },
  });

  const categories = await prisma.category.findMany();
  const catByName = new Map(categories.map((c) => [c.name, c]));

  let created = 0;
  let skipped = 0;
  const results: { title: string; slug: string; id: string; category: string; status: string }[] = [];

  for (const [index, a] of ARTICLES.entries()) {
    const slug = slugifyLocal(a.title);
    const exists = await prisma.article.findUnique({ where: { slug } });
    if (exists) {
      console.log(`  = skipped (exists): ${slug}`);
      skipped++;
      continue;
    }

    const cat = catByName.get(a.category);
    if (!cat) throw new Error(`Category not found: ${a.category}`);

    const plain = a.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const coverId = await ensureCover(a.title, a.category, index, admin.id);

    const tagIds: string[] = [];
    for (const t of a.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: t },
        update: {},
        create: { name: t, slug: slugifyLocal(t) },
      });
      tagIds.push(tag.id);
    }

    const article = await prisma.article.create({
      data: {
        title: a.title,
        subtitle: a.subtitle,
        slug,
        content: a.content,
        plainText: plain,
        status: PUBLISH ? 'PUBLISHED' : 'DRAFT', // DRAFT unless an explicit --publish batch is authorized by the operator.
        publishedAt: PUBLISH ? new Date(Date.now() - 60_000 * (ARTICLES.length - index)) : null,
        readingMinutes: Math.max(2, Math.round(plain.split(/\s+/).length / 200)),
        categoryId: cat.id,
        authorId: author.id,
        featuredImageId: coverId,
        imageAlt: `${a.title} — original editorial cover graphic`,
        imageCaption: 'Original editorial graphic by The Daily Edit design desk.',
        seo: {
          create: {
            title: a.title.slice(0, 60),
            description: a.seoDescription.slice(0, 155),
          },
        },
        revisions: {
          create: { title: a.title, content: a.content, createdBy: admin.id },
        },
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });

    created++;
    results.push({ title: a.title, slug, id: article.id, category: a.category, status: article.status });
    console.log(`  + created (DRAFT): ${slug}`);
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already present).`);
  for (const r of results) console.log(`  ${r.id} | ${r.slug} | ${r.category} | ${r.status}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
