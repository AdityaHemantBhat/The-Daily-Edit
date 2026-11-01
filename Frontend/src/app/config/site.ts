export const API_BASE: string = import.meta.env.VITE_API_URL ?? '/api';

export const SITE_NAME = 'The Daily Edit';
export const SITE_TAGLINE = 'Technology, tools, and the ideas behind them — edited daily.';

export const SITE_URL: string = import.meta.env.VITE_SITE_URL ?? window.location.origin;

/** Socket.IO connects to the API origin in dev, same origin in production. */
export const SOCKET_URL: string = import.meta.env.DEV
  ? 'http://localhost:4000'
  : import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

// In split deployments the frontend origin has no /media files — the API host
// serves them. Absolute API_BASEs (VITE_API_URL) therefore get their origin
// prefixed onto server-provided /media/... URLs. Relative paths (logo.svg,
// favicon.svg from the frontend's own public/) and data:/http(s): URLs pass
// through untouched.
const API_ORIGIN: string = API_BASE.startsWith('http') ? new URL(API_BASE).origin : '';

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (API_ORIGIN && url.startsWith('/media/')) return `${API_ORIGIN}${url}`;
  return url;
}
