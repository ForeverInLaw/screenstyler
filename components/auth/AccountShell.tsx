import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand } from '@/components/common/Brand';

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" aria-label="Screenstyler home" className="mb-10 inline-block">
          <Brand />
        </Link>
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">{children}</section>
        <Link href="/?auth=login" className="mt-6 block text-center text-xs text-secondary hover:text-accent">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
