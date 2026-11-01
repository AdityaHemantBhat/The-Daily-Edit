// ---- Core entities shared across layers ----

export type ArticleStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface ArticleCard {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  status: ArticleStatus;
  featured: boolean;
  trending: boolean;
  editorsPick: boolean;
  readingMinutes: number;
  viewCount: number;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string;
  imageAlt?: string | null;
  category: { name: string; slug: string };
  author: { name: string; slug: string; avatarUrl?: string | null };
  featuredImage?: { url: string; width?: number | null; height?: number | null; altText?: string | null } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  order: number;
  _count?: { articles: number };
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  social?: Record<string, string> | null;
  _count?: { articles: number };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: { articles: number };
}

export interface SeoMeta {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface ArticleDetail extends ArticleCard {
  content: string;
  category: Category;
  author: Author;
  tags: { tag: Tag }[];
  featuredImage?: Media | null;
  imageCaption?: string | null;
  seo?: SeoMeta | null;
  related: ArticleCard[];
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  caption?: string | null;
  url: string;
  folder: 'IMAGES' | 'DOCUMENTS';
  createdAt: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  tools?: Tool[];
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions?: string | null;
  componentKey: string;
  categoryId: string;
  category: ToolCategory;
  enabled: boolean;
  featured: boolean;
  order: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  faqs?: { question: string; answer: string }[] | null;
  usageCount: number;
  related?: { name: string; slug: string; description: string }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface HomeSections {
  featured: ArticleCard[];
  latest: ArticleCard[];
  trending: ArticleCard[];
  editorsPicks: ArticleCard[];
  recentlyUpdated: ArticleCard[];
}

export interface SearchResults {
  articles: { items: ArticleCard[]; total: number; page: number; pages: number };
  tools: { name: string; slug: string; description: string; category: { name: string; slug: string } }[];
  categories: { name: string; slug: string; description?: string | null }[];
}

export interface AdConfig {
  publisherId: string | null;
  placements: { key: string; adClient: string; adSlot: string; label: string }[];
}

export interface SiteSettings {
  site?: {
    name: string;
    tagline: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    contactEmail?: string | null;
    adminPath?: string;
    social: Record<string, string>;
  };
  announcement?: { enabled: boolean; text: string; linkUrl?: string; linkText?: string };
  newsletter?: { enabled: boolean; heading: string; body: string };
  homeSections?: { showTrending: boolean; showTools: boolean; showEditorsPicks: boolean; showRecentlyUpdated: boolean };
  legal?: Record<string, string>;
  adsense?: { publisherId: string | null; enabled: boolean };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'REPLIED';
  adminNote?: string | null;
  createdAt: string;
}

// ---- Auth ----

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
}
