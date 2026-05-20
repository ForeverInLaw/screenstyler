'use client';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth/client';

export function AuthButton() {
  const { data, isPending } = useSession();
  if (isPending) {
    return (
      <span
        aria-hidden="true"
        className="h-9 w-20 rounded-md bg-zinc-200/80"
      />
    );
  }
  if (!data?.user) {
    return (
      <Link
        href="/?auth=login"
        className="rounded-md bg-zinc-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
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
      className="max-w-48 truncate rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
    >
      {data.user.email} · Sign out
    </button>
  );
}
