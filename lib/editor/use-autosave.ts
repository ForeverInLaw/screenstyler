'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useDocumentStore, normalizeDoc } from '@/lib/document/store';
import type { ScreenstylerDoc } from '@/lib/document/schema';

const DEBOUNCE_MS = 800;

export function useAutosave(
  projectId: string | null,
  save: (id: string, doc: ScreenstylerDoc) => void,
  baselineDoc?: ScreenstylerDoc,
): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The store holds the *normalized* doc (loadDoc -> normalizeDoc), so the
  // baseline must be normalized too — otherwise the freshly-loaded state never
  // equals the raw baseline and merely opening a project schedules a save.
  const baselineString = useMemo(
    () => (baselineDoc ? JSON.stringify(normalizeDoc(baselineDoc)) : null),
    [baselineDoc],
  );

  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = useDocumentStore.subscribe((state) => {
      if (baselineString && JSON.stringify(state.doc) === baselineString) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => save(projectId, state.doc), DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [projectId, save, baselineString]);
}
