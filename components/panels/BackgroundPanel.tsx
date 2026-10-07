'use client';
import { IconPalette } from '@tabler/icons-react';
import { PanelSection } from '@/components/ui/PanelSection';
import { DocumentSlider } from '@/components/ui/DocumentSlider';
import { Button } from '@/components/ui/Button';
import { useRef, useState } from 'react';
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
  const fileRef = useRef<HTMLInputElement>(null);
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
    <PanelSection icon={IconPalette} title="Background" detail={background.type.toUpperCase()}>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {gradientPresets.map((preset) => {
          const active = JSON.stringify(preset.background) === JSON.stringify(background);
          return (
            <button
              key={preset.id}
              type="button"
              aria-label={preset.label}
              aria-pressed={active}
              onClick={() => setBackground(preset.background)}
              className={`relative h-12 rounded-lg border ${active ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-background' : 'border-border hover:ring-2 hover:ring-border'}`}
              style={{ background: backgroundToCss(preset.background) }}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-surface text-[10px] text-accent"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="grid gap-3">
        <div className="rounded-lg bg-well p-3">
          <span className="text-xs font-semibold">Custom Gradient</span>
          <DocumentSlider
            label="Gradient angle"
            value={activeGradient.angle}
            min={0}
            max={360}
            suffix="°"
            onChange={(angle) => setCustomGradient({ angle })}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="control-row">
              Start
              <input
                type="color"
                aria-label="Gradient start color"
                value={gradientStart}
                onChange={(event) => setCustomGradient({ start: event.target.value })}
              />
            </label>
            <label className="control-row">
              End
              <input
                type="color"
                aria-label="Gradient end color"
                value={gradientEnd}
                onChange={(event) => setCustomGradient({ end: event.target.value })}
              />
            </label>
          </div>
        </div>
        <label className="control-row">
          <span>Custom Solid Color:</span>
          <input
            type="color"
            value={activeSolidColor}
            onChange={(e) => setBackground({ type: 'solid', color: e.target.value })}
          />
        </label>
        <div className="grid gap-2 text-xs text-secondary">
          <span>Custom Background Image:</span>
          <Button onClick={() => fileRef.current?.click()} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Choose image'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileChange(file);
              e.target.value = '';
            }}
          />
          {background.type === 'image' && <span className="text-success">Image loaded</span>}
          {uploadError && (
            <p role="alert" className="notice notice-error">
              {uploadError}
            </p>
          )}
        </div>
        {background.type === 'image' && (
          <label className="control-row">
            <span>Image Fit:</span>
            <select
              className="field"
              value={background.fit}
              onChange={(e) => setBackground({ ...background, fit: e.target.value as 'cover' | 'contain' })}
            >
              <option value="cover">Cover (Fill)</option>
              <option value="contain">Contain (Fit inside)</option>
            </select>
          </label>
        )}
      </div>
    </PanelSection>
  );
}
