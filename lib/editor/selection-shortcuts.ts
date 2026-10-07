import { useDocumentStore } from '@/lib/document/store';
import { isEditablePasteTarget } from '@/lib/upload/clipboard';
import { useEditorUiStore } from './ui-store';

/** Handle screenshot selection commands without capturing keys in form fields. */
export function handleScreenshotShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || isEditablePasteTarget(event.target)) return false;
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
