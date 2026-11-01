import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../infrastructure/api/repositories';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Pagination, Select } from '../../presentation/primitives';
import { getAdminPath } from '../../app/config/adminPath';
import { formatDate, formatNumber } from '../../domain/value-objects/format';
import { SkeletonTable } from '../../presentation/components/skeletons';
import { useDebounced } from '../../application/hooks/useDebounced';

export default function AdminArticles() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounced(rawSearch, 250);
  const [deleting, setDeleting] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', page, status, search],
    queryFn: () => adminApi.adminListArticles({ page, perPage: 15, status: status || undefined, search: search || undefined, orderBy: 'updatedAt' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteArticle(id),
    onSuccess: () => {
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ['admin-articles'] });
    },
  });

  const articles = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Articles</h1>
        <Link to={`${getAdminPath()}/articles/new`}><Button>+ New article</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search titles…" value={rawSearch} onChange={(e) => { setRawSearch(e.target.value); setPage(1); }} className="w-full flex-1" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full sm:w-48">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : articles.length === 0 ? (
        <EmptyState title="No articles found" body="Create your first article to get started.">
          <Link to={`${getAdminPath()}/articles/new`}><Button>Create article</Button></Link>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto border border-rule-dark bg-white">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-rule-dark text-[0.65rem] uppercase tracking-widest text-ink-500">
                <th className="px-4 py-3">Title</th>
                <th className="w-36 px-4 py-3">Category</th>
                <th className="w-28 px-4 py-3">Status</th>
                <th className="w-20 px-4 py-3">Views</th>
                <th className="w-28 px-4 py-3">Updated</th>
                <th className="w-40 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-paper-dark/50">
                  <td className="max-w-xs px-4 py-3">
                    <Link to={`${getAdminPath()}/articles/${a.id}/edit`} className="font-semibold hover:text-gold-700">{a.title}</Link>
                    <div className="mt-1 flex gap-1.5">
                      {a.featured && <Badge>Featured</Badge>}
                      {a.editorsPick && <Badge tone="neutral">Pick</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{a.category.name}</td>
                  <td className="px-4 py-3"><Badge tone={a.status === 'PUBLISHED' ? 'green' : a.status === 'ARCHIVED' ? 'red' : 'neutral'}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-ink-500">{formatNumber(a.viewCount)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(a.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/articles/${a.slug}`} target="_blank" className="text-xs font-semibold text-ink-500 hover:text-gold-700">View</Link>
                      <Link to={`${getAdminPath()}/articles/${a.id}/edit`} className="text-xs font-semibold text-ink-700 hover:text-gold-700">Edit</Link>
                      <button onClick={() => setDeleting(a.id)} className="text-xs font-semibold text-red-700 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={page} pages={data.pages} onPage={setPage} label="Articles" />}

      <ConfirmDialog
        open={!!deleting}
        title="Delete article?"
        body="The article will be archived and hidden from the site. This is recoverable only by an administrator in the database."
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
