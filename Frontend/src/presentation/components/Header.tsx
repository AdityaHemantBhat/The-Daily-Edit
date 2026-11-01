import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X, ChevronRight, CloudSun, Calendar, MapPin } from 'lucide-react';
import { cachedSettings, useCategories, usePublicSettings, useSearch } from '../../application/hooks/usePublicData';
import { SITE_NAME, mediaUrl } from '../../app/config/site';
import { useDebounced } from '../../application/hooks/useDebounced';

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [raw, setRaw] = useState('');
  const q = useDebounced(raw, 250);
  const { data, isFetching } = useSearch(q, 1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRaw('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-paper"
          onClick={onClose}
        >
          <div className="mx-auto max-w-3xl px-4 pt-24 pb-16" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b-2 border-ink-900 pb-3">
              <Search className="size-6 text-ink-500" aria-hidden />
              <input
                ref={inputRef}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Search articles, tools, topics…"
                className="w-full bg-transparent font-serif text-xl sm:text-2xl md:text-3xl text-ink-950 placeholder:text-ink-400 focus:outline-none"
                aria-label="Search"
              />
              <button onClick={onClose} aria-label="Close search" className="p-2 hover:bg-paper-dark">
                <X className="size-6" />
              </button>
            </div>

            {q.trim().length > 1 && (
              <div className="max-h-[60vh] overflow-y-auto py-4 scroll-thin">
                {isFetching && <p className="py-6 text-center text-sm text-ink-500">Searching…</p>}
                {!isFetching && data && (
                  <>
                    {data.articles.items.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => { onClose(); navigate(`/articles/${a.slug}`); }}
                        className="block w-full border-b border-rule px-2 py-3 text-left hover:bg-paper-dark"
                      >
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gold-600">{a.category.name}</p>
                        <p className="mt-0.5 font-serif text-xl font-semibold">{a.title}</p>
                      </button>
                    ))}
                    {data.tools.map((t) => (
                      <button
                        key={t.slug}
                        onClick={() => { onClose(); navigate(`/tools/${t.slug}`); }}
                        className="block w-full border-b border-rule px-2 py-3 text-left hover:bg-paper-dark"
                      >
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Tool · {t.category.name}</p>
                        <p className="mt-0.5 font-serif text-xl font-semibold">{t.name}</p>
                      </button>
                    ))}
                    {!data.articles.items.length && !data.tools.length && (
                      <p className="py-8 text-center text-sm text-ink-500">No results for “{q}”.</p>
                    )}
                    <div className="pt-4 text-center">
                      <button
                        onClick={() => { onClose(); navigate(`/search?q=${encodeURIComponent(q)}`); }}
                        className="text-sm font-semibold text-gold-700 hover:underline"
                      >
                        See all results →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function MobileMenuOverlay({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Array<{ name: string; slug: string; _count?: { articles?: number } }>;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-paper px-6 py-6 md:hidden"
          aria-label="Mobile Navigation"
        >
          {/* Top Bar: Clean Editorial Header */}
          <div className="flex items-center justify-between border-b border-rule pb-4">
            <span className="font-serif text-lg font-bold tracking-tight text-ink-950">
              THE <span className="text-gold-600">DAILY</span> EDIT
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-ink-700 hover:bg-paper-dark"
              aria-label="Close menu"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="mx-auto max-w-md space-y-8 pt-6 pb-20">
            {/* Primary Navigation Links (Simple & Clean Editorial Typography) */}
            <div className="space-y-1 border-b border-rule pb-6">
              <Link
                to="/"
                onClick={onClose}
                className="flex min-h-12 items-center justify-between font-serif text-2xl font-bold text-ink-950 hover:text-gold-700"
              >
                <span>Home</span>
                <ChevronRight className="size-5 text-ink-400" />
              </Link>
              <Link
                to="/tools"
                onClick={onClose}
                className="flex min-h-12 items-center justify-between font-serif text-2xl font-bold text-ink-950 hover:text-gold-700"
              >
                <span>Free Tools & Utilities</span>
                <ChevronRight className="size-5 text-ink-400" />
              </Link>
              <Link
                to="/about"
                onClick={onClose}
                className="flex min-h-12 items-center justify-between font-serif text-2xl font-bold text-ink-950 hover:text-gold-700"
              >
                <span>About The Publication</span>
                <ChevronRight className="size-5 text-ink-400" />
              </Link>
            </div>

            {/* Editorial Sections */}
            <div>
              <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-ink-400">
                Sections
              </p>
              <nav className="space-y-1">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    onClick={onClose}
                    className="flex min-h-12 items-center justify-between border-b border-rule/50 py-3 text-ink-800 transition-colors hover:text-gold-700"
                  >
                    <span className="font-serif text-xl font-medium">{c.name}</span>
                    {c._count?.articles ? (
                      <span className="text-xs font-semibold text-ink-400">
                        {c._count.articles} {c._count.articles === 1 ? 'story' : 'stories'}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Footer Tagline */}
            <div className="pt-4 text-center">
              <p className="text-xs text-ink-400">
                Thoughtful journalism & digital utilities. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function useRealWeather() {
  const [info, setInfo] = useState({ location: 'New Delhi', temp: '28°C' });

  useEffect(() => {
    async function fetchWeather() {
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        if (!ipRes.ok) return;
        const ipData = await ipRes.json();
        const city = ipData.city ?? 'New Delhi';
        const lat = ipData.latitude ?? 28.6139;
        const lon = ipData.longitude ?? 77.2090;

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`
        );
        if (!weatherRes.ok) return;
        const weatherData = await weatherRes.json();
        const tempVal = Math.round(weatherData.current.temperature_2m);

        setInfo({
          location: city,
          temp: `${tempVal}°C`,
        });
      } catch {
        // Keep default fallback
      }
    }
    void fetchWeather();
  }, []);

  return info;
}

export function Header() {
  const { data: settings } = usePublicSettings();
  const { data } = useCategories();
  // The masthead logo must never flash away: query data first, last-known cache as fallback.
  const logoUrl = settings?.site?.logoUrl ?? cachedSettings().site?.logoUrl ?? null;
  // The built-in /logo.svg duplicates the text wordmark — render it natively
  // with the site's real fonts instead of as an image. Custom uploads use the img.
  const useNativeWordmark = !logoUrl || logoUrl === '/logo.svg';
  const [logoFailed, setLogoFailed] = useState(false); // kept for future logo fallback logic
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const categories = data?.items ?? [];
  const weather = useRealWeather();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      {/* Masthead: three balanced columns — utility nav | wordmark | search */}
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Left: mobile menu trigger, or utility links on desktop */}
        <div className="flex items-center">
          <button
            className="-ml-2 rounded p-2 hover:bg-paper-dark md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="size-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="size-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <nav className="hidden items-center gap-6 pr-6 md:flex" aria-label="Secondary">
            <Link
              to="/tools"
              className="group relative text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-700 transition-colors hover:text-gold-700"
            >
              Tools
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              to="/about"
              className="group relative text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-700 transition-colors hover:text-gold-700"
            >
              About
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold-600 transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          {/* Real Live Weather & Location Widget (stacked on tablet, row on desktop) */}
          <div className="hidden md:flex md:flex-col lg:flex-row lg:items-center gap-0.5 text-xs text-ink-500">
            <div className="flex flex-col md:flex-col lg:flex-row gap-0.5" title={`Current location: ${weather.location}`}>
              <div className="flex items-center gap-1">
                <MapPin className="size-3.5 text-gold-600" />
                <span className="font-medium text-ink-950">{weather.location}</span>
                <span className="hidden lg:inline text-rule-dark mx-3">·</span>
              </div>
              <div className="hidden md:flex lg:flex items-center gap-1">
                <CloudSun className="size-4 text-gold-600" />
                <span>{weather.temp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: wordmark or uploaded logo */}
        <Link to="/" className="group justify-self-center text-center">
          {!useNativeWordmark && logoUrl && !logoFailed ? (
            <img
              src={mediaUrl(logoUrl)}
              alt={SITE_NAME}
              className="mx-auto h-12 w-auto object-contain md:h-16 lg:h-20"
              onError={() => setLogoFailed(true)}
              onLoad={() => setLogoFailed(false)}
            />
          ) : (
            <>
              <span className="font-serif text-[1.4rem] font-bold leading-none tracking-tight text-ink-950 md:text-3xl lg:text-4xl">
            {SITE_NAME.toUpperCase().split(' ').map((word, i, all) => (
              <span key={i}>
                <span className={i === 1 ? 'text-gold-600' : ''}>{word}</span>
                {i < all.length - 1 ? ' ' : ''}
              </span>
            ))}
            </span>
            <span className="mt-0.5 block text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-ink-400">Digital Publication</span>
            </>
          )}
        </Link>

        {/* Right: date + search */}
        <div className="flex justify-end items-center gap-3">
          <div className="hidden md:flex items-center gap-1 text-xs text-ink-500">
            <Calendar className="size-3.5 text-ink-400" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-rule-dark py-2 pl-3.5 pr-4 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-500 transition-colors hover:border-ink-900 hover:text-ink-950"
            aria-label="Open search"
          >
            <Search className="size-3.5" aria-hidden />
            <span className="hidden xl:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Category nav (desktop) */}
      <nav className="hidden border-t border-rule md:block" aria-label="Categories">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 py-2.5 text-[0.72rem] font-bold uppercase tracking-[0.15em] text-ink-700">
          {categories.slice(0, 8).map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="hover:text-gold-700 whitespace-nowrap">{c.name}</Link>
          ))}
        </div>
      </nav>

      <MobileMenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
