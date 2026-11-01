import { mediaUrl } from '../../app/config/site';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, publicApi } from '../../infrastructure/api/repositories';
import { Alert, Button, ConfirmDialog, Field, Input, Spinner, Textarea } from '../../presentation/primitives';
import { convertAllToWebP } from '../../infrastructure/adapters/webp';
import { MediaLibraryModal } from './MediaLibraryModal';
import { ImagePlus, Library, X } from 'lucide-react';
import { useRef } from 'react';

interface Editing { id?: string; name: string; email: string; bio: string; jobTitle: string; avatarUrl: string }

const EMPTY: Editing = { name: '', email: '', bio: '', jobTitle: '', avatarUrl: '' };

export default function AdminAuthors() {
  const qc = useQueryClient();
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarLibraryOpen, setAvatarLibraryOpen] = useState(false);

  async function uploadAvatar(files: File[]): Promise<string | null> {
    setAvatarUploading(true);
    try {
      const [converted] = await convertAllToWebP(files);
      const form = new FormData();
      form.append('files', converted);
      const res = await adminApi.uploadMedia(form);
      void qc.invalidateQueries({ queryKey: ['admin-media'] });
      return res.items[0].url;
    } catch {
      return null;
    } finally {
      setAvatarUploading(false);
    }
  }
  const { data } = useQuery({ queryKey: ['authors'], queryFn: publicApi.authors });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (e: Editing) => {
      const payload = {
        name: e.name, email: e.email || undefined, bio: e.bio || undefined,
        jobTitle: e.jobTitle || undefined, avatarUrl: e.avatarUrl || undefined,
      };
      return e.id ? adminApi.updateAuthor(e.id, payload) : adminApi.createAuthor(payload);
    },
    onSuccess: () => { setEditing(null); setError(null); void qc.invalidateQueries({ queryKey: ['authors'] }); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Save failed'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteAuthor(id),
    onSuccess: () => { setDeleting(null); void qc.invalidateQueries({ queryKey: ['authors'] }); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Delete failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Authors</h1>
        <Button onClick={() => setEditing(EMPTY)}>+ New author</Button>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.items ?? []).map((a) => (
          <div key={a.id} className="border border-rule-dark bg-white p-4">
            <div className="flex items-center gap-3">
              {a.avatarUrl ? (
                <img src={mediaUrl(a.avatarUrl)} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-ink-950 font-serif text-xl font-bold text-paper">{a.name.charAt(0)}</div>
              )}
              <div>
                <p className="font-semibold">{a.name}</p>
                <p className="text-xs text-ink-500">{a.jobTitle} · {a._count?.articles ?? 0} articles</p>
              </div>
            </div>
            {a.bio && <p className="mt-3 line-clamp-2 text-xs text-ink-500">{a.bio}</p>}
            <div className="mt-3 flex gap-3 text-xs font-semibold">
              <button onClick={() => setEditing({ id: a.id, name: a.name, email: a.email ?? '', bio: a.bio ?? '', jobTitle: a.jobTitle ?? '', avatarUrl: a.avatarUrl ?? '' })} className="text-ink-700 hover:text-gold-700">Edit</button>
              <button onClick={() => setDeleting(a.id)} className="text-red-700 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" onClick={() => setEditing(null)}>
          <form className="w-full max-w-lg space-y-4 bg-white p-6" onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}>
            <h2 className="font-serif text-2xl font-semibold">{editing.id ? 'Edit author' : 'New author'}</h2>
            <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required /></Field>
            <Field label="Job title"><Input value={editing.jobTitle} onChange={(e) => setEditing({ ...editing, jobTitle: e.target.value })} placeholder="Senior Editor" /></Field>
            <Field label="Email"><Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <div>
              <p className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Avatar</p>
              <div className="flex items-stretch gap-3">
                <div className="relative size-16 shrink-0 rounded-full border border-rule bg-[repeating-conic-gradient(#f5f5f4_0%_25%,#ffffff_0%_50%)] bg-[length:10px_10px]">
                  {editing.avatarUrl ? (
                    <>
                      <img src={mediaUrl(editing.avatarUrl)} alt="Avatar preview" className="absolute inset-0 size-full rounded-full object-cover" />
                      <button type="button" onClick={() => setEditing({ ...editing, avatarUrl: '' })} className="absolute -right-1 -top-1 z-10 rounded-full bg-ink-950 p-0.5 text-paper hover:bg-red-700" aria-label="Remove avatar">
                        <X className="size-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex size-full items-center justify-center text-ink-400"><ImagePlus className="size-5" aria-hidden /></div>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-1.5">
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => avatarFileRef.current?.click()} disabled={avatarUploading} className="inline-flex items-center gap-1 rounded border border-rule-dark px-2 py-1 text-xs font-semibold text-ink-700 hover:border-ink-900 disabled:opacity-50">
                      {avatarUploading ? <Spinner className="size-3" /> : <ImagePlus className="size-3" aria-hidden />} {avatarUploading ? 'Uploading…' : 'Upload'}
                    </button>
                    <button type="button" onClick={() => setAvatarLibraryOpen(true)} className="inline-flex items-center gap-1 rounded border border-rule-dark px-2 py-1 text-xs font-semibold text-ink-700 hover:border-ink-900">
                      <Library className="size-3" aria-hidden /> Library
                    </button>
                  </div>
                  {avatarUploading && <p className="text-[0.65rem] text-ink-400">Converting to WebP…</p>}
                </div>
              </div>
              <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                if (e.target.files?.length) {
                  const url = await uploadAvatar(Array.from(e.target.files));
                  if (url) setEditing({ ...editing, avatarUrl: url });
                }
                e.target.value = '';
              }} />
              <MediaLibraryModal open={avatarLibraryOpen} onClose={() => setAvatarLibraryOpen(false)} onSelect={(media) => { setEditing({ ...editing, avatarUrl: media.url }); setAvatarLibraryOpen(false); }} />
            </div>
            <Field label="Bio"><Textarea rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete author?"
        body="Authors with published articles cannot be deleted — reassign their articles first."
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
