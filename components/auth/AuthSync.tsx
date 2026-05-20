'use client';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { setActiveAuth } from '@/lib/storage/active-stores';

export function AuthSync(): null {
  const { data } = useSession();
  const userId = data?.user?.id ?? null;
  const queryClient = useQueryClient();
  useEffect(() => {
    setActiveAuth(userId ? { userId } : null);
    // Discard cached entries from the previous backend entirely so the next
    // render refetches from scratch rather than showing stale data.
    queryClient.removeQueries({ queryKey: ['projects'] });
    queryClient.removeQueries({ queryKey: ['project'] });
  }, [userId, queryClient]);
  return null;
}
