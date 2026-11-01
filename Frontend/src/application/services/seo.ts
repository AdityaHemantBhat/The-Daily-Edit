import { SITE_NAME, SITE_URL } from '../../app/config/site';

interface MetaInput {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function setPageMeta({ title, description, path, image, type, noindex, jsonLd }: MetaInput) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const url = `${SITE_URL}${path ?? ''}`;

  document.title = fullTitle;
  if (description) {
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:description', description);
    upsertMeta('name', 'twitter:description', description);
  }
  upsertMeta('property', 'og:title', fullTitle);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:type', type ?? 'website');
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', fullTitle);
  if (image) {
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
  }
  upsertLink('canonical', url);
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

  const id = 'tde-jsonld';
  document.getElementById(id)?.remove();
  if (jsonLd) {
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

export function articleJsonLd(article: {
  title: string;
  subtitle?: string | null;
  slug: string;
  publishedAt: string | null;
  updatedAt: string;
  author: { name: string };
  category: { name: string };
  featuredImage?: { url: string } | null;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    ...(article.subtitle ? { description: article.subtitle } : {}),
    ...(article.featuredImage ? { image: article.featuredImage.url } : {}),
    author: { '@type': 'Person', name: article.author.name },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.updatedAt,
    articleSection: article.category.name,
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function softwareAppJsonLd(tool: { name: string; description: string; slug: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    url: `${SITE_URL}/tools/${tool.slug}`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
