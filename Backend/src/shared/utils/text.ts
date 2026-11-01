import crypto from 'node:crypto';

export function slugify(text: string): string {
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

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let i = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${i++}`;
  }
  return candidate;
}

export function visitorHash(ip: string, userAgent: string, salt: string): string {
  return crypto.createHash('sha256').update(`${ip}|${userAgent}|${salt}`).digest('hex').slice(0, 32);
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
