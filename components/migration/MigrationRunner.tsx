'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { runMigration, MIGRATED_FLAG } from '@/lib/migration/run-migration';
import { LocalProjectStore } from '@/lib/storage/local-project-store';
import { IdbBlobStore } from '@/lib/storage/idb-blob-store';

const banner: React.CSSProperties = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  padding: '8px 12px',
  background: '#1e293b',
  color: '#e5e7eb',
  borderRadius: 8,
};

type MigrationState = 'idle' | 'running' | 'done' | 'err';

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
    !!userId &&
    state === 'idle' &&
    (typeof window === 'undefined' || !localStorage.getItem(MIGRATED_FLAG));

  if (state === 'done' || (!isRunning && state === 'idle')) return null;
  if (isRunning || state === 'running') return <div style={banner}>Migrating local projects…</div>;
  return <div style={{ ...banner, background: '#7f1d1d' }}>Some projects failed to migrate. They remain in this browser.</div>;
}
