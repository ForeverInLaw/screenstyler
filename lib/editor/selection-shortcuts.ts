import { useDocumentStore } from '@/lib/document/store';
import { isEditablePasteTarget } from '@/lib/upload/clipboard';
import { useEditorUiStore } from './ui-store';
import { useInteractionStore } from './interaction-store';

/** Handle screenshot selection commands without capturing keys in form fields. */
export function handleScreenshotShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || isEditablePasteTarget(event.target)) return false;
  if (Object.keys(useInteractionStore.getState().previewItems).length || !useDocumentStore.temporal.getState().isTracking) {
    const command = (event.ctrlKey || event.metaKey) && ['a', 'z', 'y'].includes(event.key.toLowerCase());
    if (command || ['Escape', 'Delete', 'Backspace'].includes(event.key)) {
      event.preventDefault();
      return true;
    }
    return false;
  }
  const ui = useEditorUiStore.getState();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
    event.preventDefault();
    ui.setSelectedScreenshotIds((useDocumentStore.getState().doc.content.screenshots || []).map((item) => item.id));
    return true;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    ui.setSelectedScreenshotId(null);
    return true;
  }
  if ((event.key === 'Delete' || event.key === 'Backspace') && ui.selectedScreenshotIds.length) {
    event.preventDefault();
    useDocumentStore.getState().removeScreenshots(ui.selectedScreenshotIds);
    ui.setSelectedScreenshotId(null);
    return true;
  }
  return false;
}
