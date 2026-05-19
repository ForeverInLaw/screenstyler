'use client';
import { useEffect, useState } from 'react';
import { blobStore } from '@/lib/storage/blob-store-instance';

export function useObjectUrl(blobKey: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blobKey) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    blobStore.get(blobKey).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blobKey]);

  return blobKey ? url : null;
}
