'use client';
import { useDocumentStore } from '@/lib/document/store';
import { stylePresets } from '@/lib/presets/styles';

export function PresetsPanel() {
  const applyStylePreset = useDocumentStore((s) => s.applyStylePreset);

  return (
    <section style={{ padding: 16, borderBottom: '1px solid #2a2d36', color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 'bold' }}>Style Presets</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stylePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() =>
              applyStylePreset({
                padding: preset.padding,
                cornerRadius: preset.cornerRadius,
                shadow: preset.shadow,
                frame: preset.frame,
                transform3d: preset.transform3d,
              })
            }
            style={{
              padding: '10px 14px',
              background: '#2a2d36',
              border: '1px solid #3a3d46',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#374151';
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#2a2d36';
              e.currentTarget.style.borderColor = '#3a3d46';
            }}
          >
            <strong style={{ fontSize: '13px' }}>{preset.label}</strong>
            <span style={{ fontSize: '11px', opacity: 0.65 }}>
              {preset.frame.type === 'none'
                ? 'No frame'
                : `${preset.frame.type} (${preset.frame.variant ?? ''})`}
              {preset.transform3d.rotateX !== 0 || preset.transform3d.rotateY !== 0
                ? ' • 3D Tilt'
                : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
