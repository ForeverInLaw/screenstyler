'use client';
import { Select as BaseSelect } from '@base-ui/react/select';
import { IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

type Props<Value extends string> = {
  label: string;
  hideLabel?: boolean;
  value: Value;
  options: readonly { value: Value; label: string }[];
  onValueChange: (value: Value) => void;
  disabled?: boolean;
  className?: string;
};

/** A single-choice control with a shared studio popup and typed document values. */
export function Select<Value extends string>({
  label, hideLabel = false, value, options, onValueChange, disabled, className = '',
}: Props<Value>) {
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      disabled={disabled}
      onValueChange={(next) => { if (next !== null) onValueChange(next); }}
    >
      <div className={`${hideLabel ? 'min-w-0' : 'control-row'} ${className}`}>
        {!hideLabel && <BaseSelect.Label className="shrink-0">{label}</BaseSelect.Label>}
        <BaseSelect.Trigger
          aria-label={hideLabel ? label : undefined}
          className={`field studio-select ${hideLabel ? '' : 'max-w-[180px]'}`}
        >
          <BaseSelect.Value className="min-w-0 truncate" />
          <BaseSelect.Icon className="shrink-0 text-tertiary">
            <IconChevronDown size={16} stroke={1.8} aria-hidden="true" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
      </div>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={6}
          collisionPadding={8}
          alignItemWithTrigger={false}
          className="z-50 outline-none"
        >
          <BaseSelect.Popup className="studio-popup min-w-[var(--anchor-width)]">
            <BaseSelect.ScrollUpArrow className="studio-select-scroll">
              <IconChevronUp size={14} aria-hidden="true" />
            </BaseSelect.ScrollUpArrow>
            <BaseSelect.List className="max-h-[var(--available-height)] overflow-y-auto scroll-py-2 p-1">
              {options.map((option) => (
                <BaseSelect.Item key={option.value} value={option.value} className="studio-option">
                  <BaseSelect.ItemText className="min-w-0 flex-1">{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="text-accent">
                    <IconCheck size={17} stroke={2} aria-hidden="true" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
            <BaseSelect.ScrollDownArrow className="studio-select-scroll">
              <IconChevronDown size={14} aria-hidden="true" />
            </BaseSelect.ScrollDownArrow>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
