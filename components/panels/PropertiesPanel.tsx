'use client';
import { BackgroundPanel } from './BackgroundPanel';
import { StylePanel } from './StylePanel';

export function PropertiesPanel() {
  return (
    <div>
      <BackgroundPanel />
      <StylePanel />
    </div>
  );
}
