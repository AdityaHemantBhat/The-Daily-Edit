import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, authApi } from '../../infrastructure/api/repositories';
import { Alert, Button, Field, Input, Textarea } from '../../presentation/primitives';
import { MediaUrlField } from './MediaUrlField';
import { isValidAdminPath, RESERVED_PUBLIC_PATHS } from '../../app/config/adminPath';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../application/state/authContext';

const LEGAL_FIELDS: [string, string][] = [
  ['about', 'About Us'],
  ['contact', 'Contact'],
  ['privacyPolicy', 'Privacy Policy'],
  ['terms', 'Terms and Conditions'],
  ['disclaimer', 'Disclaimer'],
  ['editorialPolicy', 'Editorial Policy'],
  ['cookiePolicy', 'Cookie Policy'],
];

function ObjectEditor({ settingKey, fields, title, hint }: {
  settingKey: string; title: string; hint?: string;
  fields: [string, string, 'text' | 'textarea' | 'checkbox' | 'url' | 'email' | 'media'][] | null;
}) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });
  const value = ((data?.items ?? []).find((s) => s.key === settingKey)?.value ?? {}) as Record<string, unknown>;
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => setDraft(value), [data]);

  // Saving before hydration would overwrite the stored value with an empty draft.
  const hydrated = !!data;

  const save = useMutation({
    mutationFn: () => adminApi.saveSetting(settingKey, draft),
    onSuccess: async () => {
      // Propagate to the public site immediately: refresh the admin copy AND
      // the public settings query + its localStorage cache the header reads.
      await qc.invalidateQueries({ queryKey: ['admin-settings'] });
      await qc.invalidateQueries({ queryKey: ['settings-public'] });
      try {
        const fresh = await adminApi.settings();
        const merged: Record<string, unknown> = {};
        for (const item of fresh.items) merged[item.key] = item.value;
        const siteValue = merged['site'];
        if (settingKey === 'site' && siteValue) {
          localStorage.setItem('tde-public-settings', JSON.stringify({ ...merged, site: siteValue }));
        }
      } catch {
        // Cache refresh is best-effort; the invalidation above already triggers a refetch.
      }
    },
  });

  return (
    <section className="border border-rule-dark bg-white p-5">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2">
        {fields?.map(([key, label, type]) => (
          <div key={key} className={type === 'textarea' ? 'md:col-span-2' : ''}>
            {type === 'media' ? (
              <MediaUrlField
                value={String(draft[key] ?? '') || undefined}
                onChange={(url) => setDraft({ ...draft, [key]: url })}
                preview={key === 'faviconUrl' ? 'favicon' : 'logo'}
                label={label}
              />
            ) : type === 'checkbox' ? (
              <label className="flex items-center gap-2 py-2 text-sm text-ink-700">
                <input type="checkbox" checked={!!draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} className="accent-[#a16207]" />
                {label}
              </label>
            ) : (
              <Field label={label}>
                {type === 'textarea' ? (
                  <Textarea rows={4} value={String(draft[key] ?? '')} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                ) : (
                  <Input type={type === 'url' ? 'url' : type === 'email' ? 'email' : 'text'} value={String(draft[key] ?? '')} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                )}
              </Field>
            )}
          </div>
        ))}
        <div className="flex items-center gap-3 md:col-span-2">
          <Button onClick={() => save.mutate()} disabled={!hydrated || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
          {save.isSuccess && <span className="text-sm font-semibold text-green-700">✓ Saved</span>}
          {save.error && <span className="text-sm text-red-700">{save.error instanceof Error ? save.error.message : 'Save failed'}</span>}
          {!hydrated && <span className="text-xs text-ink-400">Loading current values…</span>}
        </div>
      </div>
    </section>
  );
}

function LegalEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });
  const legal = ((data?.items ?? []).find((s) => s.key === 'legal')?.value ?? {}) as Record<string, string>;
  const [active, setActive] = useState(LEGAL_FIELDS[0][0]);
  const [draft, setDraft] = useState<Record<string, string>>(legal);

  useEffect(() => setDraft(legal), [data]);
  const hydrated = !!data;

  const save = useMutation({
    mutationFn: () => adminApi.saveSetting('legal', draft),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  });

  return (
    <section className="border border-rule-dark bg-white p-5">
      <h2 className="font-serif text-xl font-semibold">Legal pages</h2>
      <p className="mt-1 text-xs text-ink-500">
        These texts appear on the public pages. Replace the template copy with your organization's real terms —
        do not publish placeholders in production.
      </p>
      <div className="mt-4 flex flex-wrap gap-1">
        {LEGAL_FIELDS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`px-3 py-1.5 text-xs font-semibold ${active === key ? 'bg-ink-900 text-paper' : 'bg-paper-dark text-ink-700 hover:bg-rule'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <Textarea rows={10} className="mt-3" value={draft[active] ?? ''} onChange={(e) => setDraft({ ...draft, [active]: e.target.value })} />
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={!hydrated || save.isPending}>{save.isPending ? 'Saving…' : 'Save legal pages'}</Button>
        {save.isSuccess && <span className="text-sm font-semibold text-green-700">✓ Saved</span>}
        {save.error && <span className="text-sm text-red-700">{save.error instanceof Error ? save.error.message : 'Save failed'}</span>}
      </div>
    </section>
  );
}

function SecurityEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });
  const value = ((data?.items ?? []).find((s0) => s0.key === 'site')?.value ?? {}) as Record<string, unknown>;
  const [draft, setDraft] = useState('');

  useEffect(() => setDraft(String(value.adminPath ?? '/admin')), [data]);
  const hydrated = !!data;

  const valid = isValidAdminPath(draft.trim());
  const collision = RESERVED_PUBLIC_PATHS.includes(draft.trim().replace(/\/+$/, ''));
  const save = useMutation({
    mutationFn: async () => {
      const next = { ...value, adminPath: draft.trim() };
      await adminApi.saveSetting('site', next);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-settings'] });
      await qc.invalidateQueries({ queryKey: ['settings-public'] });
    },
  });

  return (
    <section className="border border-rule-dark bg-white p-5">
      <h2 className="font-serif text-xl font-semibold">Admin URL</h2>
      <p className="mt-1 text-xs text-ink-500">Change the address of the admin area.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center">
          <span className="border border-rule-dark bg-paper-dark px-3 py-2.5 text-sm text-ink-500">domain.com</span>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            className="!w-52 !rounded-none"
            placeholder="/admin"
            aria-label="Admin URL path"
          />
        </div>
        <Button onClick={() => save.mutate()} disabled={!hydrated || !valid || save.isPending || draft.trim() === String(value.adminPath ?? '/admin')}>
          {save.isPending ? 'Saving…' : 'Update admin URL'}
        </Button>
        {save.isSuccess && <span className="text-sm font-semibold text-green-700">✓ Saved</span>}
      </div>
      {draft.trim() !== '' && collision && (
        <p className="mt-2 text-xs text-red-700">That path is used by the public site — pick something else.</p>
      )}
      {draft.trim() !== '' && !collision && !valid && (
        <p className="mt-2 text-xs text-red-700">Use 2–40 lowercase letters, numbers or dashes, starting with /.</p>
      )}
      {save.error && <p className="mt-2 text-xs text-red-700">{save.error instanceof Error ? save.error.message : 'Save failed'}</p>}
    </section>
  );
}

function ProfileEditor() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState({ email: '', username: '', name: '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (user) setProfile({ email: user.email, username: user.username, name: user.name });
  }, [user]);

  const saveProfile = useMutation({
    mutationFn: () => authApi.updateProfile(profile),
    onSuccess: async () => {
      await refresh();
      void qc.invalidateQueries();
      setMsg({ tone: 'success', text: 'Profile updated.' });
    },
    onError: (err) => setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'Update failed' }),
  });

  const savePassword = useMutation({
    mutationFn: () => authApi.changePassword(pw.current, pw.next),
    onSuccess: () => setMsg({ tone: 'success', text: 'Password changed. Please sign in again with your new password.' }),
    onError: (err) => setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'Password change failed' }),
  });

  return (
    <section className="border border-rule-dark bg-white p-5">
      <h2 className="font-serif text-xl font-semibold">Your account</h2>
      {msg && <div className="mt-3"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Name"><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
        <Field label="Username"><Input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} /></Field>
      </div>
      <Button className="mt-4" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>Save profile</Button>

      <div className="mt-8 border-t border-rule pt-6">
        <h3 className="font-semibold">Change password</h3>
        <p className="mt-1 text-xs text-ink-500">Minimum 10 characters with upper, lower and a digit. All sessions are signed out after a change.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Current password">
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" className="!pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-950" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field label="New password">
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" className="!pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-950" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
        </div>
        <Button className="mt-4" variant="outline" onClick={() => savePassword.mutate()} disabled={!pw.current || !pw.next || savePassword.isPending}>Change password</Button>
      </div>
    </section>
  );
}

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Website settings</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <ObjectEditor
          settingKey="site"
          title="Brand & identity"
          fields={[
            ['name', 'Website name', 'text'],
            ['tagline', 'Tagline', 'text'],
            ['logoUrl', 'Logo', 'media'],
            ['faviconUrl', 'Favicon', 'media'],
            ['contactEmail', 'Contact email', 'email'],
            ['twitter', 'X / Twitter URL', 'url'],
            ['github', 'GitHub URL', 'url'],
            ['linkedin', 'LinkedIn URL', 'url'],
            ['youtube', 'YouTube URL', 'url'],
          ]}
          hint="Shown in the masthead, footer and metadata."
        />
        <div className="space-y-6">
          <ObjectEditor
            settingKey="announcement"
            title="Announcement strip"
            hint="Compact strip shown above the masthead."
            fields={[
              ['enabled', 'Enabled', 'checkbox'],
              ['text', 'Text', 'text'],
              ['linkUrl', 'Link URL (e.g. /tools)', 'text'],
              ['linkText', 'Link label', 'text'],
            ]}
          />
          <ObjectEditor
            settingKey="homeSections"
            title="Homepage sections"
            fields={[
              ['showTrending', 'Show trending / picks row', 'checkbox'],
              ['showTools', 'Show tools preview', 'checkbox'],
              ['showEditorsPicks', "Show editor's picks", 'checkbox'],
              ['showRecentlyUpdated', 'Show recently updated', 'checkbox'],
            ]}
          />
        </div>
      </div>
      <ObjectEditor
        settingKey="newsletter"
        title="Newsletter section"
        fields={[
          ['enabled', 'Show newsletter section', 'checkbox'],
          ['heading', 'Heading', 'text'],
          ['body', 'Body copy', 'textarea'],
        ]}
      />
      <LegalEditor />
      <SecurityEditor />
      <ProfileEditor />
    </div>
  );
}
