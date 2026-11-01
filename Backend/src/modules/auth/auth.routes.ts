import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../shared/middleware/auth.js';
import { authLimiter } from '../../shared/middleware/rateLimit.js';
import { validate } from '../../shared/middleware/validate.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { audit } from '../../shared/utils/audit.js';
import * as authService from './auth.service.js';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().default(false),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
});

const profileSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    name: z.string().min(1).max(120).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const router = Router();

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, req.headers['user-agent'], req.ip);
    res.cookie('tde_session', result.cookie.value, {
      ...result.cookie.options,
      maxAge: result.cookie.maxAge,
    });
    await audit(result.user.id, 'LOGIN', 'User', result.user.id, undefined, req.ip);
    res.json({ user: result.user });
  }),
);

router.post('/logout', (req, res) => {
  const token = req.cookies?.tde_session as string | undefined;
  if (token) void authService.logout(token);
  res.clearCookie('tde_session', authService.clearCookieOptions());
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.authUser });
});

router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.authUser!.id, req.body.currentPassword, req.body.newPassword);
    res.clearCookie('tde_session', authService.clearCookieOptions());
    await audit(req.authUser!.id, 'CHANGE_PASSWORD', 'User', req.authUser!.id);
    res.json({ ok: true, message: 'Password changed. Please sign in again.' });
  }),
);

router.patch(
  '/profile',
  requireAuth,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.authUser!.id, req.body);
    await audit(req.authUser!.id, 'UPDATE_PROFILE', 'User', req.authUser!.id);
    res.json({ user });
  }),
);

export default router;
