import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../application/state/authContext';
import { Spinner } from '../primitives';
import { SITE_NAME } from '../../app/config/site';
import { getAdminPath } from '../../app/config/adminPath';

const NAV: [string, string][] = [
  ['dashboard', 'Dashboard'],
  ['articles', 'Articles'],
  ['categories', 'Categories'],
  ['tags', 'Tags'],
  ['authors', 'Authors'],
  ['media', 'Media'],
  ['tools', 'Tools'],
  ['comments', 'Comments'],
  ['messages', 'Messages'],
  ['newsletter', 'Newsletter'],
  ['ads', 'Ads'],
  ['settings', 'Settings'],
  ['users', 'Users'],
];

function AdminShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => setOpen(false), [location.pathname]);

  // Admin pages scroll natively (no Lenis) — reset to top on navigation.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-paper-dark">
      {/* Top bar — fixed 3.5rem height so the sidebar offset below stays exact */}
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-rule bg-white px-6">
        <div className="flex items-center gap-3">
          <button className="rounded p-1.5 hover:bg-paper-dark lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle admin menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link to={`${getAdminPath()}/dashboard`} className="font-serif text-xl font-bold text-ink-950">
            {SITE_NAME} <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold-600">Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-ink-600 hover:text-gold-700">View site →</Link>
          <span className="text-ink-400">·</span>
          <span className="text-ink-600">{user?.name}</span>
          <button
            onClick={() => void logout().then(() => window.location.assign('/'))}
            className="rounded border border-rule-dark px-3 py-1 text-xs font-semibold text-ink-700 hover:border-ink-900 hover:text-ink-950"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar — full height on desktop, sticky so the nav stays visible on long pages */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 mt-14 w-56 shrink-0 overflow-y-auto border-r border-rule-dark bg-white px-3 py-4 transition-transform lg:sticky lg:top-14 lg:mt-0 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <nav className="space-y-0.5" aria-label="Admin">
            {NAV.map(([segment, label]) => (
              <Link
                key={segment}
                to={`${getAdminPath()}/${segment}`}
                className={`block rounded px-3 py-2 text-sm font-medium ${
                  location.pathname.startsWith(`${getAdminPath()}/${segment}`) ? 'bg-ink-900 text-paper' : 'text-ink-700 hover:bg-paper-dark'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        {open && <div className="fixed inset-0 z-20 bg-ink-950/30 lg:hidden" onClick={() => setOpen(false)} />}

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, loading, can } = useAuth();
  const location = useLocation();
  const base = getAdminPath();
  const isLoginRoute = location.pathname === base || location.pathname === `${base}/login`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isLoginRoute) return <Outlet />;

  if (!user) return <Navigate to={base} replace state={{ from: location.pathname }} />;
  if (!can('dashboard:view') && !can('articles:write')) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="font-serif text-3xl font-semibold">No access</p>
          <p className="mt-2 text-sm text-ink-500">Your account does not have admin permissions.</p>
        </div>
      </div>
    );
  }

  return <AdminShell />;
}
