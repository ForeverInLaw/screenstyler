import type { ComponentProps } from 'react';

/** Shared editor-only selection styling for SVG annotation controls. */
export function SelectionOutline(props: ComponentProps<'rect'>) {
  return (
    <rect
      fill="none"
      stroke="var(--studio-accent)"
      strokeWidth={1.5}
      strokeDasharray="4 4"
      rx={6}
      {...props}
      style={{ pointerEvents: 'none', ...props.style }}
    />
  );
}

export function SelectionHandle(props: ComponentProps<'circle'>) {
  return <circle r={5} fill="var(--chalk)" stroke="var(--studio-accent)" strokeWidth={1.5} {...props} />;
}
