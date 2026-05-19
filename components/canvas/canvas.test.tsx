import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';

describe('DocumentFrame', () => {
  it('renders at the given logical size and exposes its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<DocumentFrame ref={ref} width={1200} height={630}>x</DocumentFrame>);
    const frame = screen.getByTestId('document-frame');
    expect(frame.style.width).toBe('1200px');
    expect(frame.style.height).toBe('630px');
    expect(ref.current).toBe(frame);
  });
});

describe('BackgroundLayer', () => {
  it('applies a gradient background', () => {
    render(<BackgroundLayer background={{ type: 'gradient', angle: 90,
      stops: [{ color: '#000', offset: 0 }, { color: '#fff', offset: 1 }] }} />);
    const layer = screen.getByTestId('background-layer');
    expect(layer.style.background).toContain('linear-gradient');
  });
});
