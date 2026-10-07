'use client';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { NumberField } from '@base-ui/react/number-field';

export type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  compact?: boolean;
  onChange: (value: number) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

export function Slider({
  label, value, min, max, step = 1, suffix = '', compact = false,
  onChange, onInteractionStart, onInteractionEnd,
}: SliderProps) {
  const number = (
    <NumberField.Root
      value={value}
      min={min}
      max={max}
      step={step}
      largeStep={step * 10}
      locale="en-US"
      onValueChange={(next) => {
        if (next === null || next === value) return;
        onInteractionStart?.();
        onChange(next);
      }}
      onValueCommitted={onInteractionEnd}
      onBlur={onInteractionEnd}
      className="shrink-0"
    >
      <NumberField.Group className="studio-number">
        <NumberField.Input aria-label={`${label} value`} className="studio-number-input" />
        {suffix && <span aria-hidden="true" className="pr-2 text-tertiary">{suffix.trim()}</span>}
      </NumberField.Group>
    </NumberField.Root>
  );

  return (
    <BaseSlider.Root
      value={value}
      min={min}
      max={max}
      step={step}
      largeStep={step * 10}
      onValueChange={(next) => {
        onInteractionStart?.();
        onChange(next);
      }}
      onValueCommitted={onInteractionEnd}
      onPointerCancel={onInteractionEnd}
      onBlur={onInteractionEnd}
      className={compact ? 'flex items-center gap-3' : 'grid gap-1 py-1'}
    >
      {!compact && (
        <div className="flex items-center justify-between gap-4 text-xs text-secondary">
          <BaseSlider.Label>{label}</BaseSlider.Label>
          {number}
        </div>
      )}
      <BaseSlider.Control className={`studio-slider-control ${compact ? 'w-28' : 'w-full'}`}>
        <BaseSlider.Track className="studio-slider-track">
          <BaseSlider.Indicator className="studio-slider-fill" />
          <BaseSlider.Thumb
            aria-label={label}
            aria-valuetext={`${Number(value.toFixed(2))}${suffix}`}
            className="studio-slider-thumb"
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
      {compact && number}
    </BaseSlider.Root>
  );
}
