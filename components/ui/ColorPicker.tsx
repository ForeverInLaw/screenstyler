'use client';
import { useRef, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { IconX } from '@tabler/icons-react';

export type ColorPickerProps = {
  label: string;
  value: string;
  hideValue?: boolean;
  onChange: (color: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

export function ColorPicker({
  label, value, hideValue = false, onChange, onInteractionStart, onInteractionEnd,
}: ColorPickerProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function changeColor(color: string) {
    onInteractionStart?.();
    onChange(color);
  }

  return (
    <Popover.Root open={open} onOpenChange={(next) => {
      if (!next) onInteractionEnd?.();
      setOpen(next);
    }}>
      <Popover.Trigger aria-label={label} className="field studio-color-trigger">
        <span className="studio-color-swatch" style={{ backgroundColor: value }} aria-hidden="true" />
        {!hideValue && <span className="font-mono text-[11px] uppercase">{value}</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} collisionPadding={8} className="z-50">
          <Popover.Popup
            ref={popupRef}
            data-color-picker
            className="studio-popup w-[272px] p-4"
            initialFocus={(interaction) => interaction === 'touch' ? null : popupRef.current?.querySelector('input') ?? null}
            onPointerCancel={onInteractionEnd}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <Popover.Title className="text-[13px] font-semibold">{label}</Popover.Title>
              <Popover.Close className="button button-ghost button-icon -mr-2" aria-label="Close color picker">
                <IconX size={16} aria-hidden="true" />
              </Popover.Close>
            </div>
            <HexColorPicker
              color={value}
              onChange={changeColor}
              onChangeEnd={onInteractionEnd}
              className="studio-color-panel"
            />
            <label className="mt-4 flex items-center gap-3">
              <span className="eyebrow">HEX</span>
              <HexColorInput
                aria-label={`${label} HEX`}
                color={value}
                onChange={changeColor}
                onBlur={onInteractionEnd}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  onInteractionEnd?.();
                  setOpen(false);
                }}
                prefixed
                className="field font-mono uppercase"
              />
            </label>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
