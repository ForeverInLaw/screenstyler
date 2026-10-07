'use client';
import Link from 'next/link';
import { IconLogout } from '@tabler/icons-react';
import { useSession, signOut } from '@/lib/auth/client';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/DropdownMenu';

export function AuthButton() {
  const { data, isPending } = useSession();
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
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open profile menu"
        className="grid size-10 place-items-center rounded-full border border-border bg-well font-mono text-sm font-semibold uppercase text-accent hover:bg-accent-soft"
      >
        {avatarLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent aria-label="Profile menu" className="w-72">
        <div className="mb-1 border-b border-border px-3 py-3">
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
        <DropdownMenuItem variant="danger" onClick={() => signOut()}>
          <IconLogout size={18} stroke={1.8} aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
