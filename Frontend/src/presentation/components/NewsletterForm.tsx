import { useState } from 'react';
import { useSubscribe } from '../../application/hooks/usePublicData';
import { Button, Input } from '../primitives';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const subscribe = useSubscribe();

  const submitted = subscribe.isSuccess;
  const error = subscribe.error instanceof Error ? subscribe.error.message : null;

  return (
    <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-gold-600">Newsletter</p>
      <h2 className="mt-2 font-serif text-4xl font-semibold text-ink-950">The Edit, in your inbox</h2>
      <p className="mt-3 text-ink-500">
        One thoughtful email each week: the best stories, new tools, and nothing else. Unsubscribe anytime.
      </p>

      {submitted ? (
        <p className="mx-auto mt-8 max-w-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {subscribe.data?.message ?? 'Thanks — check your inbox to confirm your subscription.'}
        </p>
      ) : (
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (consent) subscribe.mutate(email);
          }}
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1"
          />
          <Button type="submit" disabled={!consent || subscribe.isPending} className="w-full sm:w-auto">
            {subscribe.isPending ? 'Subscribing…' : 'Subscribe'}
          </Button>
        </form>
      )}

      {!submitted && (
        <label className="mt-4 inline-flex cursor-pointer items-start gap-2 text-left text-xs text-ink-500">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-3.5 accent-[#a16207]"
          />
          I agree to receive the newsletter and have read the Privacy Policy. No spam, unsubscribe with one click.
        </label>
      )}
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
