import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArticles, useCategory } from '../../application/hooks/usePublicData';
import { StoryCard } from '../../presentation/components/ArticleCards';
import { AdSlot } from '../../presentation/components/AdSlot';
import { Alert, Button, EmptyState, Skeleton } from '../../presentation/primitives';
import { breadcrumbJsonLd, setPageMeta } from '../../application/services/seo';
import { SkeletonListing } from '../../presentation/components/skeletons';

const PER_PAGE = 9;

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [page, setPage] = useState(1);
  const { data: category, isLoading: catLoading, isError } = useCategory(slug);
  const { data: articles, isLoading } = useArticles({ category: slug, page, perPage: PER_PAGE });

  useEffect(() => setPage(1), [slug]);

  useEffect(() => {
    if (!category) return;
    setPageMeta({
      title: category.seoTitle ?? category.name,
      description: category.seoDescription ?? category.description ?? undefined,
      path: `/category/${category.slug}`,
      jsonLd: breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: category.name, path: `/category/${category.slug}` },
      ]),
    });
  }, [category]);

  if (catLoading) return <SkeletonListing />;
  if (isError || !category) {
    return <div className="mx-auto max-w-3xl px-4 py-20"><Alert>Category not found.</Alert></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="border-b-2 border-ink-900 pb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-gold-600">Section</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-950">{category.name}</h1>
        {category.description && <p className="mt-3 max-w-2xl text-ink-500">{category.description}</p>}
        {category._count ? (
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-ink-400">
            {category._count.articles} article{category._count.articles === 1 ? '' : 's'}
          </p>
        ) : null}
      </header>

      <div className="py-10">
        <AdSlot placement="home_mid" minHeight={90} className="mb-10" />
        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[3/2]" />)}</div>
        ) : articles?.items.length ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {articles.items.map((a) => <StoryCard key={a.id} article={a} />)}
          </div>
        ) : (
          <EmptyState title="Nothing published here yet" body="Check back soon — new stories land in this section regularly.">
            <Link to="/"><Button variant="outline">Browse all stories</Button></Link>
          </EmptyState>
        )}

        {articles && articles.pages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</Button>
            <span className="text-sm text-ink-500">Page {page} of {articles.pages}</span>
            <Button variant="outline" size="sm" disabled={page >= articles.pages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
          </div>
        )}
      </div>
    </div>
  );
}
export default CategoryPage;
