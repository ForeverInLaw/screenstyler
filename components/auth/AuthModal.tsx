'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth/client';

type AuthMode = 'login' | 'signup';

function getMode(value: string | null): AuthMode | null {
  if (value === 'login' || value === 'signup') return value;
  return null;
}

export function AuthModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = getMode(searchParams.get('auth'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!mode) return null;

  const isSignup = mode === 'signup';

  function close() {
    router.push('/');
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const { error: signupError } = await signUp.email({
          email,
          password,
          name: email,
          callbackURL: '/projects',
        });
        if (signupError) {
          setError(signupError.message ?? 'Sign up failed');
          return;
        }
        setMessage(`We sent a verification link to ${email}.`);
        return;
      }

      const { error: loginError } = await signIn.email({
        email,
        password,
        callbackURL: '/projects',
      });
      if (loginError) {
        setError(loginError.message ?? 'Sign in failed');
        return;
      }
      router.push('/projects');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setIsSubmitting(true);
    await signIn.social({ provider: 'google', callbackURL: '/projects' });
    setIsSubmitting(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/50 px-4 py-8 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl bg-stone-50 p-2 shadow-2xl shadow-zinc-950/30 ring-1 ring-white/70">
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Screenstyler account</p>
              <h2 id="auth-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {isSignup ? 'Create your account' : 'Sign in to sync'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {isSignup
                  ? 'Save projects across devices and keep exports organized.'
                  : 'Open cloud projects before you start editing.'}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close authentication modal"
              className="grid size-9 place-items-center rounded-md text-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              x
            </button>
          </div>

          <form onSubmit={handleEmail} className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                className="rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 shadow-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={isSignup ? 8 : undefined}
                required
                className="rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 shadow-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              {isSubmitting ? 'Working...' : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="mt-3 w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
          >
            Continue with Google
          </button>

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950">
              {message}
            </p>
          )}

          <p className="mt-5 text-center text-sm text-zinc-600">
            {isSignup ? 'Have an account?' : 'No account?'}{' '}
            <Link
              href={isSignup ? '/?auth=login' : '/?auth=signup'}
              className="font-semibold text-zinc-950 underline-offset-4 hover:underline"
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
