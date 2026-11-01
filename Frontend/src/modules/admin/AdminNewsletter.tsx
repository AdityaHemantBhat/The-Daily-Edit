import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../infrastructure/api/repositories';
import { EmptyState, Pagination } from '../../presentation/primitives';
import { formatDate } from '../../domain/value-objects/format';
import { SkeletonTable } from '../../presentation/components/skeletons';

const SUBS_PER_PAGE = 15;

export default function AdminNewsletter() {
  const [viewPage, setViewPage] = useState(1);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-subscribers'], queryFn: adminApi.subscribers });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriber(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-subscribers'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Newsletter subscribers</h1>
      {isLoading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-rule-dark bg-white p-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Active subscribers</p>
              <p className="mt-1 font-serif text-4xl font-semibold">{data?.total ?? 0}</p>
            </div>
            <div className="border border-rule-dark bg-white p-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Confirmed opt-in</p>
              <p className="mt-1 font-serif text-4xl font-semibold">{data?.confirmed ?? 0}</p>
            </div>
          </div>

          {(data?.items ?? []).length === 0 ? (
            <EmptyState title="No subscribers yet" body="Newsletter signups from the site will appear here." />
          ) : (
            <div className="overflow-x-auto border border-rule-dark bg-white">
              <table className="w-full table-fixed text-left text-sm">
                <thead><tr className="border-b border-rule-dark text-[0.65rem] uppercase tracking-widest text-ink-500">
                  <th className="px-4 py-3">Email</th><th className="w-28 px-4 py-3">Confirmed</th><th className="w-36 px-4 py-3">Subscribed</th><th className="w-28 px-4 py-3 text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-rule">
                  {(data?.items ?? []).slice((viewPage - 1) * SUBS_PER_PAGE, viewPage * SUBS_PER_PAGE).map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">{s.email}</td>
                      <td className="px-4 py-3">{s.confirmed ? '✓' : '—'}</td>
                      <td className="px-4 py-3 text-ink-500">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => remove.mutate(s.id)} className="text-xs font-semibold text-red-700 hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(data?.items ?? []).length > SUBS_PER_PAGE && (
            <Pagination
              page={viewPage}
              pages={Math.ceil((data?.items.length ?? 0) / SUBS_PER_PAGE)}
              onPage={setViewPage}
              label="Subscribers"
            />
          )}
        </>
      )}
    </div>
  );
}
