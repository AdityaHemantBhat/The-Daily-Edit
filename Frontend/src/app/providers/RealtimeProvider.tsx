import { useEffect, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { SOCKET_URL } from '../../app/config/site';

/**
 * Realtime invalidation: when staff change anything in the admin panel, the
 * backend broadcasts the affected scopes over Socket.IO and every connected
 * browser refetches the matching queries — the public site updates without
 * a refresh.
 */
const SCOPE_KEYS: Record<string, QueryKey[]> = {
  articles: [['articles'], ['home'], ['article'], ['article-comments'], ['admin-articles'], ['admin-overview']],
  settings: [['settings-public'], ['admin-settings']],
  categories: [['categories'], ['category'], ['admin-categories']],
  tags: [['tags'], ['admin-tags']],
  authors: [['authors'], ['author'], ['admin-authors']],
  media: [['admin-media'], ['media-picker']],
  tools: [['tools'], ['tool'], ['toolCategories'], ['admin-tools']],
  comments: [['admin-comments'], ['article-comments']],
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on('site:invalidate', (payload: { scopes?: string[] }) => {
      for (const scope of payload.scopes ?? []) {
        for (const key of SCOPE_KEYS[scope] ?? []) {
          void qc.invalidateQueries({ queryKey: key });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [qc]);

  return <>{children}</>;
}
