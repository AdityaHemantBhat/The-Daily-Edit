import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthor } from '../../application/hooks/usePublicData';
import { StoryCard } from '../../presentation/components/ArticleCards';
import { Alert, EmptyState, Skeleton } from '../../presentation/primitives';
import { setPageMeta } from '../../application/services/seo';

export function AuthorPage() {
  const { slug = '' } = useParams();
  const { data: author, isLoading } = useAuthor(slug);

  useEffect(() => {
    if (author) setPageMeta({ title: author.name, description: author.bio ?? undefined, path: `/authors/${author.slug}` });
  }, [author]);

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-16"><Skeleton className="h-32 w-2/3" /></div>;
  if (!author) return <div className="mx-auto max-w-3xl px-4 py-20"><Alert>Author not found.</Alert></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="flex flex-col items-start gap-6 border-b-2 border-ink-900 pb-10 sm:flex-row sm:items-center">
        {author.avatarUrl ? (
          <img src={author.avatarUrl} alt={author.name} className="size-24 rounded-full object-cover" />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-ink-950 font-serif text-4xl font-bold text-paper">
            {author.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-gold-600">{author.jobTitle ?? 'Author'}</p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-950">{author.name}</h1>
          {author.bio && <p className="mt-3 max-w-2xl text-ink-500">{author.bio}</p>}
          {author._count ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-ink-400">
              {author._count.articles} published article{author._count.articles === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      </header>

      <div className="py-12">
        {author.articles?.length ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {author.articles.map((a) => <StoryCard key={a.id} article={a as never} />)}
          </div>
        ) : (
          <EmptyState title="No published articles yet" />
        )}
      </div>
    </div>
  );
}
export default AuthorPage;
