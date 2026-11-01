import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../application/state/authContext';
import { Alert, Button, Field, Input } from '../../presentation/primitives';
import { SITE_NAME } from '../../app/config/site';
import { getAdminPath } from '../../app/config/adminPath';
import { setPageMeta } from '../../application/services/seo';

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? `${getAdminPath()}/dashboard`;

  useEffect(() => {
    setPageMeta({ title: 'Admin sign in', path: getAdminPath(), noindex: true });
  }, []);

  if (user && !loading) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(identifier.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-serif text-4xl font-bold text-paper">{SITE_NAME}</p>
          <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-[0.4em] text-gold-100/70">Editorial Admin</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white p-8 shadow-2xl" noValidate={false}>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
            <Lock className="size-5 text-gold-600" aria-hidden /> Sign in
          </h1>

          {error && <div className="mt-4"><Alert>{error}</Alert></div>}

          <div className="mt-6 space-y-5">
            <Field label="Email or username">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-950"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[#a16207]" />
              Keep me signed in for 30 days
            </label>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>

          <p className="mt-6 border-t border-rule pt-4 text-xs text-ink-500 text-center">
            Authorized personnel only.
          </p>
        </form>
      </div>
    </div>
  );
}
