import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { adminApi, publicApi, type ArticleWritePayload } from '../../infrastructure/api/repositories';
import { ApiError } from '../../infrastructure/api/http';
import { MediaPicker } from './MediaPicker';
import { DateTimePicker } from './DateTimePicker';
import { Alert, Badge, Button, Field, Input, Select, Spinner, Textarea } from '../../presentation/primitives';

function slugifyText(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 96);
}

// Toolbar: detects whether the article is HTML or markdown (the article page
// renders both) and emits matching syntax. Inline transforms keep the cursor
// collapsed after inserting so consecutive clicks never nest or duplicate.
type EditorMode = 'html' | 'md';

function editorMode(content: string | undefined): EditorMode {
  return (content ?? '').trimStart().startsWith('<') ? 'html' : 'md';
}

function inlineWrap(open: string, close: string) {
  return (sel: string) => (sel ? `${open}${sel}${close}` : `${open}${close}`);
}

function blockWrap(tag: string) {
  return (sel: string) =>
    (sel || `${tag} text`).split('\n').filter((l) => l.trim()).map((l) => `<${tag}>${l.trim()}</${tag}>`).join('\n');
}

function listHtml(ordered: boolean) {
  return (sel: string) => {
    const items = (sel || 'list item').split('\n').filter((l) => l.trim()).map((l) => `  <li>${l.trim()}</li>`);
    return `<${ordered ? 'ol' : 'ul'}>\n${items.join('\n')}\n</${ordered ? 'ol' : 'ul'}>`;
  };
}

function listMd(prefix: (i: number) => string) {
  return (sel: string) =>
    (sel || 'list item').split('\n').filter((l) => l.trim()).map((l, i) => `${prefix(i)}${l.trim()}`).join('\n');
}

function buildToolbar(mode: EditorMode): { label: string; title: string; transform: (sel: string) => string }[] {
  if (mode === 'md') {
    return [
      { label: 'H2', title: 'Section heading (##)', transform: inlineWrap('## ', '\n\n') },
      { label: 'H3', title: 'Sub-heading (###)', transform: inlineWrap('### ', '\n\n') },
      { label: 'H4', title: 'Minor heading (####)', transform: inlineWrap('#### ', '\n\n') },
      { label: 'H5', title: 'Minor heading (#####)', transform: inlineWrap('##### ', '\n\n') },
      { label: 'H6', title: 'Minor heading (######)', transform: inlineWrap('###### ', '\n\n') },
      { label: 'B', title: 'Bold (**text**)', transform: inlineWrap('**', '**') },
      { label: 'I', title: 'Italic (*text*)', transform: inlineWrap('*', '*') },
      { label: 'S', title: 'Strikethrough (~~text~~)', transform: inlineWrap('~~', '~~') },
      { label: 'Code', title: 'Inline code (`text`)', transform: inlineWrap('`', '`') },
      { label: '\u201c', title: 'Blockquote (> text)', transform: (sel) => (sel || 'quoted text').split('\n').filter((l) => l.trim()).map((l) => `> ${l.trim()}`).join('\n') },
      { label: '\u2022 List', title: 'Bullet list (- item)', transform: listMd(() => '- ') },
      { label: '1. List', title: 'Numbered list (1. item)', transform: listMd((i) => `${i + 1}. `) },
      { label: '</>', title: 'Code block (fenced)', transform: (sel) => `\`\`\`\n${sel || 'code here'}\n\`\`\`` },
      { label: 'Link', title: 'Link ([text](url))', transform: (sel) => {
        const url = window.prompt('Link URL (https://…)');
        if (!url) return sel;
        return `[${sel || url}](${url})`;
      } },
      { label: 'Image', title: 'Image (![alt](url))', transform: (sel) => {
        const url = window.prompt('Image URL (/media/… or https://…)');
        if (!url) return sel;
        const alt = window.prompt('Alt text (describe the image)') ?? '';
        return `![${alt}](${url})`;
      } },
      { label: '\u2014', title: 'Horizontal rule (---)', transform: () => '\n---\n' },
    ];
  }
  return [
    { label: 'H2', title: 'Section heading', transform: blockWrap('h2') },
    { label: 'H3', title: 'Sub-heading', transform: blockWrap('h3') },
    { label: 'H4', title: 'Minor heading', transform: blockWrap('h4') },
    { label: 'H5', title: 'Minor heading', transform: blockWrap('h5') },
    { label: 'H6', title: 'Minor heading', transform: blockWrap('h6') },
    { label: 'P', title: 'Paragraph', transform: blockWrap('p') },
    { label: 'B', title: 'Bold', transform: inlineWrap('<strong>', '</strong>') },
    { label: 'I', title: 'Italic', transform: inlineWrap('<em>', '</em>') },
    { label: 'S', title: 'Strikethrough', transform: inlineWrap('<del>', '</del>') },
    { label: 'Code', title: 'Inline code', transform: inlineWrap('<code>', '</code>') },
    { label: '\u201c', title: 'Blockquote', transform: (sel) => {
      const lines = (sel || 'quoted text').split('\n').filter((l) => l.trim()).map((l) => `  <p>${l.trim()}</p>`);
      return `<blockquote>\n${lines.join('\n')}\n</blockquote>`;
    } },
    { label: '\u2022 List', title: 'Bullet list', transform: listHtml(false) },
    { label: '1. List', title: 'Numbered list', transform: listHtml(true) },
    { label: '</>', title: 'Code block', transform: (sel) => `<pre><code>${sel || 'code here'}</code></pre>` },
    { label: 'Link', title: 'Link', transform: (sel) => {
      const url = window.prompt('Link URL (https://…)');
      if (!url) return sel;
      return `<a href="${url}">${sel || url}</a>`;
    } },
    { label: 'Image', title: 'Image with caption', transform: (sel) => {
      const url = window.prompt('Image URL (/media/… or https://…)');
      if (!url) return sel;
      const alt = window.prompt('Alt text (describe the image for accessibility)') ?? '';
      const caption = window.prompt('Caption (optional)') ?? '';
      return `<figure>\n  <img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" />\n  ${caption ? `<figcaption>${caption}</figcaption>` : ''}\n</figure>`;
    } },
    { label: '\u2014', title: 'Horizontal rule', transform: () => '<hr>' },
  ];
}



