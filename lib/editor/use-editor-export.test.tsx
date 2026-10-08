import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { useEditorExport } from './use-editor-export';

const mocks = vi.hoisted(() => ({ refetch: vi.fn(), exportPng: vi.fn(), download: vi.fn() }));
vi.mock('@/lib/projects/use-projects', () => ({ useProjectsQuery: () => ({ data: undefined, refetch: mocks.refetch }) }));
vi.mock('@/lib/export/export-png', async (original) => ({
  ...await original<typeof import('@/lib/export/export-png')>(),
  exportPng: mocks.exportPng, downloadBlob: mocks.download,
}));
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.exportPng.mockResolvedValue(new Blob());
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

it('fetches missing project metadata before choosing the export filename', async () => {
  mocks.refetch.mockResolvedValue({ data: [{ id: 'project', name: 'Release shot' }], error: null });
  const { result } = renderHook(() => useEditorExport({ current: document.createElement('div') }, 'project'), { wrapper });
  await act(() => result.current.mutateAsync());
  expect(mocks.download).toHaveBeenCalledWith(expect.any(Blob), 'release-shot@2x.png');
});

it('does not download with a guessed name when metadata fails', async () => {
  mocks.refetch.mockResolvedValue({ error: new Error('offline') });
  const { result } = renderHook(() => useEditorExport({ current: document.createElement('div') }, 'project'), { wrapper });
  await act(async () => { await expect(result.current.mutateAsync()).rejects.toThrow('Could not load the project name'); });
  expect(mocks.exportPng).not.toHaveBeenCalled();
  expect(mocks.download).not.toHaveBeenCalled();
});
