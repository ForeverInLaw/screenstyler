'use client';
import { useDocumentStore } from '@/lib/document/store';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
};

/** Dragging a document control records one undo step when released. */
export function DocumentSlider({ label, value, min, max, step = 1, suffix = '', onChange }: Props) {
  function finishDrag() {
    const temporal = useDocumentStore.temporal.getState();
    temporal.resume();
    const { doc } = useDocumentStore.getState();
    useDocumentStore.setState({ doc: { ...doc } });
  }
  return (
    <label className="grid gap-1 py-2 text-xs text-secondary">
      <span className="flex items-center justify-between gap-4">
        {label}
        <span className="rounded bg-well px-2 py-1 font-mono text-[11px] tabular-nums text-foreground">
          {Number(value.toFixed(2))}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          useDocumentStore.temporal.getState().pause();
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      />
    </label>
  );
}