export default function ArticleEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: publicApi.categories });
  const { data: authors } = useQuery({ queryKey: ['authors'], queryFn: publicApi.authors });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: () => adminApi.tags() });
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: () => adminApi.articleById(id!),
    enabled: !isNew,
  });

  const [form, setForm] = useState<Partial<ArticleWritePayload>>({
    title: '', subtitle: '', content: '', status: 'DRAFT', tagIds: [],
    featured: false, editorsPick: false, trending: false,
    seo: {},
  });
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(undefined);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Hydrate from existing article
  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      subtitle: existing.subtitle ?? '',
      content: existing.content,
      status: existing.status,
      categoryId: existing.category?.id,
      authorId: existing.author?.id,
      tagIds: existing.tags?.map((t) => t.tag.id) ?? [],
      featured: existing.featured,
      editorsPick: existing.editorsPick,
      trending: existing.trending,
      featuredImageId: existing.featuredImage?.id ?? undefined,
      imageCaption: existing.imageCaption ?? '',
      imageAlt: existing.imageAlt ?? '',
      scheduledAt: existing.scheduledAt ?? undefined,
      publishedAt: existing.publishedAt ?? undefined,
      seo: existing.seo ?? {},
    });
    setFeaturedImageUrl(existing.featuredImage?.url ?? undefined);
    setSlugTouched(true);
  }, [existing]);

  // Toolbar syntax follows the article's format: HTML articles get HTML tags,
  // markdown articles get # / ** / > etc.
  const TOOLBAR_ACTIONS = buildToolbar(editorMode(form.content));

  const save = useMutation({
    mutationFn: async (data: Partial<ArticleWritePayload>) => {
      if (isNew) return adminApi.createArticle(data as ArticleWritePayload);
      return adminApi.updateArticle(id!, data);
    },
    onSuccess: (article) => {
      setSavedAt(new Date());
      setError(null);
      void qc.invalidateQueries({ queryKey: ['admin-articles'] });
      if (isNew) {
        navigate(`/admin/articles/${(article as { id: string }).id}/edit`, { replace: true });
      }
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details && typeof err.details === 'object') {
        const fieldMessages = Object.entries(err.details as Record<string, string[]>)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' · ');
        setError(fieldMessages ? `Please fix: ${fieldMessages}` : err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    },
  });

  // Autosave drafts every 30s after changes (only for existing articles).
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);
  useEffect(() => {
    if (isNew) return;
    const timer = setInterval(() => {
      const f = formRef.current;
      if (f.title && f.content && !save.isPending && !document.hidden) {
        void adminApi.updateArticle(id!, f).then(() => setSavedAt(new Date())).catch(() => undefined);
      }
    }, 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  function set<K extends keyof ArticleWritePayload>(key: K, value: ArticleWritePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function insertHtml(transform: (sel: string) => string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = form.content?.slice(start, end) ?? '';
    const inserted = transform(selected);
    const next = `${form.content?.slice(0, start) ?? ''}${inserted}${form.content?.slice(end) ?? ''}`;
    set('content', next);
    // Collapse the cursor at the end of the inserted text — leaving it selected
    // made the next toolbar click wrap the already-inserted block again.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + inserted.length, start + inserted.length);
    });
  }

  const previewHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(form.content ?? '', { async: false })),
    [form.content],
  );

  if (!isNew && loadingExisting) {
    return <div className="flex justify-center py-24"><Spinner className="size-8" /></div>;
  }

  const wordCount = (form.content ?? '').trim() ? (form.content ?? '').trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">{isNew ? 'New article' : 'Edit article'}</h1>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          {savedAt && <span>Saved {savedAt.toLocaleTimeString()}</span>}
          {form.status === 'PUBLISHED' && <Badge tone="green">Published</Badge>}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-5">
          <Field label="Headline">
            <Input
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!slugTouched) set('slug', slugifyText(e.target.value));
              }}
              placeholder="Write a clear, specific headline"
              className="!text-lg !font-semibold"
            />
          </Field>
          <Field label="Subtitle / standfirst">
            <Input value={form.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} placeholder="One or two sentences that expand the headline" />
          </Field>
          <Field label="URL slug" hint={`/articles/${form.slug || 'your-slug'}`}>
            <Input value={form.slug ?? ''} onChange={(e) => { setSlugTouched(true); set('slug', slugifyText(e.target.value)); }} className="font-mono text-sm" />
          </Field>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">Content (HTML / Markdown)</span>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {TOOLBAR_ACTIONS.map(({ label, title, transform }) => (
                    <button
                      key={`${title}-${label}`}
                      type="button"
                      title={title}
                      onClick={() => insertHtml(transform)}
                      className="rounded border border-rule px-2 py-1 text-xs font-semibold text-ink-700 hover:border-ink-900"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant={previewMode ? 'primary' : 'outline'} onClick={() => setPreviewMode((v) => !v)}>
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
              </div>
            </div>
            {previewMode ? (
              <div className="prose-editorial max-h-[600px] min-h-96 overflow-y-auto border border-rule bg-white p-6 scroll-thin" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <Textarea
                ref={textareaRef}
                rows={22}
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                placeholder={'<h2>Section heading</h2>\n\n<p>Write the article in HTML — use the toolbar above, or write markdown and it renders too. Headings feed the table of contents.</p>'}
                className="font-mono text-sm leading-relaxed"
              />
            )}
            <p className="mt-1 text-xs text-ink-400">{wordCount} words · ≈{Math.max(1, Math.round(wordCount / 200))} min read</p>
          </div>

          <details className="border border-rule bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink-950">SEO settings</summary>
            <div className="space-y-4 px-4 pb-5 pt-2">
              <Field label="SEO title" hint={`${(form.seo?.title ?? '').length}/60`}>
                <Input value={form.seo?.title ?? ''} maxLength={70} onChange={(e) => set('seo', { ...form.seo, title: e.target.value })} />
              </Field>
              <Field label="Meta description" hint={`${(form.seo?.description ?? '').length}/155`}>
                <Textarea rows={2} value={form.seo?.description ?? ''} maxLength={170} onChange={(e) => set('seo', { ...form.seo, description: e.target.value })} />
              </Field>
              <Field label="Canonical URL">
                <Input type="url" value={form.seo?.canonicalUrl ?? ''} onChange={(e) => set('seo', { ...form.seo, canonicalUrl: e.target.value })} placeholder="Leave empty for the default" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={form.seo?.noindex ?? false} onChange={(e) => set('seo', { ...form.seo, noindex: e.target.checked })} className="accent-[#a16207]" />
                Ask search engines not to index this article (noindex)
              </label>
            </div>
          </details>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="border border-rule-dark bg-white p-4">
            <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Publishing</p>
            <div className="space-y-3">
              <Field label="Status" hint="Changing status saves immediately for existing articles">
                <Select
                  value={form.status}
                  onChange={(e) => {
                    const next = { ...formRef.current, status: e.target.value as ArticleWritePayload['status'] };
                    setForm(next);
                    // For existing articles, a status change IS the action — publish/archive immediately.
                    if (!isNew && next.title && next.content) save.mutate(next);
                  }}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </Field>
              {form.status === 'SCHEDULED' && (
                <Field label="Publish at">
                  <DateTimePicker value={form.scheduledAt} onChange={(iso) => set('scheduledAt', iso)} />
                </Field>
              )}
              {form.status === 'PUBLISHED' && (
                <Field
                  label="Published date"
                  hint="Edit to backdate — controls where it sorts in feeds and how the date displays"
                >
                  <DateTimePicker value={form.publishedAt} onChange={(iso) => set('publishedAt', iso)} />
                </Field>
              )}
              {(['featured', 'editorsPick', 'trending'] as const).map((flag) => {
                const hints: Record<typeof flag, string> = {
                  featured: 'Shows large in the homepage hero section',
                  editorsPick: "Lists it under Editor's Picks on the homepage",
                  trending: 'Pins it to the top of Trending Now (rest ordered by real views)',
                };
                return (
                  <label key={flag} className="block text-sm text-ink-700">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={!!form[flag]} onChange={(e) => set(flag, e.target.checked)} className="accent-[#a16207]" />
                      {flag === 'featured' ? 'Featured story' : flag === 'editorsPick' ? "Editor's pick" : 'Mark as trending'}
                    </span>
                    <span className="ml-6 block text-[0.68rem] leading-4 text-ink-400">{hints[flag]}</span>
                  </label>
                );
              })}
              <div className="flex gap-2 border-t border-rule pt-3">
                <Button
                  className="flex-1"
                  disabled={!form.title || !form.content || save.isPending}
                  onClick={() => save.mutate(form)}
                >
                  {save.isPending ? 'Saving…' : isNew ? 'Create draft' : 'Save changes'}
                </Button>
              </div>
              {!isNew && form.status !== 'PUBLISHED' && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!form.title || !form.content || save.isPending}
                  onClick={() => {
                    // Update the form state too — otherwise the 30s autosave
                    // reverts the article to DRAFT after publishing.
                    const next = { ...form, status: 'PUBLISHED' as ArticleWritePayload['status'] };
                    setForm(next);
                    save.mutate(next);
                  }}
                >
                  Publish now
                </Button>
              )}
              {!isNew && (
                <Link to={`/articles/${existing?.slug}`} target="_blank" className="block text-center text-xs font-semibold text-ink-500 hover:text-gold-700">
                  Preview on site ↗
                </Link>
              )}
            </div>
          </div>

          <div className="border border-rule-dark bg-white p-4">
            <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Organization</p>
            <div className="space-y-3">
              <Field label="Category">
                <Select value={form.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">Select…</option>
                  {(categories?.items ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Author">
                <Select value={form.authorId ?? ''} onChange={(e) => set('authorId', e.target.value)}>
                  <option value="">Select…</option>
                  {(authors?.items ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </Field>
              <Field label="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {(form.tagIds ?? []).map((tagId) => {
                    const tag = tags?.items.find((t) => t.id === tagId);
                    return (
                      <button key={tagId} type="button" onClick={() => set('tagIds', (form.tagIds ?? []).filter((t) => t !== tagId))}>
                        <Badge tone="neutral">{tag?.name ?? tagId} ×</Badge>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag…"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const name = tagInput.trim();
                        if (!name) return;
                        const existingTag = tags?.items.find((t) => t.name.toLowerCase() === name.toLowerCase());
                        if (existingTag) {
                          set('tagIds', [...new Set([...(form.tagIds ?? []), existingTag.id])]);
                        } else {
                          const created = await adminApi.createTag(name);
                          void qc.invalidateQueries({ queryKey: ['tags'] });
                          set('tagIds', [...(form.tagIds ?? []), created.id]);
                        }
                        setTagInput('');
                      }
                    }}
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="border border-rule-dark bg-white p-4">
            <MediaPicker
              mediaId={form.featuredImageId}
              mediaUrl={featuredImageUrl}
              altText={form.imageAlt ?? ''}
              onChange={(media) => {
                set('featuredImageId', media?.id);
                setFeaturedImageUrl(media?.url);
              }}
            />
            <div className="mt-4 space-y-3">
              <Field label="Alt text">
                <Input value={form.imageAlt ?? ''} onChange={(e) => set('imageAlt', e.target.value)} />
              </Field>
              <Field label="Caption">
                <Input value={form.imageCaption ?? ''} onChange={(e) => set('imageCaption', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
