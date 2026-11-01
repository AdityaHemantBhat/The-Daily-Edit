import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Link2, Mail, MessageCircle, Share2 } from 'lucide-react';
import { useArticle } from '../../application/hooks/usePublicData';
import { AdSlot } from '../../presentation/components/AdSlot';
import { CommentsSection } from './CommentsSection';
import { ArticleByline, StoryCard } from '../../presentation/components/ArticleCards';
import { Alert, Badge, Container, Skeleton } from '../../presentation/primitives';
import { articleJsonLd, breadcrumbJsonLd, setPageMeta } from '../../application/services/seo';
import { formatDate, formatDateTime, readingTimeLabel } from '../../domain/value-objects/format';
import { publicApi } from '../../infrastructure/api/repositories';
import { SITE_URL, mediaUrl } from '../../app/config/site';

marked.setOptions({ gfm: true, breaks: false });

interface Heading { id: string; text: string; level: number }

function extractHeadings(html: string): { headings: Heading[]; processedHtml: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = Array.from(doc.querySelectorAll('h2, h3')).map((el, i) => {
    const text = el.textContent ?? `Section ${i + 1}`;
    let id = el.id;
    if (!id) {
      id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || `h-${i}`;
      el.id = id;
    }
    return { id, text, level: el.tagName === 'H2' ? 2 : 3 };
  });
  return { headings, processedHtml: doc.body.innerHTML };
}

