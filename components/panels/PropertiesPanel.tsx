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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <PresetsPanel />
      <CanvasSizePanel />
      <GridPanel />
      <BackgroundPanel />
      <FramePanel />
      <StylePanel />
      <Transform3DPanel />
    </div>
  );
}

