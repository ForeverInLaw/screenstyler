'use client';
import { useState } from 'react';
import { useSession } from '@/lib/auth/client';
import { useDocumentStore } from '@/lib/document/store';
import { gradientPresets } from '@/lib/presets/gradients';
import { backgroundToCss } from '@/lib/style/css';
import { ingestImageFile, validateImageFile } from '@/lib/upload/load-image';

const defaultGradient = {
  type: 'gradient' as const,
  angle: 135,
  stops: [
    { color: '#6366f1', offset: 0 },
    { color: '#ec4899', offset: 1 },
  ],
};

export function BackgroundPanel() {
  const background = useDocumentStore((s) => s.doc.canvas.background);
  const setBackground = useDocumentStore((s) => s.setBackground);
  const { data } = useSession();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(file: File) {
    const val = validateImageFile(file);
    if (!val.ok) {
      setUploadError(val.reason === 'TOO_LARGE' ? 'Image is too large (>25MB)' : 'Unsupported image type');
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const imageRef = await ingestImageFile(file, data?.user?.id ?? null);
      setBackground({ type: 'image', ref: imageRef, fit: 'cover' });
    } catch {
      setUploadError('Failed to upload background image');
    } finally {
      setIsUploading(false);
    }
  }

  const activeSolidColor = background.type === 'solid' ? background.color : '#6366f1';
  const activeGradient = background.type === 'gradient' ? background : defaultGradient;
  const gradientStart = activeGradient.stops[0]?.color ?? defaultGradient.stops[0].color;
  const gradientEnd = activeGradient.stops.at(-1)?.color ?? defaultGradient.stops[1].color;

  function setCustomGradient(next: { angle?: number; start?: string; end?: string }) {
    setBackground({
      type: 'gradient',
      angle: next.angle ?? activeGradient.angle,
      stops: [
        { color: next.start ?? gradientStart, offset: 0 },
        { color: next.end ?? gradientEnd, offset: 1 },
      ],
    });
  }

  return (
    <section style={{ padding: '16px', borderBottom: '1px solid #2a2d36', color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 'bold' }}>Background</h3>

      {/* Preset Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {gradientPresets.map((preset) => {
          const isPresetActive =
            JSON.stringify(preset.background) === JSON.stringify(background);
          return (
            <button
              key={preset.id}
              type="button"
              aria-label={preset.label}
              onClick={() => setBackground(preset.background)}
              style={{
                height: 40,
                borderRadius: 8,
                border: isPresetActive ? '2px solid #6366f1' : '1px solid #2a2d36',
                cursor: 'pointer',
                background: backgroundToCss(preset.background),
                outline: 'none',
              }}
            />
          );
        })}
      </div>

      {/* Custom Solid Color & Image Upload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gap: 10, border: '1px solid #2a2d36', borderRadius: 8, padding: 10 }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Custom Gradient</span>
          <label style={{ display: 'grid', gap: 6, fontSize: '13px' }}>
            Angle: {activeGradient.angle}deg
            <input
              type="range"
              aria-label="Gradient angle"
              min={0}
              max={360}
              value={activeGradient.angle}
              onChange={(event) => setCustomGradient({ angle: Number(event.target.value) })}
              onPointerDown={() => {
                useDocumentStore.temporal.getState().pause();
              }}
              onPointerUp={() => {
                const temporal = useDocumentStore.temporal.getState();
                temporal.resume();
                const state = useDocumentStore.getState();
                useDocumentStore.setState({ doc: { ...state.doc } });
              }}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: '13px' }}>
              Start
              <input
                type="color"
                aria-label="Gradient start color"
                value={gradientStart}
                onChange={(event) => setCustomGradient({ start: event.target.value })}
                style={{ width: '100%', height: 32, border: '1px solid #2a2d36', borderRadius: 6, background: 'none', padding: 0, cursor: 'pointer' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: '13px' }}>
              End
              <input
                type="color"
                aria-label="Gradient end color"
                value={gradientEnd}
                onChange={(event) => setCustomGradient({ end: event.target.value })}
                style={{ width: '100%', height: 32, border: '1px solid #2a2d36', borderRadius: 6, background: 'none', padding: 0, cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {/* Solid Color Picker */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: '13px' }}>
          <span style={{ flex: 1 }}>Custom Solid Color:</span>
          <input
            type="color"
            value={activeSolidColor}
            onChange={(e) => setBackground({ type: 'solid', color: e.target.value })}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #2a2d36',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'none',
              padding: 0,
            }}
          />
        </label>

        {/* Custom Image Upload */}
        <div style={{ fontSize: '13px' }}>
          <span style={{ display: 'block', marginBottom: 6 }}>Custom Background Image:</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 12px',
                background: '#2a2d36',
                border: '1px solid #3a3d46',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#ffffff',
                transition: 'background 0.2s',
              }}
            >
              {isUploading ? 'Uploading...' : 'Choose image'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileChange(file);
                }}
              />
            </label>
            {background.type === 'image' && (
              <span style={{ fontSize: '12px', opacity: 0.7 }}>
                Image loaded
              </span>
            )}
          </div>
          {uploadError && <p style={{ color: '#f87171', fontSize: '11px', marginTop: 4 }}>{uploadError}</p>}
        </div>

        {/* Background Image Fit Control */}
        {background.type === 'image' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px' }}>
            <span>Image Fit:</span>
            <select
              value={background.fit}
              onChange={(e) =>
                setBackground({ ...background, fit: e.target.value as 'cover' | 'contain' })
              }
              style={{
                flex: 1,
                background: '#1f2937',
                border: '1px solid #2a2d36',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              <option value="cover">Cover (Fill)</option>
              <option value="contain">Contain (Fit inside)</option>
            </select>
          </label>
        )}
      </div>
    </section>
  );
}
