'use client';
import type { ReactNode } from 'react';

type Props = { toolbar: ReactNode; canvas: ReactNode; panel: ReactNode };

export function EditorShell({ toolbar, canvas, panel }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {toolbar}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <main style={{ flex: 1, display: 'flex', minWidth: 0 }}>{canvas}</main>
        <aside
          style={{
            width: 320,
            borderLeft: '1px solid #2a2d36',
            background: '#16181d',
            color: '#e5e7eb',
            overflowY: 'auto',
          }}
        >
          {panel}
        </aside>
      </div>
    </div>
  );
}
