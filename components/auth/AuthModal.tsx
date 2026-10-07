'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { IconBrandGoogle } from '@tabler/icons-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useEmailAuthMutation, useGoogleAuthMutation } from '@/lib/auth/use-account-actions';

export function AuthModal() {
  const router = useRouter();
  const value = useSearchParams().get('auth');
  const mode = value === 'login' || value === 'signup' ? value : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailAuth = useEmailAuthMutation();
  const googleAuth = useGoogleAuthMutation();
  if (!mode) return null;
  const signup = mode === 'signup';
  const pending = emailAuth.isPending || googleAuth.isPending;
  const error = emailAuth.error ?? googleAuth.error;
  return (
    <Dialog
      title={signup ? 'Create your account' : 'Welcome back.'}
      description={
        signup ? 'Keep your projects with you, on every device.' : 'Sign in to open your cloud workspace.'
      }
      onDismiss={() => router.push('/')}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          googleAuth.reset();
          emailAuth.mutate(
            { mode, email, password },
            {
              onSuccess: (result) => {
                if (result.mode === 'login') router.push('/projects');
              },
            },
          );
        }}
      >
        <label className="grid gap-2 text-xs font-medium text-secondary">
          Email
          <input
            autoFocus
            data-autofocus
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="field"
          />
        </label>
        <label className="grid gap-2 text-xs font-medium text-secondary">
          Password
          <input
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={signup ? 8 : undefined}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </label>
        {!signup && (
          <Link href="/auth/reset" className="justify-self-end text-xs text-secondary hover:text-accent">
            Forgot password?
          </Link>
        )}
        <Button variant="primary" type="submit" disabled={pending} className="w-full">
          {emailAuth.isPending ? 'Working...' : signup ? 'Create account' : 'Sign in'}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-[10px] text-tertiary">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        className="w-full"
        disabled={pending}
        onClick={() => {
          emailAuth.reset();
          googleAuth.mutate();
        }}
      >
        <IconBrandGoogle size={17} />
        {googleAuth.isPending ? 'Connecting...' : 'Continue with Google'}
      </Button>
      {error && (
        <p role="alert" className="notice notice-error mt-4">
          {error.message}
        </p>
      )}
      {emailAuth.data?.mode === 'signup' && (
        <p role="status" className="notice notice-success mt-4">
          We sent a verification link to {emailAuth.data.email}.
        </p>
      )}
      <p className="mt-6 text-center text-xs text-secondary">
        {signup ? 'Have an account?' : 'New to the studio?'}{' '}
        <Link
          href={signup ? '/?auth=login' : '/?auth=signup'}
          onClick={() => {
            emailAuth.reset();
            googleAuth.reset();
          }}
          className="font-semibold text-accent"
        >
          {signup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </Dialog>
  );
}
