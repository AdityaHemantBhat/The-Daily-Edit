import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, publicApi } from '../../infrastructure/api/repositories';
import { Alert, Button, ConfirmDialog, Field, Input, Select, Textarea } from '../../presentation/primitives';
import { SkeletonTable } from '../../presentation/components/skeletons';

interface Editing { id?: string; name: string; description: string; order: number }

export default function AdminCategories() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: publicApi.categories });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string; articles: number } | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (e: Editing) =>
      e.id ? adminApi.updateCategory(e.id, { name: e.name, description: e.description, order: e.order }) : adminApi.createCategory({ name: e.name, description: e.description, order: e.order }),
    onSuccess: () => {
      setEditing(null);
      setError(null);
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Save failed'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id, moveTo || undefined),
    onSuccess: () => {
      setDeleting(null);
      setMoveTo('');
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Delete failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Categories</h1>
        <Button onClick={() => setEditing({ name: '', description: '', order: 0 })}>+ New category</Button>
      </div>
      {error && <Alert>{error}</Alert>}
      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <div className="border border-rule-dark bg-white">
          <table className="w-full table-fixed text-left text-sm">
            <thead><tr className="border-b border-rule-dark text-[0.65rem] uppercase tracking-widest text-ink-500">
              <th className="px-4 py-3">Name</th><th className="w-56 px-4 py-3">Slug</th><th className="w-24 px-4 py-3">Articles</th><th className="w-20 px-4 py-3">Order</th><th className="w-36 px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-rule">
              {(data?.items ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{c.slug}</td>
                  <td className="px-4 py-3 text-ink-500">{c._count?.articles ?? 0}</td>
                  <td className="px-4 py-3 text-ink-500">{c.order}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing({ id: c.id, name: c.name, description: c.description ?? '', order: c.order })} className="text-xs font-semibold text-ink-700 hover:text-gold-700">Edit</button>
                    <button onClick={() => setDeleting({ id: c.id, name: c.name, articles: c._count?.articles ?? 0 })} className="ml-3 text-xs font-semibold text-red-700 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" onClick={() => setEditing(null)}>
          <form
            className="w-full max-w-lg space-y-4 bg-white p-6"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}
          >
            <h2 className="font-serif text-2xl font-semibold">{editing.id ? 'Edit category' : 'New category'}</h2>
            <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required /></Field>
            <Field label="Description">
              <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="Sort order"><Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} /></Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting && deleting.articles === 0}
        title={deleting && deleting.articles > 0 ? `Reassign ${deleting.articles} articles?` : `Delete “${deleting?.name}”?`}
        body={deleting && deleting.articles > 0
          ? 'Choose a category to move these articles into, then confirm.'
          : 'This category has no articles and will be removed permanently.'}
        confirmLabel="Confirm"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
      {deleting && deleting.articles > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" onClick={() => setDeleting(null)}>
          <div className="w-full max-w-md space-y-4 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl font-semibold">Move articles to…</h2>
            <Field label="Target category">
              <Select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                <option value="">Select…</option>
                {(data?.items ?? []).filter((c) => c.id !== deleting.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" disabled={!moveTo || remove.isPending} onClick={() => remove.mutate(deleting.id)}>Move & delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
