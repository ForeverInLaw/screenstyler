'use client';
import { useDocumentStore } from '@/lib/document/store';

export function GridPanel() {
  const grid = useDocumentStore((s) => s.doc.canvas.grid) || { visible: false, size: 20, snap: false };
  const setGridSettings = useDocumentStore((s) => s.setGridSettings);

  return (
    <section style={{ padding: 16, borderBottom: '1px solid #2a2d36' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>Grid & Alignment</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Toggle Grid Visibility */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#d1d5db', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={grid.visible}
            onChange={(e) => setGridSettings({ visible: e.target.checked })}
            style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
          />
          Show Grid lines
        </label>

        {/* Toggle Snap to Grid */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#d1d5db', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={grid.snap}
            onChange={(e) => setGridSettings({ snap: e.target.checked })}
            style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
          />
          Snap elements to Grid
        </label>

        {/* Grid Size Control */}
        <div style={{ display: 'block', margin: '4px 0 0 0' }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', color: '#d1d5db', fontSize: '13px', marginBottom: '6px' }}>
            Grid size <span>{grid.size}px</span>
          </span>
          <input
            type="range"
            aria-label="Grid size"
            min={10}
            max={100}
            step={5}
            value={grid.size}
            onChange={(e) => setGridSettings({ size: Number(e.target.value) })}
            onPointerDown={() => {
              useDocumentStore.temporal.getState().pause();
            }}
            onPointerUp={() => {
              const temporal = useDocumentStore.temporal.getState();
              temporal.resume();
              const state = useDocumentStore.getState();
              useDocumentStore.setState({ doc: { ...state.doc } });
            }}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#6366f1' }}
          />
        </div>
      </div>
    </section>
  );
}
