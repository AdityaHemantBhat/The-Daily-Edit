import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../infrastructure/api/repositories';
import { Button, ConfirmDialog, EmptyState, Pagination, Select } from '../../presentation/primitives';
import { formatDate } from '../../domain/value-objects/format';
import { SkeletonTable } from '../../presentation/components/skeletons';

interface CommentRow {
  id: string; authorName: string; authorEmail: string; body: string; status: string; createdAt: string;
  article: { title: string; slug: string };
}

const COMMENTS_PER_PAGE = 8;

export default function AdminComments() {
  const [status, setStatus] = useState('PENDING');
  const [viewPage, setViewPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-comments', status], queryFn: () => adminApi.comments(status) });
  const moderate = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => adminApi.updateComment(id, s),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-comments'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteComment(id),
    onSuccess: () => { setDeleting(null); void qc.invalidateQueries({ queryKey: ['admin-comments'] }); },
  });

  const items = (data?.items ?? []) as CommentRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Comment moderation</h1>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setViewPage(1); }} className="max-w-40">
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="SPAM">Spam</option>
          <option value="TRASHED">Trashed</option>
          <option value="ALL">All</option>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing here" body={`No ${status === 'ALL' ? '' : status.toLowerCase() + ' '}comments.`} />
      ) : (
        <div className="space-y-3">
          {items.slice((viewPage - 1) * COMMENTS_PER_PAGE, viewPage * COMMENTS_PER_PAGE).map((c) => (
            <div key={c.id} className="border border-rule-dark bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
                <span><strong className="text-ink-950">{c.authorName}</strong> · {c.authorEmail} · {formatDate(c.createdAt)}</span>
                <Link to={`/articles/${c.article.slug}`} target="_blank" className="hover:text-gold-700">on “{c.article.title}” ↗</Link>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{c.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => moderate.mutate({ id: c.id, s: 'APPROVED' })} disabled={c.status === 'APPROVED'}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: c.id, s: 'SPAM' })} disabled={c.status === 'SPAM'}>Spam</Button>
                <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: c.id, s: 'TRASHED' })} disabled={c.status === 'TRASHED'}>Trash</Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting(c.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > COMMENTS_PER_PAGE && (
        <Pagination
          page={viewPage}
          pages={Math.ceil(items.length / COMMENTS_PER_PAGE)}
          onPage={setViewPage}
          label="Comments"
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete comment permanently?"
        body="This cannot be undone."
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
