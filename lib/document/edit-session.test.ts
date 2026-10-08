import { beforeEach, describe, expect, it } from 'vitest';
import { createBlankDoc } from './factory';
import { useDocumentStore } from './store';
import { DocumentEditSession } from './edit-session';

beforeEach(() => {
  useDocumentStore.temporal.getState().resume();
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('DocumentEditSession', () => {
  it('keeps history paused until all overlapping gestures finish', () => {
    const first = new DocumentEditSession();
    const second = new DocumentEditSession();
    first.begin();
    useDocumentStore.getState().setPadding(100);
    second.begin();
    useDocumentStore.getState().setCornerRadius(30);
    first.commit();
    try {
      expect(useDocumentStore.temporal.getState().isTracking).toBe(false);
      expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(0);
      useDocumentStore.getState().setCornerRadius(40);
    } finally {
      second.commit();
    }
    expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(1);
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().doc.content).toMatchObject({ padding: 64, cornerRadius: 12 });
  });

  it('previews multiple changes and records the original for one Undo/Redo step', () => {
    const edit = new DocumentEditSession();
    edit.begin();
    for (const padding of [100, 150, 200]) useDocumentStore.getState().setPadding(padding);
    expect(useDocumentStore.getState().doc.content.padding).toBe(200);
    expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(0);

    edit.commit();
    expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(1);
    expect(useDocumentStore.temporal.getState().isTracking).toBe(true);
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(64);
    useDocumentStore.temporal.getState().redo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(200);
  });

  it('does not add history when a gesture returns to its initial value', () => {
    const edit = new DocumentEditSession();
    edit.begin();
    useDocumentStore.getState().setPadding(100);
    useDocumentStore.getState().setPadding(64);
    edit.commit();
    expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(0);
    expect(useDocumentStore.temporal.getState().isTracking).toBe(true);
  });

  it('does not resume a pause owned by another interaction', () => {
    useDocumentStore.temporal.getState().pause();
    const edit = new DocumentEditSession();
    edit.begin();
    edit.commit();
    expect(useDocumentStore.temporal.getState().isTracking).toBe(false);
    useDocumentStore.temporal.getState().resume();
  });

  it('does not add a second history entry when a control finishes twice', () => {
    const edit = new DocumentEditSession();
    edit.begin();
    useDocumentStore.getState().setPadding(100);
    edit.commit();
    edit.commit();
    expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(1);
  });
});
