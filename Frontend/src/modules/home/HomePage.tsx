import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { useHomeSections, useCategories, usePublicSettings, useTools, useToolCategories } from '../../application/hooks/usePublicData';
import { LeadStory, RankedStory, SecondaryStory, StoryCard } from '../../presentation/components/ArticleCards';
import { AdSlot } from '../../presentation/components/AdSlot';
import { SectionHeading, Skeleton } from '../../presentation/primitives';
import { useReveal, useHeroEntrance } from '../../presentation/animations/motion';
import { HomepagePreloader } from '../../presentation/components/HomepagePreloader';

import { setPageMeta } from '../../application/services/seo';
import { useEffect } from 'react';
import { SITE_NAME } from '../../app/config/site';

function FeaturedSection() {
  const { data, isLoading } = useHomeSections();
  const heroRef = useHeroEntrance<HTMLElement>();

  if (isLoading || !data) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <Skeleton className="aspect-[16/9] lg:col-span-2" />
        <div className="space-y-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  const pool = data.featured.length ? data.featured : data.latest;
  const [lead, ...secondary] = pool;
  if (!lead) return null;
  const rest = [
    ...secondary,
    ...data.latest.filter((a) => a.id !== lead.id && !secondary.some((s) => s.id === a.id)),
  ].slice(0, 4);

  return (
    <section ref={heroRef} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <div data-hero-stagger><LeadStory article={lead} /></div>
      <div data-hero-stagger className="space-y-6">
        <p className="border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-ink-950">
          Top Stories
        </p>
        {rest.map((a) => <SecondaryStory key={a.id} article={a} />)}
      </div>
    </section>
  );
}

