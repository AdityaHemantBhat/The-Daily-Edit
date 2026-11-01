import { cachedSettings } from '../../application/hooks/usePublicData';

/** The configured admin URL path (default /admin). Validated against the expected shape. */
export function getAdminPath(): string {
  const p = cachedSettings().site?.adminPath;
  return typeof p === 'string' && /^\/[a-z0-9-]{2,40}$/.test(p) ? p : '/admin';
}

/** Paths the admin URL must never collide with. */
export const RESERVED_PUBLIC_PATHS = [
  '/', '/api', '/articles', '/tools', '/category', '/categories', '/authors',
  '/search', '/media', '/about', '/contact', '/privacy-policy', '/terms',
  '/disclaimer', '/editorial-policy', '/cookie-policy', '/sitemap.xml',
  '/robots.txt', '/ads.txt', '/favicon.svg', '/logo.svg',
];

export function isValidAdminPath(p: string): boolean {
  return /^\/[a-z0-9-]{2,40}$/.test(p) && !RESERVED_PUBLIC_PATHS.includes(p.replace(/\/+$/, '') || p);
}
