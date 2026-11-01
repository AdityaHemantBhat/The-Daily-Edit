import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { adminApi } from '../../infrastructure/api/repositories';
import { Button, ConfirmDialog, Input, Pagination } from '../../presentation/primitives';

const TAGS_PER_PAGE = 48;

export default function AdminTags() {
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewPage, setViewPage] = useState(1);
  const [sort, setSort] = useState<'name' | 'usage'>('name');
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ['tags', search], queryFn: () => adminApi.tags(search || undefined) });
  const create = useMutation({
    mutationFn: () => adminApi.createTag(name.trim()),
    onSuccess: () => { setName(''); void qc.invalidateQueries({ queryKey: ['tags'] }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteTag(id),
    onSuccess: () => { setDeleting(null); void qc.invalidateQueries({ queryKey: ['tags'] }); },
  });

  const tags = useMemo(() => {
    const items = [...(data?.items ?? [])];
    items.sort((a, b) =>
      sort === 'usage'
        ? (b._count?.articles ?? 0) - (a._count?.articles ?? 0) || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
    return items;
  }, [data, sort]);

  const totalTags = data?.items.length ?? 0;
  const totalUses = (data?.items ?? []).reduce((n, t) => n + (t._count?.articles ?? 0), 0);
  const unused = (data?.items ?? []).filter((t) => !t._count?.articles).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Tags</h1>
        <div className="flex gap-6 text-right">
          <div>
            <p className="font-serif text-2xl font-semibold">{totalTags}</p>
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-ink-400">Tags</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold">{totalUses}</p>
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-ink-400">In use</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold">{unused}</p>
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-ink-400">Unused</p>
          </div>
        </div>
      </div>

      {/* Add + filter row */}
      <div className="grid gap-4 border border-rule-dark bg-white p-5 md:grid-cols-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New tag name…" className="flex-1" />
          <Button type="submit" disabled={!name.trim() || create.isPending}>
            <Plus className="size-4" aria-hidden /> Add tag
          </Button>
        </form>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setViewPage(1); }} placeholder="Filter tags…" className="pl-9" />
          </div>
          <Button size="sm" variant="outline" onClick={() => setSort(sort === 'name' ? 'usage' : 'name')} title="Toggle sorting">
            Sort: {sort === 'name' ? 'A–Z' : 'Most used'}
          </Button>
        </div>
      </div>

      {/* Tag cloud */}
      <div className="min-h-96 border border-rule-dark bg-white p-6">
        {tags.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-400">
            {search ? `No tags match “${search}”.` : 'No tags yet — create the first one above.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {tags.slice((viewPage - 1) * TAGS_PER_PAGE, viewPage * TAGS_PER_PAGE).map((t) => {
              const uses = t._count?.articles ?? 0;
              return (
                <span
                  key={t.id}
                  className={`group flex items-center gap-2 rounded-full border py-1.5 pl-3.5 pr-2 text-sm transition-colors ${
                    uses === 0 ? 'border-dashed border-rule-dark text-ink-400' : 'border-rule-dark text-ink-950'
                  }`}
                >
                  {t.name}
                  <span className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold ${uses ? 'bg-gold-100 text-gold-700' : 'bg-paper-dark text-ink-400'}`}>
                    {uses}
                  </span>
                  <button
                    onClick={() => setDeleting(t.id)}
                    className="ml-0.5 text-ink-400 hover:text-red-700"
                    aria-label={`Delete ${t.name}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {tags.length > TAGS_PER_PAGE && (
        <Pagination
          page={viewPage}
          pages={Math.ceil(tags.length / TAGS_PER_PAGE)}
          onPage={setViewPage}
          label="Tags"
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete tag?"
        body="The tag is removed from all articles that use it."
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
