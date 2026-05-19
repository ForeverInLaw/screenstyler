'use client';
import { CanvasSizePanel } from './CanvasSizePanel';
import { BackgroundPanel } from './BackgroundPanel';
import { StylePanel } from './StylePanel';

export function PropertiesPanel() {
  return (
    <div>
      <CanvasSizePanel />
      <BackgroundPanel />
      <StylePanel />
    </div>
  );
}
