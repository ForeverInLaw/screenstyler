'use client';
import { useDocumentStore } from '@/lib/document/store';
import { gradientPresets } from '@/lib/presets/gradients';
import { backgroundToCss } from '@/lib/style/css';

export function BackgroundPanel() {
  const setBackground = useDocumentStore((s) => s.setBackground);
  return (
    <section style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Background</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {gradientPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            onClick={() => setBackground(preset.background)}
            style={{
              height: 48,
              borderRadius: 8,
              border: '1px solid #2a2d36',
              cursor: 'pointer',
              background: backgroundToCss(preset.background),
            }}
          />
        ))}
      </div>
    </section>
  );
}
