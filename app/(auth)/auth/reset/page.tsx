'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

function ResetInner() {
  const token = useSearchParams().get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  if (token) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await authClient.resetPassword({ token, newPassword: password });
          setMsg(error ? error.message ?? 'Reset failed' : 'Password updated. Sign in.');
        }}
        style={page}
      >
        <h1>Set new password</h1>
        <input
          type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8} required
        />
        <button type="submit">Update password</button>
        {msg && <p>{msg}</p>}
      </form>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await authClient.requestPasswordReset({ email, redirectTo: '/auth/reset' });
        setMsg('If that email is registered, a reset link is on the way.');
      }}
      style={page}
    >
      <h1>Reset password</h1>
      <input
        type="email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send reset link</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}

const page: React.CSSProperties = { display: 'grid', gap: 8, maxWidth: 360, margin: '64px auto', padding: 24 };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
