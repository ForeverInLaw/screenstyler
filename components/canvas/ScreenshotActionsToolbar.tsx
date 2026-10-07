'use client';
import { IconCrop, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { Button } from '@/components/ui/Button';

type Props = {
  selectionCount?: number;
  onCrop?: () => void;
  onMoveForward?: () => void;
  onMoveBackward?: () => void;
  onDelete: () => void;
};

/** This editor-only toolbar is anchored above the screenshot selection. */
export function ScreenshotActionsToolbar({
  selectionCount = 1,
  onCrop,
  onMoveForward,
  onMoveBackward,
  onDelete,
}: Props) {
  const deleteLabel = selectionCount === 1 ? 'Delete screenshot' : `Delete ${selectionCount} screenshots`;
  return (
    <div
      className="hide-on-export absolute left-1/2 -top-16 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border bg-surface p-1 text-foreground"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{ pointerEvents: 'auto' }}
    >
      {selectionCount > 1 && (
        <span
          role="status"
          aria-label="Screenshot selection"
          className="whitespace-nowrap px-2 text-[11px] text-secondary"
        >
          {selectionCount} selected
        </span>
      )}
      {onCrop && (
        <Button variant="ghost" onClick={onCrop} title="Crop image" className="text-xs">
          <IconCrop size={15} aria-hidden="true" />
          Crop
        </Button>
      )}
      <Button
        variant="ghost"
        iconOnly
        onClick={onMoveForward}
        disabled={!onMoveForward}
        title="Bring forward one layer"
        aria-label="Bring forward one layer"
      >
        <IconChevronUp size={15} />
      </Button>
      <Button
        variant="ghost"
        iconOnly
        onClick={onMoveBackward}
        disabled={!onMoveBackward}
        title="Send backward one layer"
        aria-label="Send backward one layer"
      >
        <IconChevronDown size={15} />
      </Button>
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
      <Button
        variant="ghost"
        iconOnly
        onClick={onDelete}
        title={deleteLabel}
        aria-label={deleteLabel}
        className="text-danger"
      >
        <IconTrash size={15} />
      </Button>
    </div>
  );
}
