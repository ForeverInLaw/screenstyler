'use client';
import { forwardRef, type ReactNode } from 'react';

type Props = { width: number; height: number; children: ReactNode };

export const DocumentFrame = forwardRef<HTMLDivElement, Props>(
  function DocumentFrame({ width, height, children }, ref) {
    return (
      <div
        ref={ref}
        data-testid="document-frame"
        style={{ width, height, position: 'relative', overflow: 'hidden' }}
      >
        {children}
      </div>
    );
  },
);
