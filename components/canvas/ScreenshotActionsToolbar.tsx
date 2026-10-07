'use client';
import { IconCrop, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';

type Props = {
  onCrop: () => void;
  onMoveForward?: () => void;
  onMoveBackward?: () => void;
  onDelete: () => void;
};

/** Actions anchored above the selected screenshot in the editor overlay layer. */
export function ScreenshotActionsToolbar({ onCrop, onMoveForward, onMoveBackward, onDelete }: Props) {
  return (
    <div
      className="hide-on-export"
      onMouseDown={(e) => e.stopPropagation()} // Prevent dragging from starting when clicking toolbar buttons
      onClick={(e) => e.stopPropagation()} // Prevent resetting selection and crop mode when clicking buttons
      style={{
        position: 'absolute',
        left: '50%',
        top: -50,
        transform: 'translateX(-50%)',
        background: 'rgba(23, 25, 35, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        onClick={onCrop}
        title="Crop image"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#e5e7eb',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
        }}
      >
        <IconCrop size={15} />
        <span>Crop</span>
      </button>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
      <button
        type="button"
        onClick={onMoveForward}
        disabled={!onMoveForward}
        title="Bring forward one layer"
        aria-label="Bring forward one layer"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#e5e7eb',
          cursor: onMoveForward ? 'pointer' : 'default',
          opacity: onMoveForward ? 1 : 0.35,
          padding: 4,
          borderRadius: 6,
        }}
      >
        <IconChevronUp size={15} />
      </button>
      <button
        type="button"
        onClick={onMoveBackward}
        disabled={!onMoveBackward}
        title="Send backward one layer"
        aria-label="Send backward one layer"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#e5e7eb',
          cursor: onMoveBackward ? 'pointer' : 'default',
          opacity: onMoveBackward ? 1 : 0.35,
          padding: 4,
          borderRadius: 6,
        }}
      >
        <IconChevronDown size={15} />
      </button>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
      <button
        type="button"
        onClick={onDelete}
        title="Delete screenshot"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#f87171',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
        }}
      >
        <IconTrash size={15} />
      </button>
    </div>
  );
}
