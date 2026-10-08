'use client';
import { CanvasSizePanel } from './CanvasSizePanel';
import { BackgroundPanel } from './BackgroundPanel';
import { StylePanel } from './StylePanel';
import { FramePanel } from './FramePanel';
import { Transform3DPanel } from './Transform3DPanel';
import { PresetsPanel } from './PresetsPanel';
import { GridPanel } from './GridPanel';

export function PropertiesPanel() {
  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
        <h2 className="text-sm font-semibold">Inspector</h2>
        <span className="eyebrow">COMPOSITION</span>
      </header>
      <PresetsPanel />
      <CanvasSizePanel />
      <BackgroundPanel />
      <FramePanel />
      <StylePanel />
      <Transform3DPanel />
      <GridPanel />
      <p className="px-5 py-4 text-[11px] leading-5 text-tertiary">
        Use Undo to revisit a change. Your original screenshots stay intact.
      </p>
    </div>
  );
}
