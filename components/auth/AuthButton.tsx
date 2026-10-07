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
    return <span aria-hidden="true" className="h-10 w-20 rounded-lg bg-well" />;
  }
  if (!data?.user) {
    return (
      <Link href="/?auth=login" className="button button-primary">
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
        className="grid size-10 place-items-center rounded-full border border-border bg-well font-mono text-sm font-semibold uppercase text-accent hover:bg-accent-soft"
      >
        {avatarLabel}
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-surface"
        >
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-sm font-semibold uppercase text-accent">
                {avatarLabel}
              </span>
              <div className="min-w-0">
                <p className="eyebrow">Signed in as</p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">{email}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut()}
            className="flex min-h-12 w-full items-center gap-2 px-4 py-3 text-left text-sm text-danger hover:bg-danger-soft"
          >
            <IconLogout size={18} stroke={1.8} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
