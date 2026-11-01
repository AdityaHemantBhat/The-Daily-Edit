import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSearch } from '../../application/hooks/usePublicData';
import { StoryCard } from '../../presentation/components/ArticleCards';
import { setPageMeta } from '../../application/services/seo';
import { excerpt } from '../../domain/value-objects/format';
import { SkeletonSearch } from '../../presentation/components/skeletons';
import { Container, EmptyState, Input, Button, Pagination } from '../../presentation/primitives';

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [raw, setRaw] = useState(params.get('q') ?? '');
  const q = params.get('q') ?? '';
  const [page, setPage] = useState(1);
  const { data, isFetching } = useSearch(q, page);

  useEffect(() => {
    setPageMeta({ title: q ? `Search: ${q}` : 'Search', path: '/search', noindex: true });
  }, [q]);

  return (
    <Container className="py-12">
      <h1 className="font-serif text-4xl font-semibold">Search</h1>
      <form
        className="mt-6 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setParams(raw.trim() ? { q: raw.trim() } : {});
        }}
      >
        <Input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Search articles, tools and topics…" aria-label="Search query" />
        <Button type="submit">Search</Button>
      </form>

      {q && (
        <div className="mt-10">
          {isFetching && <SkeletonSearch />}

          {!isFetching && data && (
            <>
              <p className="mb-6 text-sm text-ink-500">
                {data.articles.total} article{data.articles.total === 1 ? '' : 's'}
                {data.tools.length ? ` · ${data.tools.length} tool${data.tools.length === 1 ? '' : 's'}` : ''} for “{q}”
              </p>

              {data.tools.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-4 border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">Tools</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.tools.map((t) => (
                      <Link key={t.slug} to={`/tools/${t.slug}`} className="border border-rule p-4 transition-colors hover:border-ink-900">
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gold-600">{t.category.name}</p>
                        <p className="mt-1 font-serif text-xl font-semibold">{t.name}</p>
                        <p className="mt-1 text-sm text-ink-500">{excerpt(t.description, 100)}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {data.articles.items.length > 0 ? (
                <section>
                  <h2 className="mb-4 border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">Articles</h2>
                  <div className="grid gap-8 sm:grid-cols-2">
                    {data.articles.items.map((a) => <StoryCard key={a.id} article={a} />)}
                  </div>
                  {data.articles.pages > 1 && (
                    <div className="mt-10">
                      <Pagination page={page} pages={data.articles.pages} onPage={setPage} label="Search results" />
                    </div>
                  )}
                </section>
              ) : (
                <EmptyState title="No articles found" body={`Try different keywords, or browse the tools directory.`} />
              )}
            </>
          )}
        </div>
      )}
    </Container>
  );
}
export default SearchPage;