function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setProgress(total > 0 ? Math.min(100, Math.round((doc.scrollTop / total) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

function ShareButtons({ title, path }: { title: string; path: string }) {
  const url = `${SITE_URL}${path}`;
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canNativeShare = typeof navigator.share === 'function';

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const copyLink = () => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = () => {
    if (canNativeShare) {
      void navigator.share({ title, text: title, url }).catch(() => undefined);
    } else {
      setMenuOpen((open) => !open);
    }
  };

  return (
    <div ref={menuRef} className="relative flex items-center gap-2">
      <button
        onClick={share}
        className="flex items-center gap-2 rounded-full border border-rule-dark px-4 py-2 text-sm text-ink-500 hover:border-ink-900 hover:text-ink-950"
        aria-label="Share this article"
      ><Share2 className="size-4" /> Share</button>
      {copied && <span className="text-xs text-gold-700">Link copied</span>}
      {menuOpen && (
        <div className="absolute top-full left-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-rule-dark bg-paper shadow-lg">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-stone-100"
          ><MessageCircle className="size-4" /> WhatsApp</a>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-stone-100"
          ><Mail className="size-4" /> Email</a>
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-stone-100"
          ><Link2 className="size-4" /> Copy link</button>
        </div>
      )}
    </div>
  );
}

export function ArticlePage() {
  const { slug = '' } = useParams();
  const { data: article, isLoading, isError, error } = useArticle(slug);
  const progress = useReadingProgress();
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  // Record the view once per mount (backend deduplicates per visitor).
  useEffect(() => {
    void publicApi.recordView(slug).catch(() => undefined);
  }, [slug]);

  const { html, headings } = useMemo(() => {
    if (!article) return { html: '', headings: [] };
    const looksLikeHtml = /^\s*<\w+/.test(article.content);
    const raw = looksLikeHtml ? article.content : marked.parse(article.content, { async: false });
    const sanitized = DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] });
    const { headings, processedHtml } = extractHeadings(sanitized);
    return { html: processedHtml, headings };
  }, [article]);

  useEffect(() => {
    // Track which section is in view for the floating TOC.
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
            return;
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    if (!article) return;
    setPageMeta({
      title: article.seo?.title ?? article.title,
      description: article.seo?.description ?? article.subtitle ?? undefined,
      path: `/articles/${article.slug}`,
      image: article.featuredImage?.url,
      type: 'article',
      noindex: article.seo?.noindex,
      jsonLd: [
        articleJsonLd(article),
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: article.category.name, path: `/category/${article.category.slug}` },
          { name: article.title, path: `/articles/${article.slug}` },
        ]),
      ],
    });
  }, [article]);

  if (isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-14 w-full" />
        <Skeleton className="mt-4 aspect-[16/8] w-full" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
      </Container>
    );
  }

  if (isError || !article) {
    return (
      <Container className="py-20">
        <Alert>{error instanceof Error ? error.message : 'Article not found.'}</Alert>
        <Link to="/" className="mt-6 inline-block font-semibold text-gold-700 hover:underline">← Back to homepage</Link>
      </Container>
    );
  }

  const hasToc = headings.length >= 3;

  return (
    <>
      <div className="fixed left-0 top-0 z-50 h-0.5 bg-gold-600 transition-[width] duration-150" style={{ width: `${progress}%` }} aria-hidden />

      <article className="mx-auto max-w-7xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-widest text-ink-500">
          <ol className="flex flex-wrap gap-2">
            <li><Link to="/" className="hover:text-gold-700">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to={`/category/${article.category.slug}`} className="hover:text-gold-700">{article.category.name}</Link></li>
            <li aria-hidden>/</li>
            <li className="text-ink-950">{article.title.slice(0, 40)}{article.title.length > 40 ? '…' : ''}</li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            <header>
              <Link to={`/category/${article.category.slug}`}><Badge>{article.category.name}</Badge></Link>
              <h1 className="mt-4 font-serif text-[1.8rem] leading-[1.15] text-ink-950 sm:text-4xl sm:leading-[1.12] md:text-[3.4rem]">
                {article.title}
              </h1>
              {article.subtitle && <p className="mt-4 font-serif text-lg sm:text-xl md:text-2xl leading-snug text-ink-500">{article.subtitle}</p>}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-rule py-4">
                <ArticleByline article={article} />
                <ShareButtons title={article.title} path={`/articles/${article.slug}`} />
              </div>
            </header>

            {article.featuredImage && (
              <figure className="mt-8">
                <img
                  src={mediaUrl(article.featuredImage.url)}
                  alt={article.imageAlt ?? article.featuredImage.altText ?? article.title}
                  width={article.featuredImage.width ?? 1200}
                  height={article.featuredImage.height ?? 675}
                  className="w-full rounded-sm object-cover"
                  fetchPriority="high"
                />
                {article.imageCaption && (
                  <figcaption className="mt-2 text-center text-sm text-ink-500">{article.imageCaption}</figcaption>
                )}
              </figure>
            )}

            <div className="mt-4"><AdSlot placement="article_top" minHeight={100} /></div>

            <div className="mt-8">
              {hasToc && (
                <details className="mb-8 border border-rule bg-white lg:hidden" open>
                  <summary className="cursor-pointer px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink-950">
                    In this article
                  </summary>
                  <ol className="space-y-2 px-4 pb-4 text-sm">
                    {headings.map((h) => (
                      <li key={h.id} style={{ paddingLeft: (h.level - 2) * 14 }}>
                        <a href={`#${h.id}`} className="text-ink-700 hover:text-gold-700">{h.text}</a>
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              <div
                className="prose-editorial"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              <div className="mt-6"><AdSlot placement="article_bottom" minHeight={100} /></div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-widest text-ink-500">Written by</p>
                  <Link to={`/authors/${article.author.slug}`} className="font-serif text-2xl font-semibold hover:text-gold-700">
                    {article.author.name}
                  </Link>
                  {article.author.jobTitle && <p className="text-xs text-ink-500">{article.author.jobTitle}</p>}
                </div>
                <p className="text-xs text-ink-500">
                  Published {formatDateTime(article.publishedAt)} · Updated {formatDate(article.updatedAt)} · {readingTimeLabel(article.readingMinutes)}
                </p>
              </div>

              {article.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {article.tags.map(({ tag }) => (
                    <Link key={tag.id} to={`/search?q=${encodeURIComponent(tag.name)}`}>
                      <Badge tone="neutral">#{tag.name}</Badge>
                    </Link>
                  ))}
                </div>
              )}

              <CommentsSection slug={article.slug} />
            </div>
          </div>

          {/* Floating TOC sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-8">
              {hasToc && (
                <nav aria-label="Table of contents">
                  <p className="mb-3 border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">In this article</p>
                  <ol className="space-y-2 text-sm">
                    {headings.map((h) => (
                      <li key={h.id} style={{ paddingLeft: (h.level - 2) * 12 }}>
                        <a
                          href={`#${h.id}`}
                          className={`block leading-snug ${activeHeading === h.id ? 'font-semibold text-gold-700' : 'text-ink-500 hover:text-ink-950'}`}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <AdSlot placement="sidebar" minHeight={250} />
            </div>
          </aside>
        </div>

        {article.related.length > 0 && (
          <section className="mt-16 border-t border-rule pt-12">
            <h2 className="mb-8 font-serif text-3xl font-semibold">Related Reading</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {article.related.map((a) => <StoryCard key={a.id} article={a} />)}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
export default ArticlePage;
