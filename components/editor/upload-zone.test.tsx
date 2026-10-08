import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { UploadZone } from './UploadZone';

vi.mock('@/lib/auth/client', () => ({ useSession: () => ({ data: null }) }));
vi.mock('@/lib/upload/load-image', async (original) => ({
  ...await original<typeof import('@/lib/upload/load-image')>(),
  ingestImageFile: vi.fn().mockRejectedValue(new Error('unreadable')),
}));

it('keeps the first upload error when a later image cannot be read', async () => {
  const { container } = render(<UploadZone />);
  fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [
    new File(['x'], 'invalid.txt', { type: 'text/plain' }),
    new File(['x'], 'broken.png', { type: 'image/png' }),
  ] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Use a PNG, JPG, or WebP image.');
});
