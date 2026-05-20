'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signUp, signIn } from '@/lib/auth/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await signUp.email({ email, password, name: email });
    if (error) setErr(error.message ?? 'Sign up failed');
    else setDone(true);
  }

  if (done) {
    return (
      <main style={{ maxWidth: 360, margin: '64px auto', padding: 24 }}>
        <h1>Check your email</h1>
        <p>We sent a verification link to {email}.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 360, margin: '64px auto', padding: 24 }}>
      <h1>Sign up</h1>
      <form onSubmit={handleEmail} style={{ display: 'grid', gap: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required minLength={8} />
        <button type="submit">Create account</button>
      </form>
      <button
        type="button"
        onClick={() => signIn.social({ provider: 'google', callbackURL: '/projects' })}
        style={{ marginTop: 8, width: '100%' }}
      >
        Continue with Google
      </button>
      {err && <p style={{ color: '#f87171' }}>{err}</p>}
      <p>Have an account? <Link href="/login">Sign in</Link></p>
    </main>
  );
}
