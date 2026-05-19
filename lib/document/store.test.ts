import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './store';
import { createBlankDoc } from './factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('useDocumentStore', () => {
  it('updates padding', () => {
    useDocumentStore.getState().setPadding(120);
    expect(useDocumentStore.getState().doc.content.padding).toBe(120);
  });

  it('updates the background', () => {
    useDocumentStore.getState().setBackground({ type: 'solid', color: '#000000' });
    expect(useDocumentStore.getState().doc.canvas.background).toEqual({
      type: 'solid', color: '#000000',
    });
  });

  it('undoes and redoes a mutation', () => {
    useDocumentStore.getState().setPadding(200);
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(64);
    useDocumentStore.temporal.getState().redo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(200);
  });
});
