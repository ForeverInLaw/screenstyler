import type { ScreenstylerDoc } from './schema';
import { useDocumentStore } from './store';

/** Live edits share one history entry, retaining the document from before the gesture. */
export class DocumentEditSession {
  #before: ScreenstylerDoc | null = null;

  begin = () => {
    if (this.#before || !useDocumentStore.temporal.getState().isTracking) return;
    this.#before = useDocumentStore.getState().doc;
    useDocumentStore.temporal.getState().pause();
  };

  commit = () => {
    const before = this.#before;
    if (!before) return;
    this.#before = null;
    const after = useDocumentStore.getState().doc;
    // Restore while paused so zundo records the original when the final edit is applied.
    useDocumentStore.setState({ doc: before });
    useDocumentStore.temporal.getState().resume();
    if (JSON.stringify(before) !== JSON.stringify(after)) useDocumentStore.setState({ doc: after });
  };
}
