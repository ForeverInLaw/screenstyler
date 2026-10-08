import type { ScreenstylerDoc } from './schema';
import { useDocumentStore } from './store';

/** Live edits share one history entry, retaining the document from before the gesture. */
export class DocumentEditSession {
  static #batch: { before: ScreenstylerDoc; owners: Set<DocumentEditSession> } | null = null;

  begin = () => {
    if (!DocumentEditSession.#batch) {
      if (!useDocumentStore.temporal.getState().isTracking) return;
      DocumentEditSession.#batch = { before: useDocumentStore.getState().doc, owners: new Set() };
      useDocumentStore.temporal.getState().pause();
    }
    DocumentEditSession.#batch.owners.add(this);
  };

  commit = () => {
    const batch = DocumentEditSession.#batch;
    if (!batch?.owners.delete(this) || batch.owners.size > 0) return;
    DocumentEditSession.#batch = null;
    const { before } = batch;
    const after = useDocumentStore.getState().doc;
    // Restore while paused so zundo records the original when the final edit is applied.
    useDocumentStore.setState({ doc: before });
    useDocumentStore.temporal.getState().resume();
    if (JSON.stringify(before) !== JSON.stringify(after)) useDocumentStore.setState({ doc: after });
  };
}
