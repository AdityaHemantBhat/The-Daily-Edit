import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicSettings } from '../../application/hooks/usePublicData';
import { setPageMeta } from '../../application/services/seo';
import { Container } from '../../presentation/primitives';

const SLUGS: Record<string, { title: string; body: string; updatedKey: string }> = {
  '/privacy-policy': { title: 'Privacy Policy', body: 'privacyPolicy', updatedKey: 'privacyPolicy' },
  '/terms': { title: 'Terms and Conditions', body: 'terms', updatedKey: 'terms' },
  '/disclaimer': { title: 'Disclaimer', body: 'disclaimer', updatedKey: 'disclaimer' },
  '/editorial-policy': { title: 'Editorial Policy', body: 'editorialPolicy', updatedKey: 'editorialPolicy' },
  '/cookie-policy': { title: 'Cookie Policy', body: 'cookiePolicy', updatedKey: 'cookiePolicy' },
};

export function LegalPage() {
  const { pathname } = useLocation();
  const { data: settings } = usePublicSettings();
  const page = SLUGS[pathname];

  useEffect(() => {
    if (page) setPageMeta({ title: page.title, path: pathname });
  }, [page, pathname]);

  if (!page) return null;

  const text = settings?.legal?.[page.body];

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-4xl">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold-600">{page.title}</p>
      <h1 className="mt-2 border-b-2 border-ink-900 pb-5 font-serif text-3xl sm:text-4xl font-semibold md:text-5xl">{page.title}</h1>
      <div className="prose-editorial mt-8">
        {text ? (
          text.split(/\n\s*\n/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))
        ) : (
          <p>
            This page's content is managed in the admin panel (Settings → Legal pages) and has not
            been configured yet.
          </p>
        )}
      </div>
      {text && (
        <p className="mt-12 border-t border-rule pt-4 text-xs text-ink-400">
          Reviewed by the {settings?.site?.name ?? 'The Daily Edit'} editorial team.
        </p>
      )}
      </div>
    </Container>
  );
}
export default LegalPage;
