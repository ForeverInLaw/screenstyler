'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await signIn.email({ email, password, callbackURL: '/projects' });
    if (error) setErr(error.message ?? 'Sign in failed');
    else router.push('/projects');
  }

  async function handleGoogle() {
    await signIn.social({ provider: 'google', callbackURL: '/projects' });
  }

  return (
    <main style={{ maxWidth: 360, margin: '64px auto', padding: 24 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleEmail} style={{ display: 'grid', gap: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit">Sign in</button>
      </form>
      <button type="button" onClick={handleGoogle} style={{ marginTop: 8, width: '100%' }}>
        Continue with Google
      </button>
      {err && <p style={{ color: '#f87171' }}>{err}</p>}
      <p>No account? <Link href="/signup">Sign up</Link></p>
    </main>
  );
}
