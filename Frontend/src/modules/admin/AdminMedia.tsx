import { mediaUrl } from '../../app/config/site';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../infrastructure/api/repositories';
import { Alert, ConfirmDialog, EmptyState, Field, Input, Pagination } from '../../presentation/primitives';
import { FileDrop } from '../tools/shared';
import { convertAllToWebP } from '../../infrastructure/adapters/webp';
import { formatBytes, formatDate } from '../../domain/value-objects/format';
import { Skeleton } from '../../presentation/components/skeletons';

export default function AdminMedia() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [alt, setAlt] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-media', page, search],
    queryFn: () => adminApi.media(page, search || undefined),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const converted = await convertAllToWebP(files);
      const form = new FormData();
      converted.forEach((f) => form.append('files', f));
      return adminApi.uploadMedia(form);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-media'] }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Upload failed'),
  });

  const updateAlt = useMutation({
    mutationFn: ({ id, altText }: { id: string; altText: string }) => adminApi.updateMedia(id, { altText }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-media'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteMedia(id),
    onSuccess: () => { setDeleting(null); void qc.invalidateQueries({ queryKey: ['admin-media'] }); },
    onError: (err) => { setDeleting(null); setError(err instanceof Error ? err.message : 'Delete failed'); },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 24) || 1;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Media library</h1>
      {error && <Alert>{error}</Alert>}

      <FileDrop accept="image/*,application/pdf" multiple onFiles={(files) => upload.mutate(files)} hint={`Images are converted to WebP in your browser · PDFs stored as-is · ${upload.isPending ? 'Uploading…' : 'up to 10 MB each'}`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Search files…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <p className="text-sm text-ink-500">{total} item{total === 1 ? '' : 's'}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3,4,5,6,7].map((i) => (
          <div key={i} className="border border-rule-dark bg-white"><Skeleton className="aspect-[4/3] w-full rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-2.5 w-1/2" /></div></div>
        ))}</div>
      ) : items.length === 0 ? (
        <EmptyState title="No media yet" body="Upload images above to use them as article featured images." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m) => (
            <div key={m.id} className="border border-rule-dark bg-white">
              {m.mimeType.startsWith('image/') ? (
                <img src={mediaUrl(m.url)} alt={m.altText ?? ''} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-paper-dark text-sm text-ink-500">{m.mimeType}</div>
              )}
              <div className="space-y-2 p-3">
                <p className="truncate text-xs font-semibold" title={m.originalName}>{m.originalName}</p>
                <p className="text-[0.65rem] text-ink-400">{formatBytes(m.size)} · {formatDate(m.createdAt)}</p>
                <Field label="Alt text">
                  <Input value={alt[m.id] ?? m.altText ?? ''} onChange={(e) => setAlt({ ...alt, [m.id]: e.target.value })} onBlur={() => updateAlt.mutate({ id: m.id, altText: alt[m.id] ?? m.altText ?? '' })} className="!py-1.5 !text-xs" />
                </Field>
                <div className="flex justify-between text-xs font-semibold">
                  <button onClick={() => void navigator.clipboard.writeText(m.id)} className="text-ink-500 hover:text-gold-700" title="Copy media ID for the article editor">Copy ID</button>
                  <button onClick={() => setDeleting(m.id)} className="text-red-700 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPage={setPage} label="Media" />

      <ConfirmDialog
        open={!!deleting}
        title="Delete media?"
        body="The file is removed from disk and the library. Media in use by articles cannot be deleted."
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
