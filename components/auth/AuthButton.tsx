'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconLogout } from '@tabler/icons-react';
import { useSession, signOut } from '@/lib/auth/client';

export function AuthButton() {
  const { data, isPending } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

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
  const email = data.user.email ?? '';
  const avatarLabel = email.trim().charAt(0).toUpperCase() || '?';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsMenuOpen((value) => !value)}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="grid size-9 place-items-center rounded-full border border-zinc-300 bg-white text-sm font-bold uppercase text-zinc-900 shadow-sm transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
      >
        {avatarLabel}
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-950/10"
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-950 text-sm font-bold uppercase text-white">
                {avatarLabel}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Signed in as</p>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-950">{email}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-red-700"
          >
            <IconLogout size={18} stroke={1.8} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
