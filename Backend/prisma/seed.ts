import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Infrastructure seed — safe to re-run at any time.
 *
 * Creates only the operational scaffolding the site needs: roles, the bootstrap
 * admin, content categories, the tool catalog, ad placements and default site
 * settings. It contains NO demo articles, authors, traffic or engagement data;
 * editorial content is populated separately (see prisma/populate-content.ts)
 * and always lands as DRAFT for human review.
 */
const prisma = new PrismaClient();

const env = {
  adminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@thedailyedit.local',
  adminUsername: process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'ChangeMe!2026',
};

function slugify(text: string): string {
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

const CATEGORIES = [
  { name: 'Artificial Intelligence', description: 'How AI systems work, what they change, and how to use them well.' },
  { name: 'Technology', description: 'Hardware, platforms and the industry moves that matter.' },
  { name: 'Internet', description: 'The web, connectivity, and online culture explained.' },
  { name: 'Software', description: 'Applications, operating systems and everything in between.' },
  { name: 'Productivity', description: 'Workflows, methods and habits that get real work done.' },
  { name: 'Programming', description: 'Code, tooling and engineering practice.' },
  { name: 'How-To Guides', description: 'Step-by-step instructions for everyday tech problems.' },
  { name: 'Digital Tools', description: 'Reviews and deep dives on the tools worth your time.' },
  { name: 'Science & Innovation', description: 'Research and breakthroughs, translated for everyone.' },
  { name: 'Security & Privacy', description: 'Staying safe and private in a connected world.' },
];

const TOOL_CATEGORIES: { name: string; tools: { name: string; componentKey: string; description: string }[] }[] = [
  {
    name: 'Image Tools',
    tools: [
      { name: 'Image Compressor', componentKey: 'image-compressor', description: 'Reduce image file size with adjustable quality — processed entirely in your browser.' },
      { name: 'Image Resizer', componentKey: 'image-resizer', description: 'Resize images to exact pixel dimensions or percentages.' },
      { name: 'Image Cropper', componentKey: 'image-cropper', description: 'Crop images to the region you need with a live preview.' },
      { name: 'Image Converter', componentKey: 'image-converter', description: 'Convert between PNG, JPEG and WebP formats.' },
      { name: 'Image to PDF', componentKey: 'image-to-pdf', description: 'Combine multiple images into a single PDF document.' },
      { name: 'Image Color Picker', componentKey: 'image-color-picker', description: 'Pick and extract colors from any image.' },
      { name: 'Base64 Image Encoder', componentKey: 'base64-image', description: 'Encode images to Base64 data URLs or decode them back.' },
    ],
  },
  {
    name: 'PDF Tools',
    tools: [
      { name: 'Merge PDF', componentKey: 'merge-pdf', description: 'Combine several PDF files into one document.' },
      { name: 'Split PDF', componentKey: 'split-pdf', description: 'Extract page ranges from a PDF into a new file.' },
      { name: 'Compress PDF', componentKey: 'compress-pdf', description: 'Shrink PDF file size by re-encoding embedded images.' },
      { name: 'PDF to Images', componentKey: 'pdf-to-images', description: 'Render PDF pages as PNG images.' },
      { name: 'Images to PDF', componentKey: 'images-to-pdf', description: 'Turn a set of images into a paginated PDF.' },
    ],
  },
  {
    name: 'Text & Developer Tools',
    tools: [
      { name: 'Word Counter', componentKey: 'word-counter', description: 'Count words, characters, sentences and estimated reading time.' },
      { name: 'Character Counter', componentKey: 'character-counter', description: 'Live character count with platform limits.' },
      { name: 'JSON Formatter', componentKey: 'json-formatter', description: 'Pretty-print or minify JSON with syntax highlighting.' },
      { name: 'JSON Validator', componentKey: 'json-validator', description: 'Validate JSON and pinpoint the exact error location.' },
      { name: 'Base64 Encoder/Decoder', componentKey: 'base64-text', description: 'Encode or decode text as Base64.' },
      { name: 'URL Encoder/Decoder', componentKey: 'url-encoder', description: 'Percent-encode or decode URLs and query strings.' },
      { name: 'HTML Formatter', componentKey: 'html-formatter', description: 'Re-indent messy HTML into readable structure.' },
      { name: 'CSS Formatter', componentKey: 'css-formatter', description: 'Beautify or minify CSS stylesheets.' },
      { name: 'JavaScript Formatter', componentKey: 'js-formatter', description: 'Re-indent and tidy JavaScript code.' },
      { name: 'Markdown Previewer', componentKey: 'markdown-previewer', description: 'Write markdown and see a sanitized live preview.' },
      { name: 'Lorem Ipsum Generator', componentKey: 'lorem-ipsum', description: 'Generate placeholder paragraphs, sentences or words.' },
    ],
  },
  {
    name: 'Productivity Tools',
    tools: [
      { name: 'QR Code Generator', componentKey: 'qr-generator', description: 'Create QR codes for URLs, text, Wi-Fi and more.' },
      { name: 'Password Generator', componentKey: 'password-generator', description: 'Generate strong random passwords with configurable rules.' },
      { name: 'UUID Generator', componentKey: 'uuid-generator', description: 'Generate one or many RFC 4122 v4 UUIDs.' },
      { name: 'Case Converter', componentKey: 'case-converter', description: 'Convert text between UPPER, lower, Title, camelCase and more.' },
      { name: 'Reading Time Calculator', componentKey: 'reading-time', description: 'Estimate reading time from word count or pasted text.' },
      { name: 'Percentage Calculator', componentKey: 'percentage-calculator', description: 'Solve the three common percentage problems.' },
      { name: 'Age Calculator', componentKey: 'age-calculator', description: 'Calculate exact age in years, months and days.' },
      { name: 'Date Calculator', componentKey: 'date-calculator', description: 'Add or subtract days from a date, or find the difference.' },
      { name: 'Unit Converter', componentKey: 'unit-converter', description: 'Convert length, weight, temperature, volume and data.' },
    ],
  },
];

async function main() {
  console.log('Seeding The Daily Edit infrastructure…');

  // ---- Roles & bootstrap admin ----
  const ADMIN_PERMISSIONS = ['*'];
  const EDITOR_PERMISSIONS = ['articles:write', 'categories:write', 'media:write', 'comments:write', 'dashboard:view'];

  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { permissions: ADMIN_PERMISSIONS },
    create: { name: 'ADMIN', description: 'Full access to every module', permissions: ADMIN_PERMISSIONS },
  });
  await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: { permissions: EDITOR_PERMISSIONS },
    create: { name: 'EDITOR', description: 'Can manage content but not users or settings', permissions: EDITOR_PERMISSIONS },
  });

  const existingAdmin = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: env.adminEmail.toLowerCase(),
        username: env.adminUsername,
        name: 'Site Administrator',
        passwordHash: await bcrypt.hash(env.adminPassword, 12),
        roleId: (await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } })).id,
      },
    });
    console.log(`✓ Bootstrap admin created (${env.adminEmail}) — change this password after first login.`);
  }

  // ---- Content categories ----
  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description, order: i },
      create: { name: c.name, slug: slugify(c.name), description: c.description, order: i },
    });
  }

  // ---- Tool catalog ----
  for (const [i, tc] of TOOL_CATEGORIES.entries()) {
    const toolCategory = await prisma.toolCategory.upsert({
      where: { name: tc.name },
      update: { order: i },
      create: { name: tc.name, slug: slugify(tc.name), order: i },
    });
    for (const [j, t] of tc.tools.entries()) {
      await prisma.tool.upsert({
        where: { slug: slugify(t.name) },
        update: { description: t.description, componentKey: t.componentKey, categoryId: toolCategory.id, order: j },
        create: {
          name: t.name,
          slug: slugify(t.name),
          description: t.description,
          componentKey: t.componentKey,
          categoryId: toolCategory.id,
          order: j,
          featured: j === 0,
          faqs: [
            { question: `Is ${t.name} free to use?`, answer: 'Yes — this tool is free, requires no account, and runs in your browser.' },
            { question: 'Is my data uploaded to a server?', answer: 'No. Processing happens locally in your browser unless explicitly stated otherwise.' },
          ],
        },
      });
    }
  }

  // ---- Ad placements ----
  const placements = [
    ['home_top', 'Homepage top', 'Below the masthead'],
    ['home_mid', 'Homepage mid-content', 'Between homepage sections'],
    ['article_top', 'Article top', 'Above article content'],
    ['article_mid', 'Article in-content', 'After the second content block'],
    ['article_bottom', 'Article bottom', 'After article content'],
    ['sidebar', 'Sidebar', 'Desktop sidebar on article pages'],
    ['tools_page', 'Tools page', 'Tools directory top'],
    ['tool_page', 'Tool page', 'Individual tool pages'],
  ];
  for (const [key, label, description] of placements) {
    await prisma.advertisementPlacement.upsert({
      where: { key },
      update: { label, description },
      create: { key, label, description },
    });
  }

  // ---- Site settings ----
  const defaults: { key: string; value: unknown }[] = [
    {
      key: 'site',
      value: {
        name: 'The Daily Edit',
        tagline: 'Technology, tools, and the ideas behind them — edited daily.',
        logoUrl: null,
        faviconUrl: null,
        contactEmail: null,
        adminPath: '/admin',
        social: { twitter: '', github: '', linkedin: '', youtube: '' },
      },
    },
    {
      key: 'announcement',
      value: {
        enabled: true,
        text: 'Welcome to The Daily Edit — new tools and stories every week.',
        linkUrl: '/tools',
        linkText: 'Explore tools',
      },
    },
    { key: 'newsletter', value: { enabled: true, heading: 'The Edit, in your inbox', body: 'One thoughtful email each week: the best stories, new tools, and nothing else.' } },
    { key: 'homeSections', value: { showTrending: true, showTools: true, showEditorsPicks: true, showRecentlyUpdated: true } },
    { key: 'adsense', value: { publisherId: null, enabled: false } },
    {
      key: 'legal',
      value: {}, // Full legal texts are installed by `npx tsx prisma/update-legal.ts` (kept out of the seed so operator edits are never overwritten).
    },
  ];
  for (const d of defaults) {
    // Empty update: existing settings (including the operator's customizations) are never overwritten.
    await prisma.siteSetting.upsert({
      where: { key: d.key },
      update: {},
      create: { key: d.key, value: d.value as never },
    });
  }

  console.log('✓ Infrastructure seed complete (no demo editorial content).');
  console.log(`  Categories: ${await prisma.category.count()} | Tools: ${await prisma.tool.count()} | Articles: ${await prisma.article.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
