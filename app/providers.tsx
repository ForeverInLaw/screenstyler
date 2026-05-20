'use client';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { AuthSync } from '@/components/auth/AuthSync';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <SessionProvider>
        <AuthSync />
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
