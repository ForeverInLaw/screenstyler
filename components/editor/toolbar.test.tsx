import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('@/lib/auth/client', () => ({
  useSession: () => ({ data: null, isPending: false }),
  signIn: { email: vi.fn(), social: vi.fn() },
  signOut: vi.fn(),
  signUp: { email: vi.fn() },
}));
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';
import { useDocumentStore } from '@/lib/document/store';
import { createBlankDoc } from '@/lib/document/factory';
import { useAnnotationStyleStore } from '@/lib/editor/annotation-style-store';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
  useAnnotationStyleStore.getState().reset();
});

describe('Toolbar', () => {
  it('shows the project name', () => {
    render(<Toolbar projectName="Hello Shot" onExport={() => {}} />);
    expect(screen.getByText('Hello Shot')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/projects');
  });

  it('undo reverts the last document change', async () => {
    render(<Toolbar projectName="P" onExport={() => {}} />);
    useDocumentStore.getState().setPadding(300);
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(useDocumentStore.getState().doc.content.padding).toBe(64);
  });

  it('calls onExport when Export is clicked', async () => {
    let called = false;
    render(<Toolbar projectName="P" onExport={() => { called = true; }} />);
    await userEvent.click(screen.getByRole('button', { name: /export/i }));
    expect(called).toBe(true);
  });

  it('updates arrow drawing defaults', async () => {
    render(<Toolbar projectName="P" onExport={() => {}} activeTool="arrow" />);

    await userEvent.click(screen.getByRole('button', { name: /dashed arrow/i }));
    await userEvent.click(screen.getByRole('button', { name: /arrow color #22c55e/i }));

    expect(useAnnotationStyleStore.getState()).toMatchObject({
      arrowVariant: 'dashed',
      arrowColor: '#22c55e',
    });
  });

  it('updates text drawing defaults', async () => {
    render(<Toolbar projectName="P" onExport={() => {}} activeTool="text" />);

    await userEvent.selectOptions(screen.getByLabelText('Text font'), 'mono');
    fireEvent.change(screen.getByLabelText('Text size'), { target: { value: '40' } });

    expect(useAnnotationStyleStore.getState()).toMatchObject({
      textFontFamily: 'mono',
      textSize: 40,
    });
  });

  it('updates highlight drawing defaults', async () => {
    render(<Toolbar projectName="P" onExport={() => {}} activeTool="highlight" />);

    await userEvent.click(screen.getByRole('button', { name: /highlight color #38bdf8/i }));
    fireEvent.change(screen.getByLabelText('Highlight opacity'), { target: { value: '65' } });

    expect(useAnnotationStyleStore.getState()).toMatchObject({
      highlightColor: '#38bdf8',
      highlightOpacity: 0.65,
    });
  });
});
