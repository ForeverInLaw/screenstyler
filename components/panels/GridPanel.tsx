'use client';
import { IconGridDots } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { DocumentSlider } from '@/components/ui/DocumentSlider';
import { PanelSection } from '@/components/ui/PanelSection';
import { Checkbox } from '@/components/ui/Checkbox';

export function GridPanel() {
  const grid = useDocumentStore((s) => s.doc.canvas.grid);
  const setGridSettings = useDocumentStore((s) => s.setGridSettings);
  return (
    <PanelSection icon={IconGridDots} title="Grid & Alignment">
      <div className="grid gap-2">
        <Checkbox
          label="Show Grid lines"
          checked={grid?.visible ?? false}
          onCheckedChange={(visible) => setGridSettings({ visible })}
        />
        <Checkbox
          label="Snap elements to Grid"
          checked={grid?.snap ?? false}
          onCheckedChange={(snap) => setGridSettings({ snap })}
        />
        <DocumentSlider
          label="Grid size"
          value={grid?.size ?? 20}
          min={10}
          max={100}
          step={5}
          suffix=" px"
          onChange={(size) => setGridSettings({ size })}
        />
      </div>
    </PanelSection>
  );
}
