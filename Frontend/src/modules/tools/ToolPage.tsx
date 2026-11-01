import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTool, useRecordToolUsage } from '../../application/hooks/usePublicData';
import { ToolComponent } from './registry';
import { AdSlot } from '../../presentation/components/AdSlot';
import { breadcrumbJsonLd, faqJsonLd, setPageMeta, softwareAppJsonLd } from '../../application/services/seo';
import { Alert, Badge, Container } from '../../presentation/primitives';
import { SkeletonTool } from '../../presentation/components/skeletons';

export function ToolPage() {
  const { slug = '' } = useParams();
  const { data: tool, isLoading, isError } = useTool(slug);
  const recordUsage = useRecordToolUsage(slug);
  const counted = useRef(false);

  useEffect(() => {
    if (tool && !counted.current) {
      counted.current = true;
      recordUsage.mutate();
    }
  }, [tool]);

  useEffect(() => {
    if (!tool) return;
    const jsonLd: Record<string, unknown>[] = [
      softwareAppJsonLd(tool),
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Tools', path: '/tools' },
        { name: tool.name, path: `/tools/${tool.slug}` },
      ]),
    ];
    // FAQ structured data only when the FAQ content exists and is non-empty.
    if (tool.faqs?.length) jsonLd.push(faqJsonLd(tool.faqs));
    setPageMeta({
      title: tool.seoTitle ?? tool.name,
      description: tool.seoDescription ?? tool.description,
      path: `/tools/${tool.slug}`,
      jsonLd,
    });
  }, [tool]);

  if (isLoading) return <SkeletonTool />;
  if (isError || !tool) return <Container className="py-20"><Alert>Tool not found. <Link to="/tools" className="underline">Browse all tools</Link></Alert></Container>;

  return (
    <Container className="py-10">
      <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-widest text-ink-500">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:text-gold-700">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link to="/tools" className="hover:text-gold-700">Tools</Link></li>
          <li aria-hidden>/</li>
          <li className="text-ink-950">{tool.name}</li>
        </ol>
      </nav>

      <header className="mt-6 border-b-2 border-ink-900 pb-6">
        <Badge>{tool.category.name}</Badge>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold text-ink-950 md:text-5xl">{tool.name}</h1>
        <p className="mt-3 text-ink-500">{tool.description}</p>
      </header>

      <div className="py-6"><AdSlot placement="tool_page" minHeight={90} /></div>

      <section className="mt-4">
        <ToolComponent componentKey={tool.componentKey} />
      </section>

      {tool.instructions && (
        <section className="mt-12 border-t border-rule pt-8">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold">How to use</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-500">{tool.instructions}</p>
        </section>
      )}

      {tool.faqs && tool.faqs.length > 0 && (
        <section className="mt-10 border-t border-rule pt-8">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {tool.faqs.map((faq) => (
              <details key={faq.question} className="border border-rule bg-white px-4 py-3">
                <summary className="cursor-pointer font-semibold text-ink-950">{faq.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {tool.related && tool.related.length > 0 && (
        <section className="mt-10 border-t border-rule pt-8">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold">Related tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {tool.related.map((r) => (
              <Link key={r.slug} to={`/tools/${r.slug}`} className="border border-rule p-4 transition-colors hover:border-ink-900">
                <p className="font-serif text-lg font-semibold hover:text-gold-700">{r.name}</p>
                <p className="mt-1 text-sm text-ink-500">{r.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
export default ToolPage;
