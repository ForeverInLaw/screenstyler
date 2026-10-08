'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AccountShell } from '@/components/auth/AccountShell';
import { Button } from '@/components/ui/Button';
import { usePasswordResetMutation } from '@/lib/auth/use-account-actions';

function ResetInner() {
  const token = useSearchParams().get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const reset = usePasswordResetMutation(token);
  return (
    <AccountShell>
      <p className="eyebrow mb-3">ACCOUNT RECOVERY</p>
      <h1 className="text-2xl font-medium tracking-tight">
        {token ? 'Set a new password.' : 'Reset your password.'}
      </h1>
      <p className="mb-6 mt-3 text-sm leading-6 text-secondary">
        {token
          ? 'Use at least eight characters.'
          : 'We will email you a link to get back into your workspace.'}
      </p>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          reset.mutate({ email, password });
        }}
      >
        {token ? (
          <label className="grid gap-2 text-xs text-secondary">
            New password
            <input
              autoFocus
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="field"
            />
          </label>
        ) : (
          <label className="grid gap-2 text-xs text-secondary">
            Email
            <input
              autoFocus
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field"
            />
          </label>
        )}
        <Button type="submit" variant="primary" disabled={reset.isPending}>
          {reset.isPending ? 'Working...' : token ? 'Update password' : 'Send reset link'}
        </Button>
        {reset.error && (
          <p role="alert" className="notice notice-error">
            {reset.error.message}
          </p>
        )}
        {reset.data && (
          <p role="status" className="notice notice-success">
            {reset.data}
          </p>
        )}
      </form>
    </AccountShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
