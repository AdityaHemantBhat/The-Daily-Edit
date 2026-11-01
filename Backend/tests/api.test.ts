import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/shared/database/prisma.js';
import { slugify, readingMinutes, visitorHash } from '../src/shared/utils/text.js';
import { sanitizeArticleHtml } from '../src/shared/security/sanitize.js';

const app = createApp();

test('slugify produces kebab-case slugs', () => {
  assert.equal(slugify('How Search Engines Actually Work — in 2026!'), 'how-search-engines-actually-work-in-2026');
  assert.equal(slugify('  multiple   spaces  '), 'multiple-spaces');
  assert.equal(slugify(''), '');
});

test('readingMinutes is at least 1', () => {
  assert.equal(readingMinutes('short'), 1);
  assert.equal(readingMinutes('word '.repeat(1000)), 5);
});

test('visitorHash is stable and salted', () => {
  assert.equal(visitorHash('1.2.3.4', 'agent', 'salt'), visitorHash('1.2.3.4', 'agent', 'salt'));
  assert.notEqual(visitorHash('1.2.3.4', 'agent', 'salt'), visitorHash('1.2.3.4', 'agent', 'other'));
});

test('sanitizeArticleHtml strips scripts and event handlers', () => {
  const dirty = '<p onclick="steal()">ok</p><script>alert(1)</script><a href="javascript:evil()">x</a>';
  const clean = sanitizeArticleHtml(dirty);
  assert.ok(!clean.includes('script'));
  assert.ok(!clean.includes('onclick'));
  assert.ok(!clean.includes('javascript:'));
  assert.ok(clean.includes('<p>ok</p>'));
});

test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('GET /api/articles returns published articles', async () => {
  const res = await request(app).get('/api/articles?perPage=5');
  assert.equal(res.status, 200);
  assert.ok(res.body.items.every((a: { status: string }) => a.status === 'PUBLISHED'));
});

test('GET /api/articles/home-sections includes featured and latest', async () => {
  const res = await request(app).get('/api/articles/home-sections');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.latest));
});

