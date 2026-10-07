'use client';
import { IconAspectRatio } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { canvasPresets } from '@/lib/presets/canvas';
import { PanelSection } from '@/components/ui/PanelSection';

export function CanvasSizePanel() {
  const canvas = useDocumentStore((s) => s.doc.canvas);
  const setCanvasSize = useDocumentStore((s) => s.setCanvasSize);
  return (
    <PanelSection icon={IconAspectRatio} title="Canvas size" detail={`${canvas.width} × ${canvas.height}`}>
      <div className="grid grid-cols-2 gap-2">
        {canvasPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            aria-pressed={canvas.preset === preset.id}
            onClick={() => setCanvasSize(preset.id, preset.width, preset.height)}
            className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left ${canvas.preset === preset.id ? 'border-accent bg-accent-soft text-accent' : 'border-border text-secondary hover:bg-well'}`}
          >
            <span
              aria-hidden="true"
              className="w-6 shrink-0 rounded-sm border border-current"
              style={{ aspectRatio: `${preset.width}/${preset.height}` }}
            />
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold">{preset.label}</span>
              <span className="mt-1 block font-mono text-[9px] tabular-nums text-tertiary">
                {preset.width} × {preset.height}
              </span>
            </span>
          </button>
        ))}
      </div>
    </PanelSection>
  );
}
