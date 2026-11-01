import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { publicApi } from '../../infrastructure/api/repositories';
import { Alert, Button, Field, Input, Textarea } from '../../presentation/primitives';
import { formatDate } from '../../domain/value-objects/format';

/**
 * Public comments for an article: reader comments and submission form in a slick right-side sliding drawer.
 * New comments go to the moderation queue (Admin → Comments) before appearing.
 */
export function CommentsSection({ slug }: { slug: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['article-comments', slug],
    queryFn: () => publicApi.articleComments(slug),
  });
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ authorName: '', authorEmail: '', body: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const comments = data?.items ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await publicApi.postComment({ articleSlug: slug, ...form });
      setSuccess(res.message);
      setForm({ authorName: '', authorEmail: '', body: '' });
      void refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your comment.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="comments" className="mt-12 border-t border-rule pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-ink-950">
            <MessageSquare className="size-5 text-gold-600" aria-hidden />
            Discussion & Reader Feedback
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {comments.length === 0 ? 'No comments yet — be the first to join the conversation.' : `${comments.length} published ${comments.length === 1 ? 'comment' : 'comments'}.`}
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        >
          <MessageSquare className="size-4" />
          Read Comments {comments.length > 0 ? `(${comments.length})` : ''}
        </Button>
      </div>

      {/* Right-Side Sliding Drawer Portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[100] flex justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink-950/60 backdrop-blur-xs"
                onClick={() => setIsOpen(false)}
              />

              {/* Sidebar Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="relative z-10 flex h-full w-full max-w-lg flex-col bg-paper shadow-2xl"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-rule px-6 py-5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-gold-600" />
                    <h3 className="font-serif text-xl font-bold text-ink-950">
                      Discussion {comments.length > 0 && <span className="text-sm font-normal text-ink-500">({comments.length})</span>}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-ink-700 hover:bg-paper-dark"
                    aria-label="Close comments"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                {/* Drawer Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                  {/* Comment Submission Form */}
                  <div className="rounded-xl border border-rule bg-paper-dark/40 p-5">
                    <h4 className="font-serif text-lg font-semibold text-ink-950 mb-2">Add to the discussion</h4>
                    <p className="mb-4 text-xs leading-relaxed text-ink-500">
                      Comments must be written in English as complete sentences. Please maintain respectful discourse, avoid personal attacks, and adhere to our community standards. All submissions are reviewed by editors prior to publication.
                    </p>
                    {success ? (
                      <Alert tone="success">{success}</Alert>
                    ) : (
                      <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Name">
                            <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} required minLength={2} maxLength={80} placeholder="Your name" />
                          </Field>
                          <Field label="Email" hint="Never published">
                            <Input type="email" value={form.authorEmail} onChange={(e) => setForm({ ...form, authorEmail: e.target.value })} required placeholder="you@example.com" />
                          </Field>
                        </div>
                        <Field label="Comment">
                          <Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required minLength={3} maxLength={3000} placeholder="Share your perspective…" />
                        </Field>
                        {error && <Alert>{error}</Alert>}
                        <div className="flex items-center justify-end pt-1">
                          <Button type="submit" disabled={sending} className="inline-flex items-center gap-1.5">
                            <Send className="size-3.5" />
                            {sending ? 'Submitting…' : 'Post comment'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Comments List */}
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-ink-950 mb-4">Reader Comments</h4>
                    {isLoading ? (
                      <p className="py-8 text-center text-sm text-ink-500">Loading comments…</p>
                    ) : comments.length === 0 ? (
                      <div className="py-12 text-center">
                        <MessageSquare className="mx-auto size-10 text-ink-300 mb-2" />
                        <p className="text-sm font-medium text-ink-600">No comments yet</p>
                        <p className="text-xs text-ink-400 mt-1">Be the first to share your thoughts on this story.</p>
                      </div>
                    ) : (
                      <ul className="space-y-6">
                        {comments.map((c) => (
                          <li key={c.id} className="border-b border-rule pb-5 last:border-b-0">
                            <div className="flex items-center gap-3">
                              <span className="flex size-8 items-center justify-center rounded-full bg-ink-950 font-serif text-xs font-bold text-paper">
                                {c.authorName.charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-ink-950">{c.authorName}</p>
                                <p className="text-[0.65rem] text-ink-400">{formatDate(c.createdAt)}</p>
                              </div>
                            </div>
                            <p className="mt-2.5 whitespace-pre-line pl-11 text-sm leading-relaxed text-ink-700">{c.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}
