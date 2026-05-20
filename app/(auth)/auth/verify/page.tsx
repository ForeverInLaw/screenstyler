'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

function VerifyInner() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'pending' | 'ok' | 'err'>(() =>
    token ? 'pending' : 'err',
  );

  useEffect(() => {
    if (!token) return;
    authClient
      .verifyEmail({ query: { token } })
      .then((r) => setState(r.error ? 'err' : 'ok'))
      .catch(() => setState('err'));
  }, [token]);

  if (state === 'pending') {
    return <main style={page}><p>Verifying…</p></main>;
  }
  if (state === 'ok') {
    return <main style={page}><h1>Email verified</h1><p>You can now sign in.</p></main>;
  }
  return <main style={page}><h1>Verification failed</h1><p>The link may have expired.</p></main>;
}

const page: React.CSSProperties = { maxWidth: 360, margin: '64px auto', padding: 24 };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
