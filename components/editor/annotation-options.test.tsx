import { beforeEach, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnotationOptions } from './AnnotationOptions';
import { createBlankDoc } from '@/lib/document/factory';
import { useDocumentStore } from '@/lib/document/store';
import { useAnnotationStyleStore } from '@/lib/editor/annotation-style-store';
import { useEditorUiStore } from '@/lib/editor/ui-store';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useAnnotationStyleStore.getState().reset();
  useEditorUiStore.getState().setSelectedAnnotationId(null);
});

  it('shows drawing defaults for the active tool instead of a different selected annotation', async () => {
    useDocumentStore.getState().addAnnotation({ id: 'text', type: 'text', text: 'Selected', pos: { x: 0, y: 0 }, fontSize: 40, color: '#fff' });
    useEditorUiStore.getState().setSelectedAnnotationId('text');
    const { rerender } = render(<AnnotationOptions activeTool="text" />);
    expect(screen.getByRole('group', { name: 'Text options' })).toBeInTheDocument();
    rerender(<AnnotationOptions activeTool="arrow" />);
    expect(screen.getByRole('group', { name: 'Arrow options' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Text options' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /arrow color #22c55e/i }));
    expect(useAnnotationStyleStore.getState().arrowColor).toBe('#22c55e');
    expect(useDocumentStore.getState().doc.annotations[0]).toMatchObject({ color: '#fff' });
  });

