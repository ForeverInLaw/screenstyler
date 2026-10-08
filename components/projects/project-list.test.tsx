import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectList } from './ProjectList';
import type { ProjectMeta } from '@/lib/storage/types';
import { createBlankDoc } from '@/lib/document/factory';

const load = vi.hoisted(() => vi.fn());
vi.mock('@/lib/storage/active-stores', () => ({ getProjectStoreForUser: () => ({ load }) }));
vi.mock('@/components/canvas/use-object-url', () => ({ useObjectUrl: () => null }));
beforeEach(() => { load.mockReset(); load.mockResolvedValue(createBlankDoc()); });

vi.mock('@/lib/auth/client', () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

const metas: ProjectMeta[] = [
  { id: 'a', name: 'First', thumbnailKey: null, createdAt: 1, updatedAt: 2 },
  { id: 'b', name: 'Second', thumbnailKey: null, createdAt: 3, updatedAt: 4 },
];

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ProjectList', () => {
  it('loads only a requested preview, even when other documents are cached', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['project', 'local', 'anonymous', 'b'], createBlankDoc());
    render(<QueryClientProvider client={client}><ProjectList projects={metas}
      onDelete={() => {}} onDuplicate={() => {}} onRename={() => {}} /></QueryClientProvider>);
    expect(load).not.toHaveBeenCalled();
    expect(screen.queryByTestId('document-frame')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Preview First' }));
    await waitFor(() => expect(screen.getByTestId('document-frame')).toBeInTheDocument());
    expect(load).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('renders one card per project with an open link', () => {
    renderWithClient(<ProjectList projects={metas} onDelete={() => {}} onDuplicate={() => {}} onRename={() => {}} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first/i })).toHaveAttribute(
      'href', '/editor?id=a',
    );
  });

  it('shows an empty state when there are no projects', () => {
    renderWithClient(<ProjectList projects={[]} onDelete={() => {}} onDuplicate={() => {}} onRename={() => {}} />);
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
  });

  it('calls onDuplicate with the project id', async () => {
    let dup: string | null = null;
    renderWithClient(<ProjectList projects={metas} onDelete={() => {}} onDuplicate={(id) => { dup = id; }} onRename={() => {}} />);
    const firstCard = screen.getByText('First').closest('li')!;
    await userEvent.click(within(firstCard).getByRole('button', { name: /duplicate/i }));
    expect(dup).toBe('a');
  });

  it('calls onRename with the selected project', async () => {
    let renamed: ProjectMeta | null = null;
    renderWithClient(<ProjectList projects={metas} onDelete={() => {}} onDuplicate={() => {}} onRename={(project) => { renamed = project; }} />);
    const firstCard = screen.getByText('First').closest('li')!;
    await userEvent.click(within(firstCard).getByRole('button', { name: /rename/i }));
    expect((renamed as ProjectMeta | null)?.id).toBe('a');
  });
});
