import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, publicApi } from '../../infrastructure/api/repositories';
import { Alert, Badge, Button, ConfirmDialog, Field, Input, Select, Textarea } from '../../presentation/primitives';
import { SkeletonTable } from '../../presentation/components/skeletons';
import type { Tool } from '../../domain/entities';

interface Editing {
  id?: string;
  name: string; slug: string; description: string; instructions: string;
  componentKey: string; categoryId: string; enabled: boolean; featured: boolean; order: number;
  seoTitle: string; seoDescription: string;
}

const EMPTY: Editing = {
  name: '', slug: '', description: '', instructions: '', componentKey: '',
  categoryId: '', enabled: true, featured: false, order: 0, seoTitle: '', seoDescription: '',
};

export default function AdminTools() {
  const qc = useQueryClient();
  const { data: tools, isLoading } = useQuery({ queryKey: ['admin-tools'], queryFn: adminApi.toolsAll });
  const { data: cats } = useQuery({ queryKey: ['toolCategories'], queryFn: publicApi.toolCategories });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-tools'] });
    void qc.invalidateQueries({ queryKey: ['toolCategories'] });
    void qc.invalidateQueries({ queryKey: ['tools'] });
  };

  const save = useMutation({
    mutationFn: (e: Editing) => {
      const payload = {
        name: e.name,
        slug: e.slug || undefined,
        description: e.description,
        instructions: e.instructions || undefined,
        componentKey: e.componentKey,
        categoryId: e.categoryId,
        enabled: e.enabled,
        featured: e.featured,
        order: e.order,
        seoTitle: e.seoTitle || undefined,
        seoDescription: e.seoDescription || undefined,
      };
      return e.id ? adminApi.updateTool(e.id, payload) : adminApi.createTool(payload);
    },
    onSuccess: () => { setEditing(null); setError(null); invalidate(); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Save failed'),
  });

  const toggle = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Tool> }) => adminApi.updateTool(id, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteTool(id),
    onSuccess: () => { setDeleting(null); invalidate(); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Delete failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Tools management</h1>
        <Button onClick={() => setEditing(EMPTY)}>+ Add tool</Button>
      </div>
      {error && <Alert>{error}</Alert>}
      {isLoading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : (
        <div className="overflow-x-auto border border-rule-dark bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule-dark text-[0.65rem] uppercase tracking-widest text-ink-500">
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {(tools?.items ?? []).map((t) => (
                <tr key={t.id} className={t.enabled ? '' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{t.name}</p>
                    <p className="font-mono text-[0.65rem] text-ink-400">{t.componentKey}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{t.category.name}</td>
                  <td className="px-4 py-3 text-ink-500">{t.order}</td>
                  <td className="px-4 py-3 space-x-1.5">
                    {t.enabled ? <Badge tone="green">Enabled</Badge> : <Badge tone="red">Disabled</Badge>}
                    {t.featured && <Badge>Featured</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle.mutate({ id: t.id, patch: { enabled: !t.enabled } })}
                      className="text-xs font-semibold text-ink-700 hover:text-gold-700"
                    >
                      {t.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setEditing({
                        id: t.id, name: t.name, slug: t.slug, description: t.description,
                        instructions: t.instructions ?? '', componentKey: t.componentKey,
                        categoryId: t.categoryId, enabled: t.enabled, featured: t.featured,
                        order: t.order, seoTitle: t.seoTitle ?? '', seoDescription: t.seoDescription ?? '',
                      })}
                      className="ml-3 text-xs font-semibold text-ink-700 hover:text-gold-700"
                    >
                      Edit
                    </button>
                    <button onClick={() => setDeleting(t.id)} className="ml-3 text-xs font-semibold text-red-700 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 p-4" onClick={() => setEditing(null)}>
          <form className="my-8 w-full max-w-xl space-y-4 bg-white p-6" onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}>
            <h2 className="font-serif text-2xl font-semibold">{editing.id ? 'Edit tool' : 'New tool'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required /></Field>
              <Field label="Slug (optional)"><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="font-mono text-sm" /></Field>
              <Field label="Component key" hint="Registry key, e.g. merge-pdf">
                <Input value={editing.componentKey} onChange={(e) => setEditing({ ...editing, componentKey: e.target.value })} required className="font-mono text-sm" />
              </Field>
              <Field label="Category">
                <Select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })} required>
                  <option value="">Select…</option>
                  {(cats?.items ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Sort order"><Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} /></Field>
              <div className="space-y-2 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="accent-[#a16207]" /> Enabled
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="accent-[#a16207]" /> Featured
                </label>
              </div>
            </div>
            <Field label="Description"><Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} required /></Field>
            <Field label="Instructions"><Textarea rows={3} value={editing.instructions} onChange={(e) => setEditing({ ...editing, instructions: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SEO title"><Input value={editing.seoTitle} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} /></Field>
              <Field label="SEO description"><Input value={editing.seoDescription} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete tool?"
        body="The tool is removed from the directory and its usage statistics are deleted."
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
