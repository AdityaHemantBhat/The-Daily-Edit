import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Wrench } from 'lucide-react';
import { useToolCategories } from '../../application/hooks/usePublicData';
import { AdSlot } from '../../presentation/components/AdSlot';
import { setPageMeta } from '../../application/services/seo';
import { excerpt } from '../../domain/value-objects/format';
import { Badge, Input } from '../../presentation/primitives';
import { SkeletonToolsDirectory } from '../../presentation/components/skeletons';

export function ToolsDirectoryPage() {
  const { data, isLoading } = useToolCategories();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setPageMeta({
      title: 'Free Online Tools',
      description: 'A directory of free browser-based tools for images, PDFs, text and productivity. No uploads, no accounts.',
      path: '/tools',
    });
  }, []);

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    const q = query.trim().toLowerCase();
    return data.items
      .map((cat) => ({
        ...cat,
        tools: cat.tools.filter((t) => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.tools.length > 0);
  }, [data, query]);

  const total = useMemo(() => data?.items.reduce((n, c) => n + c.tools.length, 0) ?? 0, [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header className="border-b-2 border-ink-900 pb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-gold-600">Free & private</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-950">Online Tools</h1>
        <p className="mt-3 max-w-2xl text-ink-500">
          {total} tools that run entirely in your browser — image and PDF processing, developer utilities and everyday calculators.
          Your files stay on your device.
        </p>
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools…" className="pl-9" aria-label="Search tools" />
        </div>
      </header>

      <div className="py-10"><AdSlot placement="tools_page" minHeight={90} /></div>

      {isLoading ? (
        <SkeletonToolsDirectory />
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-500">No tools match “{query}”.</p>
      ) : (
        <div className="space-y-14">
          {filtered.map((cat) => (
            <section key={cat.id}>
              <h2 className="mb-6 flex items-center gap-3 border-b border-ink-900 pb-3 font-serif text-2xl font-semibold">
                <Wrench className="size-5 text-gold-600" aria-hidden /> {cat.name}
              </h2>
              <div className="grid gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
                {cat.tools.map((tool) => (
                  <Link key={tool.id} to={`/tools/${tool.slug}`} className="group bg-white p-6 transition-colors hover:bg-paper-dark">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-xl font-semibold group-hover:text-gold-700">{tool.name}</h3>
                      {tool.featured && <Badge>Popular</Badge>}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{excerpt(tool.description, 110)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
export default ToolsDirectoryPage;
