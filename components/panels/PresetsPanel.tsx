'use client';
import { IconLayoutCollage } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { stylePresets } from '@/lib/presets/styles';
import { PanelSection } from '@/components/ui/PanelSection';

export function PresetsPanel() {
  const applyStylePreset = useDocumentStore((s) => s.applyStylePreset);
  return (
    <PanelSection icon={IconLayoutCollage} title="Style Presets" detail="START HERE">
      <div className="grid grid-cols-2 gap-2">
        {stylePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            onClick={() =>
              applyStylePreset({
                padding: preset.padding,
                cornerRadius: preset.cornerRadius,
                shadow: preset.shadow,
                frame: preset.frame,
                transform3d: preset.transform3d,
              })
            }
            className="group overflow-hidden rounded-lg border border-border text-left hover:border-accent"
          >
            <span className="flex h-16 items-center justify-center bg-workbench p-3" aria-hidden="true">
              <span
                className={`flex flex-col overflow-hidden border border-border bg-surface ${preset.frame.type === 'device' ? 'h-12 w-6 rounded-lg' : 'h-10 w-16 rounded'}`}
                style={{
                  transform: `perspective(120px) rotateX(${preset.transform3d.rotateX}deg) rotateY(${preset.transform3d.rotateY}deg) rotateZ(${preset.transform3d.rotateZ}deg)`,
                }}
              >
                {preset.frame.type !== 'none' && (
                  <span className="flex h-2.5 items-center gap-0.5 border-b border-border px-1">
                    <i className="size-0.5 rounded-full bg-muted" />
                    <i className="size-0.5 rounded-full bg-muted" />
                    <i className="size-0.5 rounded-full bg-muted" />
                  </span>
                )}
                <span className="m-1.5 h-1 w-1/2 rounded bg-accent/70" />
                <span className="mx-1.5 h-0.5 rounded bg-secondary/25" />
                <span className="mx-1.5 mt-1 h-0.5 w-1/2 rounded bg-secondary/25" />
              </span>
            </span>
            <span className="block px-2 py-2 text-[10px] font-semibold text-secondary group-hover:text-accent">
              {preset.label}
            </span>
          </button>
        ))}
      </div>
    </PanelSection>
  );
}