test('public article fetch returns category, author and related', async () => {
  const list = await request(app).get('/api/articles?perPage=1');
  assert.ok(list.body.items.length >= 1, 'fixture article must exist');
  const slug = list.body.items[0].slug;
  const res = await request(app).get(`/api/articles/${slug}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.category.name);
  assert.ok(res.body.author.name);
  assert.ok(Array.isArray(res.body.related));
});

test('admin routes reject unauthenticated requests', async () => {
  const res = await request(app).get('/api/users');
  assert.equal(res.status, 401);
});

test('article creation requires validation fields', async () => {
  const login = await request(app).post('/api/auth/login')
    .send({ identifier: 'admin', password: 'ChangeMe!2026' });
  const cookie = login.headers['set-cookie'];
  const res = await request(app).post('/api/articles')
    .set('Cookie', cookie)
    .send({ title: 'x' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('full editorial flow: login → create draft → publish → public → delete', async () => {
  const login = await request(app).post('/api/auth/login')
    .send({ identifier: 'admin', password: 'ChangeMe!2026' });
  assert.equal(login.status, 200);
  const cookie = login.headers['set-cookie'];

  const category = (await request(app).get('/api/categories')).body.items[0];
  const authorId = fixture.authorId ?? (await request(app).get('/api/authors')).body.items[0]?.id;

  const create = await request(app).post('/api/articles')
    .set('Cookie', cookie)
    .send({
      title: 'Integration Test Article',
      content: '<h2>Body</h2><p>Content for the integration test article.</p>',
      status: 'DRAFT',
      categoryId: category.id,
      authorId: authorId,
    });
  assert.equal(create.status, 201);
  const { id, slug } = create.body;

  // Draft is not publicly visible
  const draftView = await request(app).get(`/api/articles/${slug}`);
  assert.equal(draftView.status, 404);

  const publish = await request(app).patch(`/api/articles/${id}`)
    .set('Cookie', cookie)
    .send({ status: 'PUBLISHED', seo: { title: 'Integration Test', description: 'meta' } });
  assert.equal(publish.status, 200);
  assert.equal(publish.body.status, 'PUBLISHED');
  assert.equal(publish.body.seo.title, 'Integration Test');

  const publicView = await request(app).get(`/api/articles/${slug}`);
  assert.equal(publicView.status, 200);

  const view = await request(app).post(`/api/articles/${slug}/view`);
  assert.equal(view.status, 200);

  const del = await request(app).delete(`/api/articles/${id}`).set('Cookie', cookie);
  assert.equal(del.status, 200);

  const afterDelete = await request(app).get(`/api/articles/${slug}`);
  assert.equal(afterDelete.status, 404);

  // The API soft-deletes (archives); hard-remove the test artifact.
  await prisma.article.delete({ where: { id } }).catch(() => undefined);
});

test('tools directory lists seeded tools with categories', async () => {
  const res = await request(app).get('/api/tools');
  assert.equal(res.status, 200);
  assert.ok(res.body.items.length >= 30);
  assert.ok(res.body.items.every((t: { category: { name: string } }) => !!t.category.name));
});

test('sitemap, robots and ads.txt respond correctly', async () => {
  const sitemap = await request(app).get('/api/seo/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.ok(sitemap.text.includes('<urlset'));

  const robots = await request(app).get('/api/seo/robots.txt');
  assert.equal(robots.status, 200);
  assert.ok(robots.text.includes('Disallow: /admin'));

  const ads = await request(app).get('/api/seo/ads.txt');
  assert.equal(ads.status, 200);
  assert.ok(!ads.text.includes('google.com,'), 'ads.txt must stay empty without a configured publisher ID');
});

test('newsletter subscribe accepts and normalizes input', async () => {
  const res = await request(app).post('/api/newsletter/subscribe')
    .send({ email: 'Test.Subscriber@Example.COM', consent: true });
  assert.equal(res.status, 200);
  const consentless = await request(app).post('/api/newsletter/subscribe')
    .send({ email: 'no-consent@example.com', consent: false });
  assert.equal(consentless.status, 400);
});

test('contact form stores messages for the admin inbox', async () => {
  const send = await request(app).post('/api/contact')
    .send({ name: 'Test Visitor', email: 'visitor@example.com', subject: 'Hello', message: 'A message from the automated test suite.' });
  assert.equal(send.status, 201);

  const invalid = await request(app).post('/api/contact')
    .send({ name: 'x', email: 'not-an-email', subject: '', message: 'short' });
  assert.equal(invalid.status, 400);

  // Unauthenticated inbox access is blocked.
  const list = await request(app).get('/api/contact');
  assert.equal(list.status, 401);

  // Authenticated admins can read and manage the inbox.
  const login = await request(app).post('/api/auth/login')
    .send({ identifier: 'admin', password: 'ChangeMe!2026' });
  const cookie = login.headers['set-cookie'];

  const inbox = await request(app).get('/api/contact').set('Cookie', cookie);
  assert.equal(inbox.status, 200);
  const stored = inbox.body.items.find((m: { email: string }) => m.email === 'visitor@example.com');
  assert.ok(stored, 'submitted message should appear in the inbox');
  assert.equal(stored.status, 'NEW');

  const markRead = await request(app).patch(`/api/contact/${stored.id}`)
    .set('Cookie', cookie)
    .send({ status: 'REPLIED' });
  assert.equal(markRead.status, 200);
  assert.equal(markRead.body.status, 'REPLIED');

  const del = await request(app).delete(`/api/contact/${stored.id}`).set('Cookie', cookie);
  assert.equal(del.status, 200);
});

// Fixture: one published article so read-path tests are independent of editorial content.
const fixture: { articleId?: string; slug?: string; authorId?: string; cookie?: string } = {};

test.before(async () => {
  const login = await request(app).post('/api/auth/login')
    .send({ identifier: 'admin', password: 'ChangeMe!2026' });
  const cookie = login.headers['set-cookie'];
  fixture.cookie = cookie;

  const author = await request(app).post('/api/authors')
    .set('Cookie', cookie)
    .send({ name: 'Test Desk', jobTitle: 'QA fixture' });
  fixture.authorId = author.body.id;

  const category = (await request(app).get('/api/categories')).body.items[0];
  const article = await request(app).post('/api/articles')
    .set('Cookie', cookie)
    .send({
      title: 'Test Fixture Article',
      content: '<h2>Fixture</h2><p>Used by the automated test suite.</p>',
      status: 'PUBLISHED',
      categoryId: category.id,
      authorId: author.body.id,
    });
  fixture.articleId = article.body.id;
  fixture.slug = article.body.slug;
});

test.after(async () => {
  // Remove fixtures regardless of test outcome.
  if (fixture.articleId) {
    await prisma.article.delete({ where: { id: fixture.articleId } }).catch(() => undefined);
  }
  if (fixture.authorId) {
    await prisma.author.delete({ where: { id: fixture.authorId } }).catch(() => undefined);
  }
  await prisma.newsletterSubscriber.deleteMany({ where: { email: { in: ['test.subscriber@example.com', 'no-consent@example.com'] } } });
  await prisma.$disconnect();
});
