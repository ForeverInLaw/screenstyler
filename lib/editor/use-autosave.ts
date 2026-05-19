'use client';
import { useEffect, useRef } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import type { ScreenstylerDoc } from '@/lib/document/schema';

const DEBOUNCE_MS = 800;

export function useAutosave(
  projectId: string | null,
  save: (id: string, doc: ScreenstylerDoc) => void,
  baselineDoc?: ScreenstylerDoc,
): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = useDocumentStore.subscribe((state) => {
      if (state.doc === baselineDoc) return; // skip the just-loaded baseline
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => save(projectId, state.doc), DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [projectId, save, baselineDoc]);
}
