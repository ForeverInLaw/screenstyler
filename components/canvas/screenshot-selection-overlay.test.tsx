import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ScreenshotSelectionOverlay } from './ScreenshotSelectionOverlay';
import { createBlankDoc } from '@/lib/document/factory';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from '@/lib/editor/ui-store';

beforeEach(() => {
  useDocumentStore.temporal.getState().resume();
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.getState().addScreenshot({ id: 'image', blobKey: 'image', naturalWidth: 800, naturalHeight: 600 });
  useEditorUiStore.getState().setSelectedScreenshotId(useDocumentStore.getState().doc.content.screenshots![0].id);
  useDocumentStore.temporal.getState().clear();
});

it('provides focusable corner handles and proportional keyboard resize with Undo', () => {
  const original = useDocumentStore.getState().doc.content.screenshots![0];
  render(<ScreenshotSelectionOverlay content={useDocumentStore.getState().doc.content} onDragStart={vi.fn()} />);
  const handle = screen.getByRole('button', { name: 'Resize from bottom-right corner' });
  handle.focus();
  expect(handle).toHaveFocus();
  fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });
  expect(useDocumentStore.getState().doc.content.screenshots![0]).toMatchObject({ width: original.width + 10, x: original.x, y: original.y });
  expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(1);
  useDocumentStore.temporal.getState().undo();
  expect(useDocumentStore.getState().doc.content.screenshots![0]).toEqual(original);
});
