import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { NewsletterForm } from '../components/NewsletterForm';
import { usePublicSettings } from '../../application/hooks/usePublicData';
import { scrollToTop, useSmoothScroll } from '../animations/motion';
import { SITE_NAME, SOCKET_URL, mediaUrl } from '../../app/config/site';
import { setPageMeta } from '../../application/services/seo';

// Split deployments serve media/socket from the API origin — hint the browser
// to open the connection early. No-op when API is same-origin.
function useApiPreconnect() {
  useEffect(() => {
    for (const origin of [...new Set([SOCKET_URL, import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : ''])]) {
      if (!origin.startsWith('http') || new URL(origin).origin === window.location.origin) continue;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);
}

function AnnouncementStrip() {
  const { data } = usePublicSettings();
  const announcement = data?.announcement;
  if (!announcement?.enabled || !announcement.text) return null;

  return (
    <div className="bg-ink-950 text-paper">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs font-medium">
        <span>{announcement.text}</span>
        {announcement.linkUrl && (
          <Link to={announcement.linkUrl} className="font-bold uppercase tracking-widest text-gold-100 underline underline-offset-2 hover:text-white">
            {announcement.linkText ?? 'Learn more'} →
          </Link>
        )}
      </div>
    </div>
  );
}

export function MainLayout() {
  const location = useLocation();
  const { data: settings } = usePublicSettings();
  useSmoothScroll();
  useApiPreconnect();

  useEffect(() => {
    scrollToTop();
  }, [location.pathname]);

  useEffect(() => {
    const favicon = settings?.site?.faviconUrl;
    if (favicon) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = mediaUrl(favicon);
    }
  }, [settings?.site?.faviconUrl]);

  useEffect(() => {
    if (settings?.site?.name) document.title = settings.site.name;
    setPageMeta({
      title: settings?.site?.name ?? SITE_NAME,
      description: settings?.site?.tagline,
      path: '/',
    });
  }, [settings]);

  const newsletterEnabled = settings?.newsletter?.enabled !== false;

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementStrip />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {newsletterEnabled && (
        <section className="border-t border-rule bg-paper-dark py-16">
          <NewsletterForm />
        </section>
      )}
      <Footer />
    </div>
  );
}
