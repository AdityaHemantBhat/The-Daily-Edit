/* One-shot data migration: local PostgreSQL -> Supabase.
 * Reads every table from the local DB and createMany's into the target
 * (DATABASE_URL from .env) in FK-safe order. Idempotent-ish: wipes target
 * tables in reverse order first. Run: node prisma/migrate-data-to-supabase.js
 */
const { PrismaClient } = require('@prisma/client');

const LOCAL_URL = 'postgresql://postgres:postgres@localhost:5432/thedailyedit';
const local = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
const target = new PrismaClient();

const TABLES = [
  'role', 'user', 'session', 'category', 'tag', 'author',
  'toolCategory', 'tool', 'media', 'article', 'articleRevision', 'articleTag',
  'seoSetting', 'toolUsage', 'advertisementPlacement',
  'advertisement', 'siteSetting', 'articleView', 'newsletterSubscriber',
  'comment', 'contactMessage', 'redirect', 'auditLog',
];

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function reviveDates(value) {
  if (value instanceof Date || value === null || typeof value !== 'object') {
    return value instanceof Date ? value : value;
  }
  if (Array.isArray(value)) return value.map(reviveDates);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = typeof v === 'string' && ISO_RE.test(v) ? new Date(v) : reviveDates(v);
  }
  return out;
}

(async () => {
  // Wipe target in reverse FK order so a re-run starts clean.
  for (const t of [...TABLES].reverse()) {
    const n = await target[t].deleteMany();
    if (n.count) console.log(`wiped ${n.count} rows from ${t}`);
  }

  for (const t of TABLES) {
    const rows = await local[t].findMany();
    if (!rows.length) { console.log(`${t}: 0 rows, skipped`); continue; }
    const data = reviveDates(rows);
    for (let i = 0; i < data.length; i += 200) {
      await target[t].createMany({ data: data.slice(i, i + 200) });
    }
    console.log(`${t}: ${rows.length} rows migrated`);
  }

  const [a, m, s, u, v] = await Promise.all([
    target.article.count(), target.media.count(), target.siteSetting.count(),
    target.user.count(), target.articleView.count(),
  ]);
  console.log(`VERIFY Supabase -> articles: ${a} | media: ${m} | settings: ${s} | users: ${u} | views: ${v}`);
  await local.$disconnect();
  await target.$disconnect();
})().catch((e) => { console.error('MIGRATION FAILED:', e.message); process.exit(1); });
