import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, publicApi } from '../../infrastructure/api/repositories';
import { Alert, Badge, Button, Field, Input } from '../../presentation/primitives';
import { Skeleton } from '../../presentation/components/skeletons';

interface Placement { id: string; key: string; label: string; description: string | null; ads: AdRow[] }
interface AdRow { id: string; name: string; adClient: string | null; adSlot: string | null; status: string }

export default function AdminAds() {
  const qc = useQueryClient();
  const { data: live } = useQuery({ queryKey: ['ads-live'], queryFn: publicApi.adConfig });
  const { data: placements, isLoading } = useQuery({ queryKey: ['admin-ad-placements'], queryFn: adminApi.adPlacements });
  const { data: settings } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });

  const adsenseSetting = (settings?.items ?? []).find((s) => s.key === 'adsense');
  const [publisherId, setPublisherId] = useState(
    ((adsenseSetting?.value as { publisherId?: string } | null)?.publisherId) ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [newAd, setNewAd] = useState<{ placementId: string; name: string; adSlot: string } | null>(null);

  const savePublisher = useMutation({
    mutationFn: () => adminApi.saveSetting('adsense', { publisherId: publisherId.trim() || null, enabled: !!publisherId.trim() }),
    onSuccess: () => { setError(null); void qc.invalidateQueries({ queryKey: ['admin-settings'] }); void qc.invalidateQueries({ queryKey: ['ads-live'] }); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Save failed'),
  });

  const seed = useMutation({
    mutationFn: adminApi.seedPlacements,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-ad-placements'] }),
  });

  const createAd = useMutation({
    mutationFn: (data: { placementId: string; name: string; adSlot: string }) =>
      adminApi.createAd({ ...data, adClient: publisherId.trim() || undefined, status: publisherId.trim() ? 'ACTIVE' : 'PAUSED' }),
    onSuccess: () => { setNewAd(null); void qc.invalidateQueries({ queryKey: ['admin-ad-placements'] }); },
  });

  const toggleAd = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateAd(id, { status }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin-ad-placements'] }); void qc.invalidateQueries({ queryKey: ['ads-live'] }); },
  });

  const removeAd = useMutation({
    mutationFn: (id: string) => adminApi.deleteAd(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-ad-placements'] }),
  });

  const validPublisher = /^ca-pub-\d+$/.test(publisherId.trim());

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-semibold">Advertisement management</h1>

      <section className="border border-rule-dark bg-white p-5">
        <h2 className="font-serif text-xl font-semibold">Google AdSense configuration</h2>
        <p className="mt-1 text-sm text-ink-500">
          Enter your AdSense publisher ID to enable ad serving. Until a valid ID is configured, the site shows
          neutral placeholders — never fake ads. ads.txt stays empty until then.
        </p>
        {error && <div className="mt-3"><Alert>{error}</Alert></div>}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Publisher ID" hint={publisherId && !validPublisher ? 'Expected format: ca-pub-1234567890123456' : undefined}>
            <Input value={publisherId} onChange={(e) => setPublisherId(e.target.value)} placeholder="ca-pub-…" className="w-72 font-mono" />
          </Field>
          <Button onClick={() => savePublisher.mutate()} disabled={savePublisher.isPending || (publisherId.trim() !== '' && !validPublisher)}>
            {savePublisher.isPending ? 'Saving…' : 'Save'}
          </Button>
          {live?.publisherId && <Badge tone="green">Live — {live.placements.length} active placement{live.placements.length === 1 ? '' : 's'}</Badge>}
        </div>
        {publisherId.trim() && !validPublisher && (
          <p className="mt-2 text-xs text-red-700">Ads will not serve until the ID matches ca-pub-…</p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Placements</h2>
          {(placements?.items ?? []).length === 0 && !isLoading && (
            <Button size="sm" variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>Create default placements</Button>
          )}
        </div>
        {isLoading ? (
          <div className="mt-3 space-y-3">{[0, 1, 2].map((i) => (
            <div key={i} className="border border-rule-dark bg-white p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}</div>
        ) : (
          <div className="mt-4 space-y-4">
            {((placements?.items ?? []) as Placement[]).map((p) => (
              <div key={p.id} className="border border-rule-dark bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.label} <span className="ml-1 font-mono text-xs text-ink-400">{p.key}</span></p>
                    {p.description && <p className="text-xs text-ink-500">{p.description}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setNewAd({ placementId: p.id, name: '', adSlot: '' })}>+ Ad unit</Button>
                </div>
                {p.ads.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-rule pt-3">
                    {p.ads.map((ad) => (
                      <li key={ad.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>
                          {ad.name}
                          {ad.adSlot && <span className="ml-2 font-mono text-xs text-ink-400">slot {ad.adSlot}</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge tone={ad.status === 'ACTIVE' ? 'green' : 'neutral'}>{ad.status}</Badge>
                          <button
                            onClick={() => toggleAd.mutate({ id: ad.id, status: ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })}
                            className="text-xs font-semibold text-ink-700 hover:text-gold-700"
                          >
                            {ad.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => removeAd.mutate(ad.id)} className="text-xs font-semibold text-red-700 hover:underline">Delete</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {newAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" onClick={() => setNewAd(null)}>
          <form className="w-full max-w-md space-y-4 bg-white p-6" onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); createAd.mutate(newAd); }}>
            <h2 className="font-serif text-2xl font-semibold">New ad unit</h2>
            <Field label="Unit name"><Input value={newAd.name} onChange={(e) => setNewAd({ ...newAd, name: e.target.value })} required placeholder="Responsive display — mobile" /></Field>
            <Field label="Ad slot ID" hint="From your AdSense dashboard">
              <Input value={newAd.adSlot} onChange={(e) => setNewAd({ ...newAd, adSlot: e.target.value })} required className="font-mono" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setNewAd(null)}>Cancel</Button>
              <Button type="submit" disabled={createAd.isPending}>Create</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
