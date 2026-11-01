import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicApi, type ArticleListQuery } from '../../infrastructure/api/repositories';
import type { SiteSettings } from '../../domain/entities';

const STALE_MINUTE = 60_000;

export function useHomeSections() {
  return useQuery({ queryKey: ['home'], queryFn: publicApi.homeSections, staleTime: STALE_MINUTE });
}

export function useArticles(query: ArticleListQuery) {
  return useQuery({
    queryKey: ['articles', query],
    queryFn: () => publicApi.articles(query),
    staleTime: STALE_MINUTE,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => publicApi.article(slug),
    staleTime: STALE_MINUTE,
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: publicApi.categories, staleTime: 5 * STALE_MINUTE });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => publicApi.category(slug),
    enabled: !!slug,
  });
}

export function useAuthor(slug: string) {
  return useQuery({
    queryKey: ['author', slug],
    queryFn: () => publicApi.author(slug),
    enabled: !!slug,
  });
}

export function useTools() {
  return useQuery({ queryKey: ['tools'], queryFn: publicApi.tools, staleTime: 5 * STALE_MINUTE });
}

export function useTool(slug: string) {
  return useQuery({
    queryKey: ['tool', slug],
    queryFn: () => publicApi.tool(slug),
    enabled: !!slug,
  });
}

export function useToolCategories() {
  return useQuery({ queryKey: ['toolCategories'], queryFn: publicApi.toolCategories, staleTime: 5 * STALE_MINUTE });
}

export function useSearch(q: string, page: number) {
  return useQuery({
    queryKey: ['search', q, page],
    queryFn: () => publicApi.search(q, page),
    enabled: q.trim().length > 1,
    staleTime: STALE_MINUTE,
  });
}

export function useAdConfig() {
  return useQuery({ queryKey: ['ads-live'], queryFn: publicApi.adConfig, staleTime: 10 * STALE_MINUTE });
}

const SETTINGS_CACHE_KEY = 'tde-public-settings';

/** Synchronous last-known public settings — used for logo/favicon that must never blank. */
export function cachedSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw) return JSON.parse(raw) as SiteSettings;
  } catch {
    // Corrupted cache — fall through to the empty default.
  }
  return {} as SiteSettings;
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings-public'],
    queryFn: async () => {
      const data = await publicApi.publicSettings();
      try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data));
      } catch {
        // Private mode — cache is best-effort only.
      }
      return data;
    },
    // Render the last-known settings instantly (logo never blanks), then refetch.
    initialData: cachedSettings(),
    initialDataUpdatedAt: 0,
    staleTime: 5 * STALE_MINUTE,
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publicApi.subscribe,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings-public'] }),
  });
}

export function useRecordToolUsage(slug: string) {
  return useMutation({ mutationFn: () => publicApi.recordToolUsage(slug) });
}
