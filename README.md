# The Daily Edit

A digital publication with a full editorial CMS and a suite of 32 privacy-first client-side tools. Built with Express + Prisma + PostgreSQL on the backend and React + Vite + Tailwind on the frontend.

## Structure

- **`Backend/`** — Express API server: articles, categories, tags, authors, media, comments, newsletter, contact, settings, tools, auth/roles, SEO (sitemap/robots/meta), Socket.IO realtime invalidation, first-party view tracking.
- **`Frontend/`** — React SPA: public magazine site, 32 client-side tools (image, PDF, text, converters — all processing happens in the browser), and a full admin panel (drafts, scheduling, backdating, media library, moderation, settings).

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
# 1. Backend
cd Backend
npm install
cp .env.example .env        # then edit: DATABASE_URL, JWT_SECRET, etc.
npx prisma db push
npm run seed                # roles, categories, tools, settings (infrastructure only)
npm run dev                 # serves API on :4000 (and /media, /sitemap.xml, /robots.txt)

# 2. Frontend
cd ../Frontend
npm install
npm run dev                 # Vite on :5173, proxies /api, /media and SEO paths to :4000
```

Default admin after seeding: `admin@thedailyedit.local` / `ChangeMe!2026` — **change this immediately** via Admin → Settings → Your account.

## Production

```bash
cd Backend && npm run build && npm start    # Express serves the built frontend from Frontend/dist
```

Before going live: set a strong `JWT_SECRET`, set `SITE_URL` to the real domain, change the admin password, and review the legal pages in Admin → Settings.

## Tests

```bash
cd Backend && npm test      # 15 API integration tests
```
