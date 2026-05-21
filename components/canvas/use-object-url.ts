'use client';
import { useEffect, useState } from 'react';
import { useBlobQuery } from '@/lib/blobs/use-blob';

export function useObjectUrl(blobKey: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const blob = useBlobQuery(blobKey);

  useEffect(() => {
    let cancelled = false;

    if (!blob.data) {
      queueMicrotask(() => {
        if (!cancelled) setUrl(null);
      });
      return () => {
        cancelled = true;
      };
    }

    const objectUrl = URL.createObjectURL(blob.data);
    queueMicrotask(() => {
      if (!cancelled) setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob.data]);

  return blobKey ? url : null;
}
