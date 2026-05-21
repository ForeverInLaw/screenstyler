'use client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/client';
import { blobStoreScopeForKey, getBlobStoreForKey } from '@/lib/storage/active-stores';

export const blobKeys = {
  all: ['blobs'] as const,
  byKey: (userId: string | null, blobKey: string) =>
    ['blobs', blobStoreScopeForKey(userId, blobKey), userId ?? 'anonymous', blobKey] as const,
};

export function useBlobQuery(blobKey: string | null) {
  const session = useSession();
  const userId = session.data?.user?.id ?? null;
  const isAuthPending = Boolean(session.isPending);

  return useQuery({
    queryKey: blobKeys.byKey(userId, blobKey ?? 'none'),
    queryFn: async () => {
      const blob = await getBlobStoreForKey(blobKey, userId).get(blobKey as string);
      return blob ?? null;
    },
    enabled: Boolean(blobKey) && !isAuthPending,
    retry: false,
  });
}
