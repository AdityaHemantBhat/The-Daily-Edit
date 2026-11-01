import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

/**
 * Replaces generated cover graphics with real, freely-licensed photographs
 * from Wikimedia Commons. Every candidate is verified via the Commons API:
 * license must be in the allowlist (CC0 / CC BY / CC BY-SA / Public Domain),
 * attribution (author + license) is stored in the media caption, which the
 * article page renders. If no acceptable image is found for an article, its
 * existing graphic is kept untouched.
 */
const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const UA = 'TheDailyEditEditorial/1.0 (content research; contact via site contact form)';

const ALLOWED_LICENSES = [
  'CC0', 'CC BY 2.0', 'CC BY 2.5', 'CC BY 3.0', 'CC BY 4.0',
  'CC BY-SA 2.0', 'CC BY-SA 3.0', 'CC BY-SA 4.0',
  'Public domain', 'Public Domain',
];

interface CommonsPick {
  title: string;
  url: string;
  license: string;
  artist: string;
  width: number;
  height: number;
  descriptionUrl: string;
}

function stripHtml(value: string | undefined): string {
  if (!value) return 'Unknown author';
  return value.replace(/<[^>]*>/g, '').trim().slice(0, 160) || 'Unknown author';
}

async function searchCommons(term: string): Promise<CommonsPick[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', term);
  url.searchParams.set('gsrnamespace', '6'); // File namespace
  url.searchParams.set('gsrlimit', '12');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|mime|size|extmetadata');
  url.searchParams.set('iiurlwidth', '1200');

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons search failed: ${res.status}`);
  const data = (await res.json()) as {
    query?: {
      pages?: Record<string, {
        title: string;
        imageinfo?: {
          url: string;
          thumburl?: string;
          mime: string;
          width: number;
          height: number;
          extmetadata?: Record<string, { value: string }>;
          descriptionurl?: string;
        }[];
      }>;
    };
  };

  const out: CommonsPick[] = [];
  for (const page of Object.values(data.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (!/^image\/(jpeg|png)$/.test(info.mime)) continue; // real photographs/renders only
    if (info.width < 800) continue;
    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value).replace(/\s+/g, ' ');
    if (!ALLOWED_LICENSES.some((l) => license.toLowerCase() === l.toLowerCase())) continue;
    out.push({
      title: page.title,
      url: info.thumburl ?? info.url,
      license,
      artist: stripHtml(meta.Artist?.value),
      width: info.width,
      height: info.height,
      descriptionUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    });
  }
  return out;
}

/** Per-article search terms, ordered most-specific first. */
const IMAGE_TERMS: { slugPrefix: string; terms: string[]; altTopic: string }[] = [
  // ---- October 2026 news batch ----
  { slugPrefix: 'patch-tuesday-just-broke-its-own-record', terms: ['Microsoft Windows update screen', 'laptop windows update restart'], altTopic: 'A laptop applying a Windows update' },
  { slugPrefix: 'chrome-starts-warning-you-about-http', terms: ['Google Chrome browser window', 'web browser address bar https'], altTopic: 'A web browser address bar' },
  { slugPrefix: 'windows-11s-october-update', terms: ['Windows 11 desktop screen', 'laptop windows desktop'], altTopic: 'A Windows 11 laptop' },
  { slugPrefix: 'crew-13-and-the-quiet-routine', terms: ['SpaceX Falcon 9 launch', 'rocket launch night'], altTopic: 'A rocket launching at night' },
  { slugPrefix: 'gemini-4-carbon-ships-to-cyber-defenders', terms: ['data center corridor blue', 'artificial intelligence data center'], altTopic: 'AI computing infrastructure' },
  { slugPrefix: 'nextjs-and-react-shipped-emergency', terms: ['React code editor screen', 'programming code javascript'], altTopic: 'React code on a developer screen' },
  { slugPrefix: 'chromes-device-bound-sessions', terms: ['padlock browser security', 'computer security padlock'], altTopic: 'Browser security concept' },
  // ---- earlier batch (kept for re-runs) ----
  { slugPrefix: 'nodejs-patches-11-vulnerabilities', terms: ['Node.js programming', 'JavaScript source code screen'], altTopic: 'Programming code on a computer screen' },
  { slugPrefix: 'firefox-158-brings-jpeg-xl', terms: ['Firefox Quantum screenshot', 'Firefox web browser screen'], altTopic: 'The Firefox web browser' },
  { slugPrefix: 'postgresql-19-slips-to-november', terms: ['PostgreSQL database server room', 'database server racks'], altTopic: 'Database servers in a data center' },
  { slugPrefix: 'cisa-confirms-active-exploitation-of-citrix', terms: ['data center network cables', 'network switch data center'], altTopic: 'Network infrastructure in a data center' },
  { slugPrefix: 'the-2026-nobel-prize-in-physics', terms: ['IceCube Neutrino Observatory detector', 'IceCube laboratory South Pole'], altTopic: 'The IceCube neutrino observatory in Antarctica' },
  { slugPrefix: 'gpt-6-rolls-out-to-all-of-chatgpt', terms: ['ChatGPT interface screenshot', 'ChatGPT on screen'], altTopic: 'A ChatGPT session on screen' },
  { slugPrefix: 'how-to-read-a-cve', terms: ['computer security padlock laptop', 'cybersecurity lock screen'], altTopic: 'Computer security concept' },
  { slugPrefix: 'jpeg-xl-vs-webp-vs-avif', terms: ['image editing color histogram screen', 'photograph editing software screen'], altTopic: 'Editing a digital photograph' },
  { slugPrefix: 'the-weekly-review-the-30-minute-habit', terms: ['notebook weekly planning pen', 'planner notebook desk'], altTopic: 'A weekly planning notebook' },
  { slugPrefix: 'reading-stack-traces-like-an-engineer', terms: ['programming code monitor dark', 'software developer screen code'], altTopic: 'Code on a developer screen' },
  // ---- batch 2: how-to guides ----
  { slugPrefix: 'how-to-spot-a-phishing-email', terms: ['fishing lure hook computer', 'email phishing concept fish hook', 'phishing concept'], altTopic: 'The concept of phishing' },
  { slugPrefix: 'wipe-a-laptop-properly-before-selling', terms: ['laptop keyboard clean desk', 'refurbished laptop'], altTopic: 'A clean laptop on a desk' },
  { slugPrefix: 'back-up-your-phone-the-right-way', terms: ['smartphone charging cable data', 'phone connected laptop'], altTopic: 'A phone connected for backup' },
  { slugPrefix: 'take-control-of-windows-privacy-settings', terms: ['privacy policy laptop security', 'data privacy laptop', 'laptop privacy'], altTopic: 'Privacy settings on a screen' },
  { slugPrefix: 'browser-profiles-one-browser-many', terms: ['multiple browser windows', 'web browser tabs screen'], altTopic: 'Multiple browser windows' },
  // ---- batch 2: programming ----
  { slugPrefix: 'typescript-for-javascript-developers', terms: ['TypeScript code editor screen', 'typescript programming code'], altTopic: 'TypeScript code in an editor' },
  { slugPrefix: 'css-grid-vs-flexbox', terms: ['CSS code screen', 'web design code editor'], altTopic: 'CSS code in an editor' },
  { slugPrefix: 'why-your-database-query-is-slow', terms: ['database server room', 'SQL query screen'], altTopic: 'A database server room' },
  { slugPrefix: 'rest-api-design-naming-status-codes', terms: ['api code screen', 'software code json'], altTopic: 'API code on a screen' },
  { slugPrefix: 'the-testing-pyramid-explained-without-jargon', terms: ['software testing laptop', 'quality assurance testing computer', 'unit test code screen'], altTopic: 'Software testing in progress' },
  // ---- batch 2: productivity ----
  { slugPrefix: 'deep-work-what-it-is-and-how', terms: ['focused work headphones laptop', 'person working laptop cafe'], altTopic: 'Focused work at a laptop' },
  { slugPrefix: 'batch-your-email-three-times', terms: ['email inbox screen laptop', 'email on computer screen'], altTopic: 'An email inbox on a screen' },
  { slugPrefix: 'keyboard-shortcuts-the-twelve-that-pay', terms: ['mechanical keyboard closeup', 'computer keyboard keys closeup'], altTopic: 'A keyboard close-up' },
  { slugPrefix: 'calendar-hygiene-rules-for-a-saner-week', terms: ['appointment calendar', 'schedule planner writing', 'personal organizer'], altTopic: 'A calendar and planner' },
  { slugPrefix: 'meetings-that-dont-waste-everyones-time', terms: ['conference room meeting table', 'business meeting room'], altTopic: 'A meeting room' },
  // ---- batch 2: digital tools ----
  { slugPrefix: 'note-taking-apps-compared', terms: ['notebook writing notes pen', 'notes on phone screen'], altTopic: 'Notes and a notebook' },
  { slugPrefix: 'choosing-cloud-storage-the-five-questions', terms: ['cloud storage servers', 'cloud computing racks'], altTopic: 'Cloud storage infrastructure' },
  { slugPrefix: 'the-case-for-local-first-software', terms: ['laptop offline coffee shop', 'person laptop no wifi'], altTopic: 'Working offline on a laptop' },
  // ---- batch 2: internet ----
  { slugPrefix: 'what-cookies-actually-are', terms: ['chocolate chip cookies baking', 'cookies on plate'], altTopic: 'A cookie consent banner' },
  { slugPrefix: 'vpns-what-they-protect-you-from', terms: ['vpn security shield laptop', 'vpn network security'], altTopic: 'VPN security concept' },
  { slugPrefix: 'how-https-actually-keeps-you-safe', terms: ['https padlock address bar', 'browser padlock secure'], altTopic: 'The HTTPS padlock in a browser' },
  // ---- batch 2: technology + AI ----
  { slugPrefix: 'how-ssds-work-and-why-they-sometimes', terms: ['SSD solid state drive', 'm.2 SSD drive'], altTopic: 'A solid-state drive' },
  { slugPrefix: 'cores-threads-and-clock-speeds', terms: ['CPU processor closeup', 'computer processor motherboard'], altTopic: 'A computer processor close-up' },
  { slugPrefix: 'oled-vs-lcd-every-screen-difference', terms: ['OLED display screen dark', 'television screen technology'], altTopic: 'A modern display screen' },
  { slugPrefix: 'what-fine-tuning-actually-means', terms: ['machine learning code screen', 'neural network visualization'], altTopic: 'Machine learning code on a screen' },
  { slugPrefix: 'why-ai-models-hallucinate', terms: ['abstract neural network light', 'digital brain artificial intelligence', 'machine learning abstract'], altTopic: 'An abstract AI concept' },
];

// Only process slugs passed on the command line (if any), so re-runs are targeted.
const ONLY = process.argv.slice(2);

function slugifyLocal(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 96);
}

async function main() {
  console.log('Attaching real, freely-licensed Wikimedia Commons images to articles…\n');
  const articles = await prisma.article.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, slug: true, imageCaption: true },
  });
  const admin = await prisma.user.findFirstOrThrow({ where: { role: { name: 'ADMIN' } } });

  for (const article of articles) {
    if (ONLY.length && !ONLY.some((slug) => article.slug.startsWith(slug))) continue;
    const plan = IMAGE_TERMS.find((t) => article.slug.startsWith(t.slugPrefix));
    if (!plan) {
      console.log(`  ? no image plan for ${article.slug} — left untouched`);
      continue;
    }
    // Skip articles that already carry a Commons image unless forced via CLI.
    const alreadyCommons = article.imageCaption?.includes('Wikimedia Commons');
    if (alreadyCommons && !ONLY.length) {
      console.log(`  = already has a Commons image: ${article.slug}`);
      continue;
    }

    let pick: CommonsPick | null = null;
    for (const term of plan.terms) {
      const results = await searchCommons(term);
      if (results.length) {
        pick = results[0];
        break;
      }
    }
    if (!pick) {
      console.log(`  ! no licensed image found for ${article.slug} — keeping existing graphic`);
      continue;
    }

    // Download into uploads/
    const ext = /\.png(\?|$)/i.test(pick.url) ? '.png' : '.jpg';
    const res = await fetch(pick.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.log(`  ! download failed (${res.status}) for ${article.slug} — keeping existing graphic`);
      continue;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `commons-${Date.now()}-${slugifyLocal(pick.title).slice(0, 60)}${ext}`;
    fs.mkdirSync(path.resolve(UPLOAD_DIR), { recursive: true });
    fs.writeFileSync(path.resolve(UPLOAD_DIR, filename), buffer);

    const attribution = `Photo: ${pick.artist} — ${pick.license}, via Wikimedia Commons`;
    const media = await prisma.media.create({
      data: {
        filename,
        originalName: pick.title,
        mimeType: ext === '.png' ? 'image/png' : 'image/jpeg',
        size: buffer.length,
        width: pick.width,
        height: pick.height,
        altText: `${plan.altTopic} — photo used with license ${pick.license}`,
        caption: attribution,
        url: `/media/${filename}`,
        folder: 'IMAGES',
        uploadedById: admin.id,
      },
    });

    await prisma.article.update({
      where: { id: article.id },
      data: {
        featuredImageId: media.id,
        imageAlt: `${plan.altTopic} — photo: ${pick.artist}, ${pick.license}, via Wikimedia Commons`,
        imageCaption: attribution,
      },
    });

    console.log(`  + ${article.slug}\n      ${pick.license} | ${pick.artist.slice(0, 60)} | ${pick.title}`);
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