/* ---- Reusable carousel arrows + dots ---- */
function CarouselControls({ current, total, onPrev, onNext, onSelect }: {
  current: number; total: number; onPrev: () => void; onNext: () => void; onSelect: (i: number) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="flex size-9 items-center justify-center rounded-full border border-rule-dark text-ink-700 transition-colors hover:border-ink-900 disabled:opacity-30"
        aria-label="Previous"
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Go to item ${i + 1}`}
            className={`size-2 rounded-full transition-colors ${i === current ? 'bg-gold-600' : 'bg-rule-dark'}`}
          />
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={current >= total - 1}
        className="flex size-9 items-center justify-center rounded-full border border-rule-dark text-ink-700 transition-colors hover:border-ink-900 disabled:opacity-30"
        aria-label="Next"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function LatestSection() {
  const { data, isLoading } = useHomeSections();
  const ref = useReveal<HTMLElement>();
  const [slide, setSlide] = useState(0);
  if (isLoading || !data?.latest.length) return null;
  const items = data.latest.slice(0, 6);

  return (
    <section ref={ref} aria-label="Latest stories">
      {/* mobile: one story at a time with carousel controls */}
      <div className="md:hidden">
        <div className="overflow-hidden" aria-roledescription="carousel">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {items.map((a) => (
              <div key={a.id} className="w-full shrink-0 px-1">
                <StoryCard article={a} />
              </div>
            ))}
          </div>
        </div>
        <CarouselControls
          current={slide} total={items.length}
          onPrev={() => setSlide((s) => Math.max(0, s - 1))}
          onNext={() => setSlide((s) => Math.min(items.length - 1, s + 1))}
          onSelect={setSlide}
        />
      </div>
      {/* tablet: 2-story carousel */}
      <div className="hidden md:block lg:hidden">
        <div className="overflow-hidden" aria-roledescription="carousel">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {Array.from({ length: Math.ceil(items.length / 2) }).map((_, i) => (
              <div key={i} className="w-full shrink-0 px-1">
                <div className="grid grid-cols-2 gap-4">
                  {items.slice(i * 2, i * 2 + 2).map((a) => (
                    <StoryCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <CarouselControls
          current={slide} total={Math.ceil(items.length / 2)}
          onPrev={() => setSlide((s) => Math.max(0, s - 1))}
          onNext={() => setSlide((s) => Math.min(Math.ceil(items.length / 2) - 1, s + 1))}
          onSelect={setSlide}
        />
      </div>
      {/* desktop: 3-column grid without carousel controls */}
      <div className="hidden gap-x-8 gap-y-12 lg:grid lg:grid-cols-3">
        {items.map((a) => <StoryCard key={a.id} article={a} />)}
      </div>
    </section>
  );
}

function TrendingSection() {
  const { data, isLoading } = useHomeSections();
  if (isLoading || !data?.trending.length) return null;
  return (
    <div>
      <p className="mb-4 border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">
        Trending Now
      </p>
      {data.trending.map((a, i) => <RankedStory key={a.id} article={a} rank={i + 1} />)}
    </div>
  );
}

function EditorsPicks() {
  const { data, isLoading } = useHomeSections();
  if (isLoading || !data?.editorsPicks.length) return null;
  return (
    <div>
      <p className="mb-4 border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">
        Editor's Picks
      </p>
      {data.editorsPicks.map((a, i) => <RankedStory key={a.id} article={a} rank={i + 1} />)}
    </div>
  );
}

function RecentlyUpdated() {
  const { data, isLoading } = useHomeSections();
  if (isLoading || !data?.recentlyUpdated.length) return null;
  return (
    <div>
      <p className="mb-4 border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">
        Recently Updated
      </p>
      {data.recentlyUpdated.map((a, i) => <RankedStory key={a.id} article={a} rank={i + 1} />)}
    </div>
  );
}

function CategoryStrip() {
  const { data: cats, isLoading } = useCategories();
  if (isLoading || !cats?.items.length) return null;
  return (
    <section className="border-y border-rule bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <p className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-gold-600">Explore by topic</p>
        <div className="flex flex-wrap gap-2.5">
          {cats.items.map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="group flex items-baseline gap-2 rounded-full border border-rule-dark px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-950 hover:text-paper"
            >
              {c.name}
              {c._count ? <span className="text-xs font-normal text-ink-400 group-hover:text-paper/70">{c._count.articles}</span> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolsPreview() {
  const { data: tools, isLoading } = useTools();
  const { data: toolCats } = useToolCategories();
  const [toolSlide, setToolSlide] = useState(0);

  if (isLoading || !tools?.items.length) return null;
  const featured = tools.items.filter((t) => t.featured);
  const rest = tools.items
    .filter((t) => !featured.some((f) => f.id === t.id))
    .sort((a, b) => b.usageCount - a.usageCount);
  const picks = [...featured, ...rest].slice(0, 6);
  const catName = new Map((toolCats?.items ?? []).map((c) => [c.id, c.name]));

  return (
    <div>
      {/* mobile: one tool */}
      <div className="md:hidden">
        <div className="overflow-hidden" aria-roledescription="carousel">
          <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${toolSlide * 100}%)` }}>
            {picks.map((tool) => (
              <div key={tool.id} className="w-full shrink-0 px-1">
                <Link
                  to={`/tools/${tool.slug}`}
                  className="group block rounded border border-rule bg-white p-6 transition-colors hover:bg-paper-dark"
                >
                  <Wrench className="size-5 text-gold-600" aria-hidden />
                  <h3 className="mt-3 font-serif text-xl font-semibold group-hover:text-gold-700">{tool.name}</h3>
                  <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-widest text-ink-400">
                    {catName.get(tool.categoryId)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{tool.description}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <CarouselControls
          current={toolSlide} total={picks.length}
          onPrev={() => setToolSlide((s) => Math.max(0, s - 1))}
          onNext={() => setToolSlide((s) => Math.min(picks.length - 1, s + 1))}
          onSelect={setToolSlide}
        />
      </div>
      {/* tablet: 2-tool carousel */}
      <div className="hidden md:block lg:hidden">
        <div className="overflow-hidden" aria-roledescription="carousel">
          <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${toolSlide * 100}%)` }}>
            {Array.from({ length: Math.ceil(picks.length / 2) }).map((_, i) => (
              <div key={i} className="w-full shrink-0 px-1">
                <div className="grid grid-cols-2 gap-4">
                  {picks.slice(i * 2, i * 2 + 2).map((tool) => (
                    <Link
                      key={tool.id}
                      to={`/tools/${tool.slug}`}
                      className="group block rounded border border-rule bg-white p-6 transition-colors hover:bg-paper-dark"
                    >
                      <Wrench className="size-5 text-gold-600" aria-hidden />
                      <h3 className="mt-3 font-serif text-xl font-semibold group-hover:text-gold-700">{tool.name}</h3>
                      <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-widest text-ink-400">
                        {catName.get(tool.categoryId)}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <CarouselControls
          current={toolSlide} total={Math.ceil(picks.length / 2)}
          onPrev={() => setToolSlide((s) => Math.max(0, s - 1))}
          onNext={() => setToolSlide((s) => Math.min(Math.ceil(picks.length / 2) - 1, s + 1))}
          onSelect={setToolSlide}
        />
      </div>
      {/* desktop: grid without carousel controls */}
      <div className="hidden gap-px overflow-hidden border border-rule bg-rule lg:grid lg:grid-cols-3">
        {picks.map((tool) => (
          <Link
            key={tool.id}
            to={`/tools/${tool.slug}`}
            className="group bg-white p-6 transition-colors hover:bg-paper-dark"
          >
            <Wrench className="size-5 text-gold-600" aria-hidden />
            <h3 className="mt-3 font-serif text-xl font-semibold group-hover:text-gold-700">{tool.name}</h3>
            <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-widest text-ink-400">
              {catName.get(tool.categoryId)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{tool.description}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 border border-ink-900 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-ink-950 hover:text-paper"
        >
          Browse all {tools.items.length} free tools <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function HomePage() {
  const { data: settings } = usePublicSettings();

  useEffect(() => {
    setPageMeta({
      title: `${SITE_NAME} — Technology, tools, and the ideas behind them`,
      description:
        'Independent digital publication covering technology, AI, productivity and practical knowledge, paired with free browser-based tools.',
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    });
  }, []);

  const sections = settings?.homeSections;

  return (
    <HomepagePreloader onDone={() => {}}>
    <div className="mx-auto max-w-7xl px-4 py-10">
      <FeaturedSection />

      <div className="my-12"><AdSlot placement="home_top" /></div>

      <CategoryStrip />

      <section className="py-10 sm:py-14">
        <SectionHeading kicker="Fresh off the desk" title="Latest Stories" />
        <LatestSection />
      </section>

      {sections?.showTrending !== false && (
        <section className="grid gap-12 border-t border-rule py-10 sm:py-14 md:grid-cols-3">
          <TrendingSection />
          {sections?.showEditorsPicks !== false && <EditorsPicks />}
          {sections?.showRecentlyUpdated !== false && <RecentlyUpdated />}
        </section>
      )}

      <div className="my-4"><AdSlot placement="home_mid" /></div>

      {sections?.showTools !== false && (
        <section className="py-10 sm:py-14">
          <SectionHeading
            kicker="Free & browser-based"
            title="Popular Tools"
            action={<Link to="/tools" className="hidden text-sm font-semibold text-gold-700 hover:underline sm:block">All tools →</Link>}
          />
          <ToolsPreview />
        </section>
      )}

      <section className="border-t border-rule py-10 sm:py-14">
        <SectionHeading kicker="The honest pitch" title="Why The Daily Edit exists" />
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ['Slow publishing, on purpose', 'Pieces sit in a draft folder while an editor argues with them. Nothing goes live to hit a schedule — it goes live when it finally reads right.'],
            ['Your files stay yours', 'Every tool on this site runs inside your browser. Compress a photo on a plane, merge a PDF at 2 a.m. — nothing touches a server, and there is no account to make first.'],
            ['Written to last', 'We would rather explain one thing properly than chase ten headlines. The guides here are built to still be correct — and still work — next year.'],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="font-serif text-2xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
    </HomepagePreloader>
  );
}

export default HomePage;
