'use client';
import type { ReactNode } from 'react';

// Better Auth's React client exposes session hooks directly; this provider exists
// as a thin extension point for future per-tree session work.
export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
