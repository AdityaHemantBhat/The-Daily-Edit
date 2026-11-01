import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env, isProd } from './config/env.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { renderWithMeta } from './shared/seo/renderWithMeta.js';
import { generalLimiter } from './shared/middleware/rateLimit.js';
import { logger } from './shared/logger/logger.js';
import { publishScheduled } from './modules/articles/article.service.js';

import authRoutes from './modules/auth/auth.routes.js';
import articleRoutes from './modules/articles/article.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import tagRoutes from './modules/tags/tag.routes.js';
import authorRoutes from './modules/authors/author.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import toolRoutes from './modules/tools/tool.routes.js';
import adRoutes from './modules/ads/ad.routes.js';
import settingRoutes from './modules/settings/setting.routes.js';
import newsletterRoutes from './modules/newsletter/newsletter.routes.js';
import analyticsRoutes from './modules/dashboard/dashboard.routes.js';
import userRoutes from './modules/users/user.routes.js';
import commentRoutes from './modules/comments/comment.routes.js';
import contactRoutes from './modules/contact/contact.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import seoRoutes from './modules/seo/seo.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://pagead2.googlesyndication.com', 'https://googleads.g.doubleclick.net'],
            frameSrc: ["'self'", 'https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          },
        }
      : false,
  }));

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  // Only log requests that need attention (4xx → warn, 5xx → error).
  // Successful requests stay silent to keep the console readable.
  app.use(pinoHttp({ logger, level: 'warn', redact: ['req.headers.cookie', 'req.headers.authorization'] }));
  app.use(generalLimiter);

  app.use(cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  }));

  // Serve SEO endpoints at the site root as well (/robots.txt, /sitemap.xml, /ads.txt).
  // Must run before the API routers so the rewritten URL reaches them.
  app.use((req, res, next) => {
    if (['/robots.txt', '/sitemap.xml', '/ads.txt'].includes(req.path)) {
      req.url = `/api/seo${req.path}`;
    }
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/articles', articleRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/authors', authorRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/tools', toolRoutes);
  app.use('/api/ads', adRoutes);
  app.use('/api/settings', settingRoutes);
  app.use('/api/newsletter', newsletterRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/seo', seoRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  // Uploaded media (dev serves via the Vite proxy; prod directly).
  // Explicit Cache-Control via setHeaders (some proxies drop maxAge) and a
  // public CORS header so cross-origin <img> loads from the frontend host
  // never get blocked.
  app.use('/media', express.static(path.resolve(__dirname, '..', env.UPLOAD_DIR), {
    maxAge: '30d',
    immutable: false,
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Vary', 'Origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      if (filePath && filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    },
  }));

  if (isProd) {
    // Serve the built SPA with server-side metadata injection.
    // Backend/src → Backend → repo root → Frontend/dist
    const distDir = process.env.FRONTEND_DIST_DIR ?? path.resolve(__dirname, '..', '..', 'Frontend', 'dist');
    app.use(express.static(distDir, {
      index: false,
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
        }
      },
    }));
    app.get('*', renderWithMeta);
  }

  app.use(errorHandler);
  return app;
}

export function startScheduler() {
  // Publish scheduled articles every minute.
  setInterval(() => {
    publishScheduled().catch((err) => logger.error({ err }, 'Scheduler failed'));
  }, 60_000);
}
