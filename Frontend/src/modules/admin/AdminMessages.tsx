import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Mail, MailOpen, Reply } from 'lucide-react';
import { adminApi } from '../../infrastructure/api/repositories';
import { Alert, Badge, Button, ConfirmDialog, EmptyState, Pagination, Select } from '../../presentation/primitives';
import { formatDate } from '../../domain/value-objects/format';
import { Skeleton } from '../../presentation/components/skeletons';

const STATUS_TONE = { NEW: 'gold', READ: 'neutral', REPLIED: 'green' } as const;
const MESSAGES_PER_PAGE = 10;

export default function AdminMessages() {
  const [status, setStatus] = useState('');
  const [viewPage, setViewPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages', status],
    queryFn: () => adminApi.messages(status || undefined),
    refetchInterval: 60_000,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin-messages'] });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => adminApi.updateMessage(id, { status: s }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : 'Update failed'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteMessage(id),
    onSuccess: () => {
      if (selected === deleting) setSelected(null);
      setDeleting(null);
      invalidate();
    },
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;
  const openMessage = items.find((m) => m.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">
          Messages {unread > 0 && <span className="ml-1 align-middle"><Badge>{unread} new</Badge></span>}
        </h1>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setViewPage(1); }} className="max-w-40">
          <option value="">All</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
          <option value="REPLIED">Replied</option>
        </Select>
      </div>
      {error && <Alert>{error}</Alert>}

      {items.length > MESSAGES_PER_PAGE && (
        <Pagination
          page={viewPage}
          pages={Math.ceil(items.length / MESSAGES_PER_PAGE)}
          onPage={setViewPage}
          label="Messages"
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Message list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">{[0,1,2,3].map((i) => (
              <div key={i} className="border border-rule-dark bg-white p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}</div>
          ) : items.length === 0 ? (
            <EmptyState title="No messages" body="Contact-form submissions from the site will appear here." />
          ) : (
            items.slice((viewPage - 1) * MESSAGES_PER_PAGE, viewPage * MESSAGES_PER_PAGE).map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelected(m.id);
                  if (m.status === 'NEW') setStatusMutation.mutate({ id: m.id, s: 'READ' });
                }}
                className={`w-full border p-4 text-left transition-colors ${
                  selected === m.id ? 'border-ink-900 bg-white' : 'border-rule-dark bg-white hover:border-ink-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    {m.status === 'NEW' ? (
                      <Mail className="size-4 shrink-0 text-gold-600" aria-label="New message" />
                    ) : m.status === 'REPLIED' ? (
                      <Reply className="size-4 shrink-0 text-green-700" aria-label="Replied" />
                    ) : (
                      <MailOpen className="size-4 shrink-0 text-ink-400" aria-label="Read" />
                    )}
                    <span className={`truncate text-sm ${m.status === 'NEW' ? 'font-bold text-ink-950' : 'font-medium text-ink-700'}`}>
                      {m.subject}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.65rem] uppercase tracking-widest text-ink-400">
                    {formatDate(m.createdAt)}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-500">
                  {m.name} · {m.email}
                </p>
                <p className="mt-1.5 truncate text-xs text-ink-400">{m.message}</p>
              </button>
            ))
          )}
        </div>

        {/* Message detail */}
        <div className="border border-rule-dark bg-white">
          {!openMessage ? (
            <div className="flex h-full min-h-72 items-center justify-center p-10 text-center text-sm text-ink-400">
              Select a message to read it.
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <header className="border-b border-rule p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-ink-950">{openMessage.subject}</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      From <strong className="text-ink-950">{openMessage.name}</strong>{' '}
                      <a href={`mailto:${openMessage.email}?subject=Re: ${encodeURIComponent(openMessage.subject)}`} className="text-gold-700 hover:underline">
                        ({openMessage.email})
                      </a>{' '}
                      · {formatDate(openMessage.createdAt)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[openMessage.status]}>{openMessage.status}</Badge>
                </div>
              </header>

              <div className="flex-1 p-6">
                <p className="whitespace-pre-line leading-relaxed text-ink-900">{openMessage.message}</p>
              </div>

              <footer className="flex flex-wrap items-center gap-2 border-t border-rule p-4">
                <a
                  href={`mailto:${openMessage.email}?subject=Re: ${encodeURIComponent(openMessage.subject)}`}
                  className="inline-flex items-center gap-2 bg-ink-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-paper hover:bg-ink-950"
                >
                  <Reply className="size-3.5" aria-hidden /> Reply by email
                </a>
                <Button size="sm" variant="outline" onClick={() => setStatusMutation.mutate({ id: openMessage.id, s: 'REPLIED' })} disabled={openMessage.status === 'REPLIED'}>
                  <Check className="size-3.5" aria-hidden /> Mark as replied
                </Button>
                <Button size="sm" variant="danger" className="ml-auto" onClick={() => setDeleting(openMessage.id)}>
                  Delete
                </Button>
              </footer>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete message?"
        body="This permanently removes the message from the inbox."
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
