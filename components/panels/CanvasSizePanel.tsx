'use client';
import { useDocumentStore } from '@/lib/document/store';
import { canvasPresets } from '@/lib/presets/canvas';

export function CanvasSizePanel() {
  const setCanvasSize = useDocumentStore((s) => s.setCanvasSize);
  return (
    <section style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Canvas size</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {canvasPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setCanvasSize(preset.id, preset.width, preset.height)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #2a2d36',
              cursor: 'pointer',
              textAlign: 'left',
              background: 'transparent',
              color: 'inherit',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  );
}
