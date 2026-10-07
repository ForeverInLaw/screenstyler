'use client';
import { IconRotate3d } from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { DocumentSlider } from '@/components/ui/DocumentSlider';
import { PanelSection } from '@/components/ui/PanelSection';

export function Transform3DPanel() {
  const transform3d = useDocumentStore((s) => s.doc.content.transform3d);
  const setTransform3d = useDocumentStore((s) => s.setTransform3d);

  return (
    <PanelSection icon={IconRotate3d} title="3D Tilt">
      <DocumentSlider
        label="Rotate X"
        value={transform3d.rotateX}
        min={-45}
        max={45}
        suffix="°"
        onChange={(v) => setTransform3d({ ...transform3d, rotateX: v })}
      />
      <DocumentSlider
        label="Rotate Y"
        value={transform3d.rotateY}
        min={-45}
        max={45}
        suffix="°"
        onChange={(v) => setTransform3d({ ...transform3d, rotateY: v })}
      />
      <DocumentSlider
        label="Rotate Z"
        value={transform3d.rotateZ}
        min={-45}
        max={45}
        suffix="°"
        onChange={(v) => setTransform3d({ ...transform3d, rotateZ: v })}
      />
      <DocumentSlider
        label="Perspective"
        value={transform3d.perspective}
        min={500}
        max={3000}
        step={50}
        suffix="px"
        onChange={(v) => setTransform3d({ ...transform3d, perspective: v })}
      />
      <DocumentSlider
        label="Scale"
        value={transform3d.scale}
        min={0.5}
        max={2}
        step={0.05}
        onChange={(v) => setTransform3d({ ...transform3d, scale: v })}
      />
    </PanelSection>
  );
}
