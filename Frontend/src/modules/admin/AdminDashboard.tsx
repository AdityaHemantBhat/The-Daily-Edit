import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../infrastructure/api/repositories';
import { Skeleton } from '../../presentation/primitives';
import { formatNumber, formatDate } from '../../domain/value-objects/format';
import { getAdminPath } from '../../app/config/adminPath';

interface Overview {
  articles: { total: number; published: number; drafts: number; scheduled: number };
  views: { total: number; last30: number; last7: number };
  toolUsage30: number;
  subscribers: number;
  popularArticles: { id: string; title: string; slug: string; viewCount: number }[];
  recentArticles: { id: string; title: string; slug: string; status: string; updatedAt: string }[];
  topTools: { tool: { name: string; slug: string }; count: number }[];
  viewsTimeline: { day: string; count: number }[];
}

const STATUS_TONE: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-paper-dark text-ink-700',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-red-100 text-red-800',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-rule-dark bg-white p-5">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-ink-950">{value}</p>
      {sub && <p className="text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.analyticsOverview, refetchInterval: 60_000 });
  const overview = data as Overview | undefined;

  if (isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  }
  if (!overview) return <p className="text-sm text-ink-500">Dashboard data unavailable.</p>;

  const maxViews = Math.max(1, ...overview.viewsTimeline.map((d) => d.count));

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total articles" value={overview.articles.total} sub={`${overview.articles.published} published · ${overview.articles.drafts} drafts · ${overview.articles.scheduled} scheduled`} />
        <StatCard label="Article views" value={formatNumber(overview.views.total)} sub={`${overview.views.last7} in last 7 days`} />
        <StatCard label="Tool uses (30d)" value={formatNumber(overview.toolUsage30)} sub="Across all tools" />
        <StatCard label="Newsletter subscribers" value={formatNumber(overview.subscribers)} />
      </div>

      <div className="border border-rule-dark bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Article views — last 30 days</p>
          <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-ink-400">
            {formatNumber(overview.views.last30)} total · first-party, real visits only
          </p>
        </div>
        {overview.viewsTimeline.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">
            No views recorded yet — this chart fills in as real visitors read your published articles.
          </p>
        ) : (
          <>
            <div className="mt-5 flex h-28 sm:h-36 items-stretch gap-0.5 sm:gap-1">
              {overview.viewsTimeline.map((d) => {
                const pct = Math.max(5, Math.round((d.count / maxViews) * 100));
                return (
                  <div
                    key={d.day}
                    className="group relative flex flex-1 flex-col justify-end"
                    title={`${new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${d.count} view${d.count === 1 ? '' : 's'}`}
                  >
                    <p className="mb-1 hidden text-center text-[0.6rem] font-bold text-ink-700 group-hover:block">{d.count}</p>
                    <div
                      className="w-full rounded-t bg-gold-600/75 transition-colors group-hover:bg-gold-600"
                      style={{ height: `${pct}%`, minHeight: 5 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[0.6rem] font-semibold uppercase tracking-widest text-ink-400">
              <span>{new Date(overview.viewsTimeline[0].day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span>today</span>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-rule-dark bg-white">
          <p className="border-b border-rule px-5 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Most viewed articles</p>
          <ul className="divide-y divide-rule">
            {overview.popularArticles.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link to={`/articles/${a.slug}`} target="_blank" className="truncate pr-4 hover:text-gold-700">{a.title}</Link>
                <span className="shrink-0 text-xs text-ink-500">{formatNumber(a.viewCount)} views</span>
              </li>
            ))}
            {!overview.popularArticles.length && <li className="px-5 py-4 text-sm text-ink-400">No published articles yet.</li>}
          </ul>
        </div>

        <div className="border border-rule-dark bg-white">
          <p className="border-b border-rule px-5 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Top tools (30 days)</p>
          <ul className="divide-y divide-rule">
            {overview.topTools.map((t) => (
              <li key={t.tool.slug} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link to={`/tools/${t.tool.slug}`} target="_blank" className="hover:text-gold-700">{t.tool.name}</Link>
                <span className="text-xs text-ink-500">{formatNumber(t.count)} uses</span>
              </li>
            ))}
            {!overview.topTools.length && <li className="px-5 py-4 text-sm text-ink-400">No tool usage recorded yet.</li>}
          </ul>
        </div>
      </div>

      <div className="border border-rule-dark bg-white">
        <p className="border-b border-rule px-5 py-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Recent activity</p>
        <ul className="divide-y divide-rule">
          {overview.recentArticles.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <Link to={`${getAdminPath()}/articles/${a.id}/edit`} className="truncate hover:text-gold-700">{a.title}</Link>
              <span className="flex shrink-0 items-center gap-3">
                <span className={`px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest ${STATUS_TONE[a.status] ?? ''}`}>{a.status}</span>
                <span className="text-xs text-ink-500">{formatDate(a.updatedAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
