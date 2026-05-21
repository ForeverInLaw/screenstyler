'use client';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth/client';

export function AuthButton() {
  const { data, isPending } = useSession();
  if (isPending) {
    return (
      <span
        aria-hidden="true"
        className="h-9 w-20 rounded-lg bg-zinc-800/50 animate-pulse"
      />
    );
  }
  if (!data?.user) {
    return (
      <Link
        href="/?auth=login"
        className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        Sign in
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => signOut()}
      aria-label={`Sign out ${data.user.email}`}
      className="max-w-48 truncate rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-300 shadow-sm transition hover:bg-zinc-800/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
    >
      {data.user.email} · Sign out
    </button>
  );
}
