'use client';
import { useDocumentStore } from '@/lib/document/store';

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block', margin: '10px 0' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.85 }}>
        {props.label}
        <span>
          {props.value}
          {props.suffix ?? ''}
        </span>
      </span>
      <input
        type="range"
        aria-label={props.label}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }}
      />
    </label>
  );
}

export function Transform3DPanel() {
  const transform3d = useDocumentStore((s) => s.doc.content.transform3d);
  const setTransform3d = useDocumentStore((s) => s.setTransform3d);

  return (
    <section style={{ padding: 16, borderBottom: '1px solid #2a2d36', color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 'bold' }}>3D Tilt</h3>
      <Slider
        label="Rotate X"
        value={transform3d.rotateX}
        min={-45}
        max={45}
        suffix="°"
        onChange={(v) => setTransform3d({ ...transform3d, rotateX: v })}
      />
      <Slider
        label="Rotate Y"
        value={transform3d.rotateY}
        min={-45}
        max={45}
        suffix="°"
        onChange={(v) => setTransform3d({ ...transform3d, rotateY: v })}
      />
      <Slider
        label="Rotate Z"
        value={transform3d.rotateZ}
        min={-45}
        max={45}
        suffix="°"
        onChange={(v) => setTransform3d({ ...transform3d, rotateZ: v })}
      />
      <Slider
        label="Perspective"
        value={transform3d.perspective}
        min={500}
        max={3000}
        step={50}
        suffix="px"
        onChange={(v) => setTransform3d({ ...transform3d, perspective: v })}
      />
      <Slider
        label="Scale"
        value={transform3d.scale}
        min={0.5}
        max={2}
        step={0.05}
        onChange={(v) => setTransform3d({ ...transform3d, scale: v })}
      />
    </section>
  );
}
