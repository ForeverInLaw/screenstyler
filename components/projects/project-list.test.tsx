import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectList } from './ProjectList';
import type { ProjectMeta } from '@/lib/storage/types';

const metas: ProjectMeta[] = [
  { id: 'a', name: 'First', thumbnailKey: null, createdAt: 1, updatedAt: 2 },
  { id: 'b', name: 'Second', thumbnailKey: null, createdAt: 3, updatedAt: 4 },
];

describe('ProjectList', () => {
  it('renders one card per project with an open link', () => {
    render(<ProjectList projects={metas} onDelete={() => {}} onDuplicate={() => {}} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first/i })).toHaveAttribute(
      'href', '/editor?id=a',
    );
  });

  it('shows an empty state when there are no projects', () => {
    render(<ProjectList projects={[]} onDelete={() => {}} onDuplicate={() => {}} />);
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
  });

  it('calls onDuplicate with the project id', async () => {
    let dup: string | null = null;
    render(<ProjectList projects={metas} onDelete={() => {}} onDuplicate={(id) => { dup = id; }} />);
    const firstCard = screen.getByText('First').closest('li')!;
    await userEvent.click(within(firstCard).getByRole('button', { name: /duplicate/i }));
    expect(dup).toBe('a');
  });
});
