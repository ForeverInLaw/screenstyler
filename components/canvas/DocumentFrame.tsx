'use client';
import { forwardRef, type ReactNode, type WheelEventHandler, type MouseEventHandler } from 'react';

type Props = {
  width: number;
  height: number;
  children: ReactNode;
  onWheel?: WheelEventHandler<HTMLDivElement>;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
};

export const DocumentFrame = forwardRef<HTMLDivElement, Props>(
  function DocumentFrame({ width, height, children, onWheel, onMouseDown }, ref) {
    return (
      <div
        ref={ref}
        data-testid="document-frame"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        tabIndex={0}
        aria-label="Screenshot canvas"
        style={{ width, height, position: 'relative', overflow: 'hidden' }}
      >
        {children}
      </div>
    );
  },
);
