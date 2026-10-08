import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ProjectDocumentPreview } from './ProjectDocumentPreview';
import { createBlankDoc } from '@/lib/document/factory';
import { useDocumentStore } from '@/lib/document/store';
import type { Frame } from '@/lib/document/schema';

vi.mock('@/components/canvas/use-object-url', () => ({ useObjectUrl: () => 'blob:screenshot' }));

const frames: Frame[] = [
  { type: 'window', variant: 'macos-dark' },
  { type: 'device', variant: 'iphone' },
  { type: 'device', variant: 'ipad' },
  { type: 'device', variant: 'macbook' },
];

it.each(frames)('uses the real renderer for $type $variant and its own document', (frame) => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  const doc = createBlankDoc();
  doc.canvas.width = 800;
  doc.canvas.height = 600;
  doc.content.frame = frame;
  doc.content.screenshots = [{ id: 'preview', image: { id: 'image', blobKey: 'image', naturalWidth: 400, naturalHeight: 300 },
    x: 100, y: 100, width: 400, height: 300, scale: 1, crop: null }];
  doc.annotations = [{ id: 'text', type: 'text', text: 'Preview annotation', pos: { x: 50, y: 50 }, fontSize: 20, color: '#fff' }];
  render(<ProjectDocumentPreview doc={doc} />);
  const screenshot = screen.getByTestId('screenshot-item');
  expect(screenshot).toHaveStyle({ width: '50%', top: frame.type === 'window' ? `${68 / 600 * 100}%` : `${100 / 600 * 100}%` });
  expect(screenshot).toHaveStyle({ height: frame.type === 'window' ? `${332 / 600 * 100}%` : '50%' });
  expect(screen.getByTestId(`frame-mockup-${frame.type}`)).toBeInTheDocument();
  expect(screen.getByText('Preview annotation')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
