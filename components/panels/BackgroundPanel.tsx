'use client';
import { useState } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import { gradientPresets } from '@/lib/presets/gradients';
import { backgroundToCss } from '@/lib/style/css';
import { ingestImageFile, validateImageFile } from '@/lib/upload/load-image';

export function BackgroundPanel() {
  const background = useDocumentStore((s) => s.doc.canvas.background);
  const setBackground = useDocumentStore((s) => s.setBackground);
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
      const imageRef = await ingestImageFile(file);
      setBackground({ type: 'image', ref: imageRef, fit: 'cover' });
    } catch {
      setUploadError('Failed to upload background image');
    } finally {
      setIsUploading(false);
    }
  }

  const activeSolidColor = background.type === 'solid' ? background.color : '#6366f1';

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
