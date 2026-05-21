'use client';
import { forwardRef, type ReactNode, type WheelEventHandler } from 'react';

type Props = {
  width: number;
  height: number;
  children: ReactNode;
  onWheel?: WheelEventHandler<HTMLDivElement>;
};

export const DocumentFrame = forwardRef<HTMLDivElement, Props>(
  function DocumentFrame({ width, height, children, onWheel }, ref) {
    return (
      <div
        ref={ref}
        data-testid="document-frame"
        onWheel={onWheel}
        style={{ width, height, position: 'relative', overflow: 'hidden' }}
      >
        {children}
      </div>
    );
  },
);
