'use client';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { setActiveAuth } from '@/lib/storage/active-stores';

export function AuthSync(): null {
  const { data } = useSession();
  const userId = data?.user?.id ?? null;
  useEffect(() => {
    setActiveAuth(userId ? { userId } : null);
  }, [userId]);
  return null;
}
