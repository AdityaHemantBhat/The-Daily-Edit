import { useEffect, useState, type FormEvent } from 'react';
import { Clock, Mail, MapPin } from 'lucide-react';
import { publicApi } from '../../infrastructure/api/repositories';
import { usePublicSettings } from '../../application/hooks/usePublicData';
import { setPageMeta } from '../../application/services/seo';
import { Alert, Button, Container, Field, Input, Textarea } from '../../presentation/primitives';

/**
 * Public contact page: two-column editorial layout — how to reach us on the
 * left, the contact form on the right. Submissions land in the admin inbox
 * (Admin → Messages).
 */
export function ContactPage() {
  const { data: settings } = usePublicSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intro = settings?.legal?.contact;
  const contactEmail = settings?.site?.contactEmail;
  const social = Object.entries(settings?.site?.social ?? {}).filter(([, url]) => url);

  useEffect(() => {
    setPageMeta({
      title: 'Contact Us',
      description: intro ?? 'Get in touch with The Daily Edit editorial team.',
      path: '/contact',
    });
  }, [intro]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await publicApi.sendContactMessage(form);
      setSuccess(res.message);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Container className="py-14">
      <header className="max-w-2xl">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold-600">Contact us</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-950">We'd love to hear from you</h1>
        <p className="mt-4 leading-relaxed text-ink-500">
          {intro ?? 'For corrections, tips or business inquiries, send us a message — the editorial team replies within a few business days.'}
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        {/* Reach us — info column */}
        <aside className="space-y-8">
          <section>
            <h2 className="border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">
              Reach us directly
            </h2>
            <ul className="mt-5 space-y-4">
              {contactEmail ? (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                    <Mail className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-950">Email</p>
                    <a href={`mailto:${contactEmail}`} className="text-sm text-gold-700 hover:underline">{contactEmail}</a>
                  </div>
                </li>
              ) : null}
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <Clock className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-950">Response time</p>
                  <p className="text-sm text-ink-500">Within a few business days</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-950">What to contact us about</p>
                  <p className="text-sm text-ink-500">Corrections, story tips, tool suggestions, advertising and partnerships.</p>
                </div>
              </li>
            </ul>
          </section>

          {social.length > 0 && (
            <section>
              <h2 className="border-b border-ink-900 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.25em]">
                Elsewhere
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {social.map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-rule-dark px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-950 hover:text-paper"
                  >
                    {name}
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="border border-rule bg-white p-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Privacy note</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Your message goes only to the editorial team. We never share contact details, and
              there's no mailing-list signup hidden in this form.
            </p>
          </section>
        </aside>

        {/* The form */}
        <section className="border border-rule-dark bg-white p-6 md:p-8">
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-ink-950">Send a message</h2>
          {success ? (
            <div className="mt-6">
              <Alert tone="success">{success}</Alert>
              <Button variant="outline" className="mt-6" onClick={() => setSuccess(null)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={onSubmit}>
              {error && <Alert>{error}</Alert>}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={120} />
                </Field>
                <Field label="Email address">
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </Field>
              </div>
              <Field label="Subject">
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required minLength={2} maxLength={200} placeholder="Correction, tip, partnership…" />
              </Field>
              <Field label="Message" hint={`${form.message.length}/5000`}>
                <Textarea rows={7} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={10} maxLength={5000} />
              </Field>
              <Button type="submit" size="lg" disabled={sending}>
                {sending ? 'Sending…' : 'Send message'}
              </Button>
            </form>
          )}
        </section>
      </div>
    </Container>
  );
}
export default ContactPage;
