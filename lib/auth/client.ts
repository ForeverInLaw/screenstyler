'use client';
import { createAuthClient } from 'better-auth/react';
import { isLocalOnly } from '@/lib/config/runtime';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined' ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'),
});

export const { signIn, signOut, signUp } = authClient;

// In local-only mode there is no auth backend, so the real useSession would
// fire a hanging /api/auth request and block session-gated queries. Swap it for
// a constant, no-network hook. Resolved once at module load (NEXT_PUBLIC flag is
// build-inlined) so the same hook runs every render — no rules-of-hooks issue.
const localUseSession: typeof authClient.useSession = () => ({
  data: null,
  error: null,
  isPending: false,
  isRefetching: false,
  refetch: () => Promise.resolve(),
});

export const useSession: typeof authClient.useSession = isLocalOnly()
  ? localUseSession
  : authClient.useSession;
