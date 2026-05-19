import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutosave } from './use-autosave';
import { useDocumentStore } from '@/lib/document/store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('useAutosave', () => {
  it('calls the save function (debounced) after a document change', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    renderHook(() => useAutosave('p1', save));

    useDocumentStore.getState().setPadding(123);
    expect(save).not.toHaveBeenCalled(); // debounced

    await vi.advanceTimersByTimeAsync(900);
    expect(save).toHaveBeenCalledWith('p1', expect.objectContaining({ version: 1 }));
    vi.useRealTimers();
  });

  it('does not save when the document equals the baseline doc', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const baseline = createBlankDoc();
    renderHook(() => useAutosave('p1', save, baseline));

    useDocumentStore.getState().loadDoc(baseline); // state.doc === baseline
    await vi.advanceTimersByTimeAsync(900);
    expect(save).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
