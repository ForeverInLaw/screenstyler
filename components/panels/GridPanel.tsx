'use client';
import { IconGridDots } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { DocumentSlider } from '@/components/ui/DocumentSlider';
import { PanelSection } from '@/components/ui/PanelSection';

export function GridPanel() {
  const grid = useDocumentStore((s) => s.doc.canvas.grid);
  const setGridSettings = useDocumentStore((s) => s.setGridSettings);
  return (
    <PanelSection icon={IconGridDots} title="Grid & Alignment">
      <div className="grid gap-2">
        <label className="control-row min-h-10 cursor-pointer">
          <span>Show Grid lines</span>
          <input
            type="checkbox"
            className="size-4"
            checked={grid?.visible ?? false}
            onChange={(e) => setGridSettings({ visible: e.target.checked })}
          />
        </label>
        <label className="control-row min-h-10 cursor-pointer">
          <span>Snap elements to Grid</span>
          <input
            type="checkbox"
            className="size-4"
            checked={grid?.snap ?? false}
            onChange={(e) => setGridSettings({ snap: e.target.checked })}
          />
        </label>
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
