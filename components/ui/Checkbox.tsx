'use client';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { IconCheck } from '@tabler/icons-react';

type Props = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Checkbox({ label, checked, onCheckedChange, disabled }: Props) {
  return (
    <label className="control-row min-h-10 cursor-pointer has-data-disabled:cursor-not-allowed has-data-disabled:opacity-45">
      <span>{label}</span>
      <BaseCheckbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="studio-checkbox"
      >
        <BaseCheckbox.Indicator className="grid place-items-center">
          <IconCheck size={15} stroke={2.5} aria-hidden="true" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    </label>
  );
}
