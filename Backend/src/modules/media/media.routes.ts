import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../../config/env.js';
import { prisma } from '../../shared/database/prisma.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { requireAuth, requirePermission } from '../../shared/middleware/auth.js';
import { badRequest, notFound } from '../../shared/errors/AppError.js';
import { audit } from '../../shared/utils/audit.js';
import { emitInvalidation } from '../../shared/realtime/realtime.js';

// Storage abstraction: local disk now; swap this adapter for S3/Cloudinary later.
export interface StorageAdapter {
  save(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
  remove(filename: string): Promise<void>;
}

class LocalDiskStorage implements StorageAdapter {
  constructor(private readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  async save(buffer: Buffer, filename: string): Promise<string> {
    fs.writeFileSync(path.join(this.dir, filename), buffer);
    return `/media/${filename}`;
  }

  async remove(filename: string): Promise<void> {
    fs.rmSync(path.join(this.dir, path.basename(filename)), { force: true });
  }
}

export const storage: StorageAdapter = new LocalDiskStorage(env.UPLOAD_DIR);

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where: { deletedAt: null, ...(search ? { originalName: { contains: search, mode: 'insensitive' } } : {}) },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 24,
        take: 24,
      }),
      prisma.media.count({ where: { deletedAt: null } }),
    ]);
    res.json({ items, total, page });
  }),
);

router.post(
  '/',
  requireAuth,
  requirePermission('media:write'),
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw badRequest('No files uploaded');

    const created = [];
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 12);
      const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : '';
      const filename = `${Date.now()}-${crypto.randomUUID()}${safeExt}`;
      const url = await storage.save(file.buffer, filename, file.mimetype);
      const media = await prisma.media.create({
        data: {
          filename,
          originalName: path.basename(file.originalname).slice(0, 200),
          mimeType: file.mimetype,
          size: file.size,
          url,
          folder: file.mimetype.startsWith('image/') ? 'IMAGES' : 'DOCUMENTS',
          altText: typeof req.body.altText === 'string' ? req.body.altText : undefined,
          uploadedById: req.authUser!.id,
        },
      });
      created.push(media);
    }
    await audit(req.authUser!.id, 'UPLOAD', 'Media', undefined, { count: created.length });
    emitInvalidation('media');
    res.status(201).json({ items: created });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requirePermission('media:write'),
  asyncHandler(async (req, res) => {
    const { altText, caption } = req.body as { altText?: string; caption?: string };
    const media = await prisma.media.update({
      where: { id: req.params.id },
      data: { altText, caption },
    });
    emitInvalidation('media');
    res.json(media);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('media:write'),
  asyncHandler(async (req, res) => {
    const media = await prisma.media.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!media) throw notFound('Media');

    const inUse = await prisma.article.count({ where: { featuredImageId: media.id, deletedAt: null } });
    if (inUse > 0) {
      res.status(409).json({
        error: { code: 'MEDIA_IN_USE', message: `Used as featured image by ${inUse} article(s).` },
      });
      return;
    }
    await storage.remove(media.filename);
    await prisma.media.update({ where: { id: media.id }, data: { deletedAt: new Date() } });
    await audit(req.authUser!.id, 'DELETE', 'Media', media.id);
    emitInvalidation('media');
    res.json({ ok: true });
  }),
);

export default router;
