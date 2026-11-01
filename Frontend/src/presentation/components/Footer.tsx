import { Link } from 'react-router-dom';
import { cachedSettings, useCategories, usePublicSettings, useTools } from '../../application/hooks/usePublicData';
import { SITE_NAME } from '../../app/config/site';

const LEGAL_LINKS = [
  ['/about', 'About Us'],
  ['/contact', 'Contact'],
  ['/privacy-policy', 'Privacy Policy'],
  ['/terms', 'Terms and Conditions'],
  ['/disclaimer', 'Disclaimer'],
  ['/editorial-policy', 'Editorial Policy'],
  ['/cookie-policy', 'Cookie Policy'],
] as const;

export function Footer() {
  const { data: cats } = useCategories();
  const { data: tools } = useTools();
  const { data: settings } = usePublicSettings();
  // Footer tool links resolve from the real catalog — hardcoded slugs rot when
  // a tool's name changes; missing tools simply don't render a link.
  const FOOTER_TOOL_SLUGS = ['image-compressor', 'merge-pdf', 'qr-code-generator', 'password-generator'];
  const footerTools = FOOTER_TOOL_SLUGS
    .map((slug) => tools?.items.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => !!t);
  const social = settings?.site?.social ?? {};
  const logoUrl = settings?.site?.logoUrl ?? cachedSettings().site?.logoUrl ?? null;
  const useNativeWordmark = !logoUrl || logoUrl === '/logo.svg';

  return (
    <footer className="border-t-2 border-ink-900 bg-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          {/* Small brand lockup — native wordmark, or a custom uploaded logo scaled down */}
          {useNativeWordmark ? (
            <Link to="/" className="inline-block">
              <span className="block font-serif text-[1.75rem] font-bold leading-none tracking-tight text-ink-950">
                THE <span className="text-gold-600">DAILY</span> EDIT<span className="text-gold-600">.</span>
              </span>
              <span className="mt-1.5 block text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-ink-500">
                Digital Publication
              </span>
            </Link>
          ) : (
            <Link to="/">
              <img src={logoUrl!} alt={SITE_NAME} className="h-11 w-auto" />
            </Link>
          )}
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            {settings?.site?.tagline ?? 'Technology, tools, and the ideas behind them — edited daily.'}
          </p>
          <div className="mt-4 flex gap-3">
            {Object.entries(social)
              .filter(([, url]) => url)
              .map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-widest text-ink-500 hover:text-gold-700"
                >
                  {name}
                </a>
              ))}
          </div>
        </div>

        <nav aria-label="Categories">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-ink-950">Sections</p>
          <ul className="space-y-2 text-sm text-ink-500">
            {(cats?.items ?? []).slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="hover:text-gold-700">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tools">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-ink-950">Free Tools</p>
          <ul className="space-y-2 text-sm text-ink-500">
            <li><Link to="/tools" className="hover:text-gold-700">All tools directory</Link></li>
            {footerTools.map((t) => (
              <li key={t.id}><Link to={`/tools/${t.slug}`} className="hover:text-gold-700">{t.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company and legal">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-ink-950">Publication</p>
          <ul className="space-y-2 text-sm text-ink-500">
            {LEGAL_LINKS.map(([to, label]) => (
              <li key={to}><Link to={to} className="hover:text-gold-700">{label}</Link></li>
            ))}
            <li><a href="/sitemap.xml" className="hover:text-gold-700">Sitemap</a></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p>Independent digital publication · Made with care</p>
        </div>
      </div>
    </footer>
  );
}
