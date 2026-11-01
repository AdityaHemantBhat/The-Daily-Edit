export const API_BASE: string = import.meta.env.VITE_API_URL ?? '/api';

export const SITE_NAME = 'The Daily Edit';
export const SITE_TAGLINE = 'Technology, tools, and the ideas behind them — edited daily.';

export const SITE_URL: string = import.meta.env.VITE_SITE_URL ?? window.location.origin;

/** Socket.IO connects to the API origin in dev, same origin in production. */
export const SOCKET_URL: string = import.meta.env.DEV
  ? 'http://localhost:4000'
  : import.meta.env.VITE_SOCKET_URL ?? window.location.origin;
