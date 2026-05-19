import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectList } from './ProjectList';
import type { ProjectMeta } from '@/lib/storage/types';

const metas: ProjectMeta[] = [
  { id: 'a', name: 'First', thumbnailKey: null, createdAt: 1, updatedAt: 2 },
  { id: 'b', name: 'Second', thumbnailKey: null, createdAt: 3, updatedAt: 4 },
];

describe('ProjectList', () => {
  it('renders one card per project with an open link', () => {
    render(<ProjectList projects={metas} onDelete={() => {}} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first/i })).toHaveAttribute(
      'href', '/editor?id=a',
    );
  });

  it('shows an empty state when there are no projects', () => {
    render(<ProjectList projects={[]} onDelete={() => {}} />);
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
  });
});
