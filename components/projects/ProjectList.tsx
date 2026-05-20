'use client';
import Link from 'next/link';
import type { ProjectMeta } from '@/lib/storage/types';
import { useObjectUrl } from '@/components/canvas/use-object-url';

type Props = {
  projects: ProjectMeta[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
};

function ProjectCard({
  p,
  onDelete,
  onDuplicate,
}: {
  p: ProjectMeta;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const url = useObjectUrl(p.thumbnailKey);

  return (
    <li
      style={{
        border: '1px solid #2a2d36',
        borderRadius: 12,
        padding: 12,
        background: '#16181d',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Link href={`/editor?id=${p.id}`} aria-label={`Open ${p.name}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div
          style={{
            height: 120,
            background: '#0f1115',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #2a2d36',
          }}
        >
          {url ? (
            <img src={url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '24px', opacity: 0.35 }}>🖼️</span>
          )}
        </div>
        <strong style={{ display: 'block', marginTop: 8, fontSize: '14px' }}>{p.name}</strong>
      </Link>
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => onDuplicate(p.id)}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: '6px',
            background: '#2a2d36',
            border: '1px solid #3a3d46',
            color: '#e5e7eb',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#374151')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#2a2d36')}
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(p.id)}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'transparent',
            border: '1px solid #ef4444',
            color: '#ef4444',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function ProjectList({ projects, onDelete, onDuplicate }: Props) {
  if (projects.length === 0) {
    return <p style={{ opacity: 0.7, padding: '16px' }}>No projects yet. Create one to get started.</p>;
  }
  return (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        listStyle: 'none',
        padding: 0,
      }}
    >
      {projects.map((p) => (
        <ProjectCard key={p.id} p={p} onDelete={onDelete} onDuplicate={onDuplicate} />
      ))}
    </ul>
  );
}
