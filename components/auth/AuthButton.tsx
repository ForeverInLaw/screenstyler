'use client';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth/client';

export function AuthButton() {
  const { data, isPending } = useSession();
  if (isPending) return null;
  if (!data?.user) {
    return <Link href="/login">Sign in</Link>;
  }
  return (
    <button
      type="button"
      onClick={() => signOut()}
      aria-label={`Sign out ${data.user.email}`}
    >
      {data.user.email} · Sign out
    </button>
  );
}
