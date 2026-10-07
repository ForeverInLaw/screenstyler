'use client';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { useInteractionStore } from '@/lib/editor/interaction-store';
import { selectionRect, screenshotRectStyle } from '@/lib/editor/screenshot-geometry';
import { ScreenshotActionsToolbar } from './ScreenshotActionsToolbar';
import { ScreenshotSelectionOverlay } from './ScreenshotSelectionOverlay';

type Props = { content: ScreenstylerDoc['content']; canvasWidth: number; canvasHeight: number };

export function ScreenshotGroupSelection({ content, canvasWidth, canvasHeight }: Props) {
  const ids = useEditorUiStore((state) => state.selectedScreenshotIds);
  const preview = useInteractionStore((state) => state.previewItems);
  const removeScreenshots = useDocumentStore((state) => state.removeScreenshots);
  const clearSelection = useEditorUiStore((state) => state.setSelectedScreenshotId);
  const items = (content.screenshots || []).filter((item) => ids.includes(item.id)).map((item) => preview[item.id] ?? item);
  const box = selectionRect(items, content.frame);
  if (items.length < 2 || !box) return null;

  return (
    <div data-testid="screenshot-group-selection" style={screenshotRectStyle(box, canvasWidth, canvasHeight)}>
      <ScreenshotSelectionOverlay content={content} />
      <ScreenshotActionsToolbar
        selectionCount={items.length}
        onDelete={() => {
          removeScreenshots(items.map((item) => item.id));
          clearSelection(null);
        }}
      />
    </div>
  );
}
