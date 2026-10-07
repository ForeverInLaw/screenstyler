'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { runMigration, MIGRATED_FLAG } from '@/lib/migration/run-migration';
import { LocalProjectStore } from '@/lib/storage/local-project-store';
import { IdbBlobStore } from '@/lib/storage/idb-blob-store';

type MigrationState = 'idle' | 'done' | 'err';

export function MigrationRunner() {
  const { data } = useSession();
  const userId = data?.user?.id ?? null;
  const queryClient = useQueryClient();
  const [state, setState] = useState<MigrationState>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(MIGRATED_FLAG)) return 'done';
    return 'idle';
  });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (localStorage.getItem(MIGRATED_FLAG)) return;
    if (startedRef.current) return;
    startedRef.current = true;

    runMigration({
      local: new LocalProjectStore(),
      blob: new IdbBlobStore(),
      userId,
    })
      .then((r) => {
        setState(r.failed ? 'err' : 'done');
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      })
      .catch(() => setState('err'));
  }, [userId, queryClient]);

  // Derive running: userId is set, flag absent, and migration hasn't resolved yet.
  const isRunning =
    !!userId && state === 'idle' && (typeof window === 'undefined' || !localStorage.getItem(MIGRATED_FLAG));

  if (state === 'done' || (!isRunning && state === 'idle')) return null;
  if (isRunning)
    return (
      <div
        role="status"
        className="notice fixed bottom-4 right-4 z-40 max-w-sm border border-border bg-surface"
      >
        Migrating local projects...
      </div>
    );
  return (
    <div
      role="alert"
      className="notice notice-error fixed bottom-4 right-4 z-40 max-w-sm border border-border"
    >
      Some projects failed to migrate. They remain in this browser.
    </div>
  );
}
