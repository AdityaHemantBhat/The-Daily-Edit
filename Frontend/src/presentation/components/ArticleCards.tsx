import { Link } from 'react-router-dom';
import type { ArticleCard as ArticleCardType } from '../../domain/entities';
import { Badge } from '../primitives';
import { formatDate, readingTimeLabel, excerpt } from '../../domain/value-objects/format';

function categoryLabel(article: ArticleCardType) {
  return article.category?.name ?? 'Story';
}

/** Large editorial lead story (used in the featured grid). */
export function LeadStory({ article }: { article: ArticleCardType }) {
  return (
    <article className="group">
      <Link to={`/articles/${article.slug}`} className="block overflow-hidden">
        {article.featuredImage ? (
          <img
            src={article.featuredImage.url}
            alt={article.imageAlt ?? article.title}
            width={article.featuredImage.width ?? 1200}
            height={article.featuredImage.height ?? 675}
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="eager"
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-paper-dark" />
        )}
      </Link>
      <div className="pt-5">
        <Link to={`/category/${article.category?.slug ?? ''}`} className="hover:underline">
          <Badge>{categoryLabel(article)}</Badge>
        </Link>
        <Link to={`/articles/${article.slug}`}>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.1] text-ink-950 group-hover:text-gold-700 md:text-5xl">
            {article.title}
          </h2>
        </Link>
        {article.subtitle && <p className="mt-3 text-lg leading-relaxed text-ink-700">{article.subtitle}</p>}
        <ArticleByline article={article} />
      </div>
    </article>
  );
}

export function SecondaryStory({ article }: { article: ArticleCardType }) {
  return (
    <article className="group border-b border-rule pb-5 last:border-b-0 last:pb-0">
      <Link to={`/category/${article.category?.slug ?? ''}`} className="hover:underline">
        <Badge>{categoryLabel(article)}</Badge>
      </Link>
      <Link to={`/articles/${article.slug}`}>
        <h3 className="mt-2 font-serif text-lg sm:text-2xl font-semibold leading-snug text-ink-950 group-hover:text-gold-700">
          {article.title}
        </h3>
      </Link>
      <ArticleByline article={article} compact />
    </article>
  );
}

/** Standard grid card for latest/category listings. */
export function StoryCard({ article }: { article: ArticleCardType }) {
  return (
    <article className="group flex flex-col">
      <Link to={`/articles/${article.slug}`} className="block overflow-hidden">
        {article.featuredImage ? (
          <img
            src={article.featuredImage.url}
            alt={article.imageAlt ?? article.title}
            width={article.featuredImage.width ?? 800}
            height={article.featuredImage.height ?? 450}
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="aspect-[16/10] w-full bg-paper-dark" />
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        <Link to={`/category/${article.category?.slug ?? ''}`} className="hover:underline">
          <Badge>{categoryLabel(article)}</Badge>
        </Link>
        <Link to={`/articles/${article.slug}`}>
          <h3 className="mt-2 font-serif text-[1.55rem] font-semibold leading-snug text-ink-950 group-hover:text-gold-700">
            {article.title}
          </h3>
        </Link>
        {article.subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-500">{excerpt(article.subtitle, 120)}</p>}
        <div className="mt-auto pt-4">
          <ArticleByline article={article} compact />
        </div>
      </div>
    </article>
  );
}

/** Compact numbered row for trending / picks lists. */
export function RankedStory({ article, rank }: { article: ArticleCardType; rank: number }) {
  return (
    <article className="flex gap-4 border-b border-rule py-4 first:pt-0 last:border-b-0">
      <span className="font-serif text-3xl font-semibold leading-none text-rule-dark">{String(rank).padStart(2, '0')}</span>
      <div className="min-w-0">
        <Link to={`/articles/${article.slug}`} className="block">
          <h4 className="font-serif text-lg font-semibold leading-snug text-ink-950 hover:text-gold-700">{article.title}</h4>
        </Link>
        <p className="mt-1 text-xs text-ink-500">
          {categoryLabel(article)} · {readingTimeLabel(article.readingMinutes)}
        </p>
      </div>
    </article>
  );
}

export function ArticleByline({ article, compact = false }: { article: ArticleCardType; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500 ${compact ? 'mt-2' : 'mt-4'}`}>
      {article.author?.avatarUrl && (
        <img src={article.author.avatarUrl} alt="" className="size-6 rounded-full object-cover" loading="lazy" />
      )}
      <Link to={`/authors/${article.author?.slug ?? ''}`} className="font-semibold text-ink-700 hover:text-gold-700">
        {article.author?.name ?? 'Staff'}
      </Link>
      <span aria-hidden>·</span>
      <time dateTime={article.publishedAt ?? undefined}>{formatDate(article.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{readingTimeLabel(article.readingMinutes)}</span>
    </div>
  );
}
