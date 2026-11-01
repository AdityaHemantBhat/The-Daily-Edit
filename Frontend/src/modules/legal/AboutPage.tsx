import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Wrench } from 'lucide-react';
import { useCategories, usePublicSettings, useTools } from '../../application/hooks/usePublicData';
import { setPageMeta } from '../../application/services/seo';
import { SITE_NAME } from '../../app/config/site';
import { Container } from '../../presentation/primitives';

/**
 * Editorial About page. The lead copy comes from the admin panel
 * (Settings → Legal pages → About Us); everything around it is structural.
 */
export function AboutPage() {
  const { data: settings } = usePublicSettings();
  const { data: categories } = useCategories();
  const { data: tools } = useTools();

  const aboutText = settings?.legal?.about;
  const editorialPolicy = settings?.legal?.editorialPolicy;
  const tagline = settings?.site?.tagline ?? 'Technology, tools, and the ideas behind them — edited daily.';
  const social = Object.entries(settings?.site?.social ?? {}).filter(([, url]) => url);

  useEffect(() => {
    setPageMeta({ title: 'About Us', description: aboutText ?? tagline, path: '/about' });
  }, [aboutText, tagline]);

  const stats = [
    { value: tools ? `${tools.items.length}` : '—', label: 'Free browser tools' },
    { value: categories ? `${categories.items.length}` : '—', label: 'Coverage sections' },
    { value: '100%', label: 'Human-reviewed' },
    { value: '0', label: 'Files uploaded to servers' },
  ];

  const values = [
    {
      icon: Users,
      title: 'Edited by people',
      body: 'Every headline, every paragraph, every tool listing passes through a human editor. Nothing is published automatically.',
    },
    {
      icon: ShieldCheck,
      title: 'Privacy first',
      body: 'Our tools run entirely in your browser. Your images, PDFs and text stay on your machine — most pages never send a file anywhere.',
    },
    {
      icon: Wrench,
      title: 'Useful over trendy',
      body: 'We write explainers and how-tos that hold up six months from now, and build tools people actually need more than once.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-rule">
        <Container className="py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold-600">About {SITE_NAME}</p>
            <h1 className="mt-5 font-serif text-3xl font-semibold leading-[1.15] text-ink-950 sm:text-4xl md:text-5xl lg:text-6xl">
              {tagline}
            </h1>
            {aboutText && (
              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-500">{aboutText}</p>
            )}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 bg-ink-950 px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink-900"
              >
                Explore the tools <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 border border-ink-900 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-ink-950 hover:text-paper"
              >
                Read the latest
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats strip — real counts from the database */}
      <section className="border-b border-rule bg-white">
        <Container>
          <div className="grid grid-cols-2 gap-px bg-rule md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-6 py-8 text-center">
                <p className="font-serif text-4xl font-semibold text-ink-950">{s.value}</p>
                <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* What we cover */}
      {categories?.items.length ? (
        <section className="py-16">
          <Container>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold-600">What we cover</p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-ink-950 md:text-4xl">Sections of the publication</h2>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {categories.items.map((c) => (
                <Link
                  key={c.slug}
                  to={`/category/${c.slug}`}
                  className="group flex items-baseline gap-2 rounded-full border border-rule-dark px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-950 hover:text-paper"
                >
                  {c.name}
                  {c._count ? (
                    <span className="text-xs font-normal text-ink-400 group-hover:text-paper/70">{c._count.articles}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Values */}
      <section className="border-y border-rule bg-white">
        <Container className="py-16">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold-600">How we work</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-ink-950 md:text-4xl">Principles we don't bend</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title}>
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <v.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-ink-950">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-500">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Editorial policy pull-quote */}
      {editorialPolicy && (
        <section className="py-16">
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold-600">Our editorial promise</p>
              <blockquote className="mt-6 font-serif text-2xl font-medium italic leading-relaxed text-ink-900 md:text-3xl">
                “{editorialPolicy.replace(/\.$/, '')}.”
              </blockquote>
              <Link to="/editorial-policy" className="mt-6 inline-block text-sm font-semibold text-gold-700 hover:underline">
                Read the full editorial policy →
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Contact / social strip */}
      <section className="border-t border-rule bg-ink-950">
        <Container className="py-12">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-paper">Say hello</h2>
              <p className="mt-1 text-sm text-paper/70">
                Corrections, tips and inquiries are always welcome — see our contact page.
              </p>
            </div>
            <div className="flex items-center gap-5">
              {social.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-[0.2em] text-paper/80 transition-colors hover:text-gold-100"
                >
                  {name}
                </a>
              ))}
              <Link
                to="/contact"
                className="bg-paper px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-ink-950 transition-colors hover:bg-gold-100"
              >
                Contact
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
export default AboutPage;
