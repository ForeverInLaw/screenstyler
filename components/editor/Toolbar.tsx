'use client';
import { useDocumentStore } from '@/lib/document/store';

type Tool = 'select' | 'arrow' | 'text' | 'highlight' | 'blur';

type Props = {
  projectName: string;
  onExport: () => void;
  activeTool?: Tool;
  onChangeTool?: (tool: Tool) => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
};

export function Toolbar({
  projectName,
  onExport,
  activeTool = 'select',
  onChangeTool = () => {},
  isPreview = false,
  onTogglePreview = () => {},
}: Props) {
  const undo = () => useDocumentStore.temporal.getState().undo();
  const redo = () => useDocumentStore.temporal.getState().redo();
  const setAnnotations = useDocumentStore((s) => s.setAnnotations);

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'select', label: 'Select', icon: '🖱️' },
    { id: 'arrow', label: 'Arrow', icon: '↗️' },
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'highlight', label: 'Highlight', icon: '🖍️' },
    { id: 'blur', label: 'Blur', icon: '🌫️' },
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 16px',
        borderBottom: '1px solid #2a2d36',
        background: '#16181d',
        color: '#e5e7eb',
      }}
    >
      <strong>Screenstyler</strong>
      <span style={{ opacity: 0.7, fontSize: '14px' }}>{projectName}</span>

      {/* Annotation Drawing Tools - hidden in preview */}
      {!isPreview && (
        <div style={{ display: 'flex', gap: 4, margin: '0 auto', background: '#0f1115', padding: 4, borderRadius: 8, border: '1px solid #2a2d36' }}>
          {tools.map((t) => {
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTool(t.id)}
                title={t.label}
                style={{
                  background: isActive ? '#6366f1' : 'transparent',
                  color: isActive ? '#ffffff' : '#e5e7eb',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'background 0.2s',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Spacer when tools are hidden */}
      {isPreview && <div style={{ margin: '0 auto' }} />}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!isPreview && (
          <>
            <button
              type="button"
              onClick={() => setAnnotations([])}
              style={{
                background: 'transparent',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                color: '#e5e7eb',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🧹 Clear annotations
            </button>
            <div style={{ width: 1, height: 20, background: '#2a2d36' }} />
            <button type="button" onClick={undo} aria-label="Undo" style={{ background: '#2a2d36', border: '1px solid #3a3d46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#ffffff' }}>Undo</button>
            <button type="button" onClick={redo} aria-label="Redo" style={{ background: '#2a2d36', border: '1px solid #3a3d46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#ffffff' }}>Redo</button>
            <div style={{ width: 1, height: 20, background: '#2a2d36' }} />
          </>
        )}
        <button
          type="button"
          onClick={onTogglePreview}
          style={{
            background: isPreview ? '#4b5563' : '#2a2d36',
            border: isPreview ? '1px solid #6b7280' : '1px solid #3a3d46',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#ffffff',
            fontWeight: 'bold',
          }}
        >
          {isPreview ? '👁️ Edit Mode' : '👁️ Preview'}
        </button>
        <button type="button" onClick={onExport} style={{ background: '#6366f1', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#ffffff', fontWeight: 'bold' }}>Export</button>
      </div>
    </header>
  );
}
