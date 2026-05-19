'use client';
import { useDocumentStore } from '@/lib/document/store';

function Slider(props: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block', margin: '12px 0' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        {props.label}<span>{props.value}</span>
      </span>
      <input
        type="range"
        aria-label={props.label}
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  );
}

export function StylePanel() {
  const padding = useDocumentStore((s) => s.doc.content.padding);
  const cornerRadius = useDocumentStore((s) => s.doc.content.cornerRadius);
  const shadow = useDocumentStore((s) => s.doc.content.shadow);
  const setPadding = useDocumentStore((s) => s.setPadding);
  const setCornerRadius = useDocumentStore((s) => s.setCornerRadius);
  const setShadow = useDocumentStore((s) => s.setShadow);

  return (
    <section style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Style</h3>
      <Slider label="Padding" value={padding} min={0} max={400} onChange={setPadding} />
      <Slider label="Corner radius" value={cornerRadius} min={0} max={80}
        onChange={setCornerRadius} />
      <Slider label="Shadow blur" value={shadow.blur} min={0} max={200}
        onChange={(v) => setShadow({ ...shadow, blur: v })} />
      <Slider label="Shadow opacity" value={Math.round(shadow.opacity * 100)} min={0} max={100}
        onChange={(v) => setShadow({ ...shadow, opacity: v / 100 })} />
    </section>
  );
}
