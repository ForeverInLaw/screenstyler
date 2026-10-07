'use client';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { useInteractionStore } from '@/lib/editor/interaction-store';
import { selectionRect, screenshotRectStyle } from '@/lib/editor/screenshot-geometry';
import { startScreenshotDrag } from '@/lib/editor/screenshot-drag';
import { moveScreenshotLayers } from '@/lib/document/screenshot-layers';
import { ScreenshotActionsToolbar } from './ScreenshotActionsToolbar';
import { ScreenshotSelectionOverlay } from './ScreenshotSelectionOverlay';

type Props = { content: ScreenstylerDoc['content']; canvasWidth: number; canvasHeight: number };

export function ScreenshotGroupSelection({ content, canvasWidth, canvasHeight }: Props) {
  const ids = useEditorUiStore((state) => state.selectedScreenshotIds);
  const preview = useInteractionStore((state) => state.previewItems);
  const removeScreenshots = useDocumentStore((state) => state.removeScreenshots);
  const reorderScreenshots = useDocumentStore((state) => state.reorderScreenshots);
  const clearSelection = useEditorUiStore((state) => state.setSelectedScreenshotId);
  const screenshots = content.screenshots || [];
  const items = screenshots.filter((item) => ids.includes(item.id)).map((item) => preview[item.id] ?? item);
  const box = selectionRect(items, content.frame);
  if (items.length < 2 || !box) return null;

  return (
    <div data-testid="screenshot-group-selection" style={screenshotRectStyle(box, canvasWidth, canvasHeight)}>
      <ScreenshotSelectionOverlay content={content} onDragStart={startScreenshotDrag} />
      <ScreenshotActionsToolbar
        selectionCount={items.length}
        onMoveForward={moveScreenshotLayers(screenshots, ids, 'forward') !== screenshots
          ? () => reorderScreenshots(ids, 'forward') : undefined}
        onMoveBackward={moveScreenshotLayers(screenshots, ids, 'backward') !== screenshots
          ? () => reorderScreenshots(ids, 'backward') : undefined}
        onDelete={() => {
          removeScreenshots(items.map((item) => item.id));
          clearSelection(null);
        }}
      />
    </div>
  );
}
