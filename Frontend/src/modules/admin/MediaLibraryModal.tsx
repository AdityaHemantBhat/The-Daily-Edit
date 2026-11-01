import { mediaUrl } from '../../app/config/site';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { adminApi } from '../../infrastructure/api/repositories';
import { EmptyState, Input, Pagination, Spinner } from '../../presentation/primitives';
import { convertAllToWebP } from '../../infrastructure/adapters/webp';
import { formatBytes, formatDate } from '../../domain/value-objects/format';

/**
 * Shared media-library browser: search, upload (WebP-converted), and select
 * an image. Used by the article editor's featured-image picker and the
 * settings logo/favicon fields.
 */
export function MediaLibraryModal({
  open, onClose, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: { id: string; url: string }) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media-picker', page, search],
    queryFn: () => adminApi.media(page, search || undefined),
    enabled: open,
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const converted = await convertAllToWebP(files);
      const form = new FormData();
      converted.forEach((f) => form.append('files', f));
      return adminApi.uploadMedia(form);
    },
    onSuccess: (res) => {
      setUploadError(null);
      onSelect({ id: res.items[0].id, url: res.items[0].url });
      void qc.invalidateQueries({ queryKey: ['admin-media'] });
      onClose();
    },
    onError: (err) => setUploadError(err instanceof Error ? err.message : 'Upload failed'),
  });

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / 24)) : 1;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Media library"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <h3 className="font-serif text-xl font-semibold">Media library</h3>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-paper-dark" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
          <Input
            placeholder="Search files…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 bg-ink-900 px-3.5 py-2 text-xs font-semibold uppercase tracking-widest text-paper hover:bg-ink-950">
            <ImagePlus className="size-3.5" aria-hidden />
            {upload.isPending ? 'Uploading…' : 'Upload new'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) upload.mutate(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scroll-thin">
          {uploadError && <p className="mb-3 text-sm text-red-700">{uploadError}</p>}
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner className="size-8" /></div>
          ) : items.length === 0 ? (
            <EmptyState title="No media yet" body="Use the Upload button above to add your first image." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (!m.mimeType.startsWith('image/')) return;
                    onSelect({ id: m.id, url: m.url });
                    onClose();
                  }}
                  className="border border-rule text-left transition-colors hover:border-ink-900"
                >
                  {m.mimeType.startsWith('image/') ? (
                    <img src={mediaUrl(m.url)} alt={m.altText ?? ''} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-paper-dark text-[0.6rem] text-ink-400">{m.mimeType}</div>
                  )}
                  <div className="p-2">
                    <p className="truncate text-[0.65rem] font-semibold" title={m.originalName}>{m.originalName}</p>
                    <p className="text-[0.6rem] text-ink-400">{formatBytes(m.size)} · {formatDate(m.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-rule px-5 py-3">
          <Pagination page={page} pages={totalPages} onPage={setPage} label="Media" />
        </div>
      </div>
    </div>
  );
}
