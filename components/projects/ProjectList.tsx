'use client';
import Link from 'next/link';
import type { ProjectMeta } from '@/lib/storage/types';

type Props = { projects: ProjectMeta[]; onDelete: (id: string) => void };

export function ProjectList({ projects, onDelete }: Props) {
  if (projects.length === 0) {
    return <p style={{ opacity: 0.7 }}>No projects yet. Create one to get started.</p>;
  }
  return (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      listStyle: 'none', padding: 0 }}>
      {projects.map((p) => (
        <li key={p.id} style={{ border: '1px solid #2a2d36', borderRadius: 12, padding: 12 }}>
          <Link href={`/editor?id=${p.id}`} aria-label={`Open ${p.name}`}>
            <div style={{ height: 120, background: '#0f1115', borderRadius: 8 }} />
            <strong style={{ display: 'block', marginTop: 8 }}>{p.name}</strong>
          </Link>
          <button type="button" onClick={() => onDelete(p.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
