'use client';
import Link from 'next/link';
import type { ProjectMeta } from '@/lib/storage/types';
import { useObjectUrl } from '@/components/canvas/use-object-url';

type Props = {
  projects: ProjectMeta[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
};

function formatUpdatedAt(value: number) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function ProjectCard({
  project,
  onDelete,
  onDuplicate,
}: {
  project: ProjectMeta;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const url = useObjectUrl(project.thumbnailKey);

  return (
    <li className="group flex min-h-72 flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/editor?id=${project.id}`}
        aria-label={`Open ${project.name}`}
        className="block p-3 text-inherit"
      >
        <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-md bg-zinc-950 ring-1 ring-zinc-900">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={project.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#f7f3e8,#dbe7df_55%,#cad8f0)] p-6">
              <div className="h-24 w-36 rounded-md bg-white/90 shadow-lg ring-1 ring-black/10" />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <strong className="block truncate text-base font-semibold tracking-tight text-zinc-950">
              {project.name}
            </strong>
            <span className="mt-1 block text-sm text-zinc-500">
              Updated {formatUpdatedAt(project.updatedAt)}
            </span>
          </div>
          <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
            Edit
          </span>
        </div>
      </Link>

      <div className="mt-auto flex gap-2 border-t border-zinc-200 p-3">
        <button
          type="button"
          onClick={() => onDuplicate(project.id)}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(project.id)}
          className="flex-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function ProjectList({ projects, onDelete, onDuplicate }: Props) {
  if (projects.length === 0) {
    return (
      <section className="grid min-h-80 place-items-center rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
        <div className="max-w-sm">
          <p className="text-sm font-medium text-zinc-500">No projects yet</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Start with a blank screenshot canvas.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Create a project, upload a screenshot, then add the frame, background, and annotations in the editor.
          </p>
        </div>
      </section>
    );
  }

  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </ul>
  );
}
