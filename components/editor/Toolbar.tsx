'use client';
import { useDocumentStore } from '@/lib/document/store';
import { AuthButton } from '@/components/auth/AuthButton';

type Props = { projectName: string; onExport: () => void };

export function Toolbar({ projectName, onExport }: Props) {
  const undo = () => useDocumentStore.temporal.getState().undo();
  const redo = () => useDocumentStore.temporal.getState().redo();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid #2a2d36',
        background: '#16181d',
        color: '#e5e7eb',
      }}
    >
      <strong>Screenstyler</strong>
      <span style={{ opacity: 0.7 }}>{projectName}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button type="button" onClick={undo} aria-label="Undo">Undo</button>
        <button type="button" onClick={redo} aria-label="Redo">Redo</button>
        <button type="button" onClick={onExport}>Export</button>
        <AuthButton />
      </div>
    </header>
  );
}
