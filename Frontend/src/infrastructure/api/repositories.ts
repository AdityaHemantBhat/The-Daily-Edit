import { http } from './http';
import type {
  AdConfig, ArticleCard, ArticleDetail, AuthUser, Category, ContactMessage, HomeSections, Media,
  Paginated, SearchResults, SiteSettings, Tag, Tool, ToolCategory, Author,
} from '../../domain/entities';

export interface ArticleListQuery {
  page?: number;
  perPage?: number;
  category?: string;
  tag?: string;
  search?: string;
  status?: string;
  orderBy?: 'publishedAt' | 'viewCount' | 'updatedAt';
  featured?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
}

function qs(params: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const publicApi = {
  homeSections: () => http.get<HomeSections>('/articles/home-sections'),
  articles: (query: ArticleListQuery) => http.get<Paginated<ArticleCard>>(`/articles${qs(query)}`),
  article: (slug: string) => http.get<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`),
  recordView: (slug: string) => http.post(`/articles/${encodeURIComponent(slug)}/view`),
  articleComments: (slug: string) =>
    http.get<{ items: { id: string; authorName: string; body: string; createdAt: string }[] }>(`/comments/public/${encodeURIComponent(slug)}`),
  postComment: (data: { articleSlug: string; authorName: string; authorEmail: string; body: string }) =>
    http.post<{ ok: boolean; message: string }>('/comments', data),
  categories: () => http.get<{ items: Category[] }>('/categories'),
  category: (slug: string) => http.get<Category>(`/categories/${encodeURIComponent(slug)}`),
  author: (slug: string) => http.get<Author & { articles: ArticleCard[] }>(`/authors/${encodeURIComponent(slug)}`),
  authors: () => http.get<{ items: Author[] }>('/authors'),
  tools: () => http.get<{ items: Tool[] }>('/tools'),
  tool: (slug: string) => http.get<Tool>(`/tools/${encodeURIComponent(slug)}`),
  toolCategories: () => http.get<{ items: ToolCategory[] }>('/tools/categories/all'),
  search: (q: string, page: number) => http.get<SearchResults>(`/search${qs({ q, page })}`),
  adConfig: () => http.get<AdConfig>('/ads/live'),
  publicSettings: () => http.get<SiteSettings>('/settings/public'),
  subscribe: (email: string) => http.post<{ ok: boolean; message: string }>('/newsletter/subscribe', { email, consent: true }),
  sendContactMessage: (data: { name: string; email: string; subject: string; message: string }) =>
    http.post<{ ok: boolean; message: string }>('/contact', data),
  recordToolUsage: (slug: string) => http.post(`/tools/${encodeURIComponent(slug)}/usage`),
};

export const authApi = {
  login: (identifier: string, password: string, remember: boolean) =>
    http.post<{ user: AuthUser }>('/auth/login', { identifier, password, remember }),
  logout: () => http.post<{ ok: boolean }>('/auth/logout'),
  me: () => http.get<{ user: AuthUser }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<{ ok: boolean; message: string }>('/auth/change-password', { currentPassword, newPassword }),
  updateProfile: (data: { email?: string; username?: string; name?: string }) =>
    http.patch<{ user: AuthUser }>('/auth/profile', data),
};

export interface ArticleWritePayload {
  title: string;
  subtitle?: string;
  slug?: string;
  content: string;
  status: string;
  categoryId: string;
  authorId: string;
  tagIds?: string[];
  featuredImageId?: string;
  imageCaption?: string;
  imageAlt?: string;
  featured?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
  scheduledAt?: string;
  publishedAt?: string;
  seo?: { title?: string; description?: string; canonicalUrl?: string; ogImage?: string; noindex?: boolean };
}

export const adminApi = {
  // Articles
  adminListArticles: (query: ArticleListQuery) => http.get<Paginated<ArticleCard>>(`/articles/admin${qs(query)}`),
  createArticle: (data: ArticleWritePayload) => http.post<ArticleDetail>('/articles', data),
  updateArticle: (id: string, data: Partial<ArticleWritePayload>) => http.patch<ArticleDetail>(`/articles/${id}`, data),
  deleteArticle: (id: string) => http.delete<{ ok: boolean }>(`/articles/${id}`),
  articleById: (id: string) => http.get<ArticleDetail>(`/articles/admin/by-id/${id}`),
  bulkStatus: (ids: string[], status: string) => http.post<{ ok: boolean; count: number }>('/articles/bulk-status', { ids, status }),

  // Categories
  createCategory: (data: Partial<Category>) => http.post<Category>('/categories', data),
  updateCategory: (id: string, data: Partial<Category>) => http.patch<Category>(`/categories/${id}`, data),
  deleteCategory: (id: string, moveTo?: string) =>
    http.delete<{ ok: boolean }>(`/categories/${id}${moveTo ? `?moveTo=${moveTo}` : ''}`),

  // Tags
  tags: (search?: string) => http.get<{ items: Tag[] }>(`/tags${qs({ search })}`),
  createTag: (name: string) => http.post<Tag>('/tags', { name }),
  deleteTag: (id: string) => http.delete<{ ok: boolean }>(`/tags/${id}`),

  // Authors
  createAuthor: (data: Partial<Author>) => http.post<Author>('/authors', data),
  updateAuthor: (id: string, data: Partial<Author>) => http.patch<Author>(`/authors/${id}`, data),
  deleteAuthor: (id: string) => http.delete<{ ok: boolean }>(`/authors/${id}`),

  // Media
  media: (page: number, search?: string) => http.get<{ items: Media[]; total: number }>(`/media${qs({ page, search })}`),
  uploadMedia: (form: FormData) => http.postForm<{ items: Media[] }>('/media', form),
  updateMedia: (id: string, data: { altText?: string; caption?: string }) => http.patch<Media>(`/media/${id}`, data),
  deleteMedia: (id: string) => http.delete<{ ok: boolean }>(`/media/${id}`),

  // Tools
  toolsAll: () => http.get<{ items: Tool[] }>('/tools?all=1'),
  createTool: (data: Partial<Tool>) => http.post<Tool>('/tools', data),
  updateTool: (id: string, data: Partial<Tool>) => http.patch<Tool>(`/tools/${id}`, data),
  deleteTool: (id: string) => http.delete<{ ok: boolean }>(`/tools/${id}`),

  // Ads
  adPlacements: () => http.get<{ items: unknown[] }>('/ads/placements'),
  seedPlacements: () => http.post<{ items: unknown[] }>('/ads/placements/seed-defaults'),
  createAd: (data: Record<string, unknown>) => http.post('/ads', data),
  updateAd: (id: string, data: Record<string, unknown>) => http.patch(`/ads/${id}`, data),
  deleteAd: (id: string) => http.delete<{ ok: boolean }>(`/ads/${id}`),

  // Settings
  settings: () => http.get<{ items: { key: string; value: unknown }[] }>('/settings'),
  saveSetting: (key: string, value: unknown) => http.put('/settings', { key, value }),

  // Dashboard
  analyticsOverview: () => http.get('/analytics/overview'),

  // Users
  users: () => http.get<{ items: unknown[] }>('/users'),
  roles: () => http.get<{ items: { id: string; name: string; permissions: string[] }[] }>('/users/roles'),
  createUser: (data: Record<string, unknown>) => http.post('/users', data),
  updateUser: (id: string, data: Record<string, unknown>) => http.patch(`/users/${id}`, data),
  deleteUser: (id: string) => http.delete<{ ok: boolean }>(`/users/${id}`),

  // Comments
  comments: (status: string) => http.get<{ items: unknown[] }>(`/comments${qs({ status })}`),
  updateComment: (id: string, status: string) => http.patch(`/comments/${id}`, { status }),
  deleteComment: (id: string) => http.delete<{ ok: boolean }>(`/comments/${id}`),

  // Contact inbox
  messages: (status?: string) => http.get<{ items: ContactMessage[]; unread: number }>(`/contact${qs({ status: status || undefined })}`),
  updateMessage: (id: string, data: { status: string; adminNote?: string }) => http.patch(`/contact/${id}`, data),
  deleteMessage: (id: string) => http.delete<{ ok: boolean }>(`/contact/${id}`),

  // Newsletter
  subscribers: () => http.get<{ total: number; confirmed: number; items: { id: string; email: string; confirmed: boolean; createdAt: string }[] }>('/newsletter'),
  deleteSubscriber: (id: string) => http.delete<{ ok: boolean }>(`/newsletter/${id}`),
};
