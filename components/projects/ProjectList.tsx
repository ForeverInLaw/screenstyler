'use client';
import Link from 'next/link';
import { useState } from 'react';
import { IconArrowUpRight, IconCopy, IconPencil, IconTrash, IconPhoto, IconEye } from '@tabler/icons-react';
import type { ProjectMeta } from '@/lib/storage/types';
import { useObjectUrl } from '@/components/canvas/use-object-url';
import { useProjectQuery } from '@/lib/projects/use-projects';
import { Button } from '@/components/ui/Button';
import { ProjectDocumentPreview } from './ProjectDocumentPreview';

type Props = {
  projects: ProjectMeta[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (project: ProjectMeta) => void;
  isBusy?: boolean;
};
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

function ProjectCard({
  project,
  onDelete,
  onDuplicate,
  onRename,
  isBusy,
}: Omit<Props, 'projects'> & { project: ProjectMeta }) {
  const url = useObjectUrl(project.thumbnailKey);
  const [previewRequested, setPreviewRequested] = useState(false);
  const preview = useProjectQuery(project.id, previewRequested && !project.thumbnailKey);
  return (
    <li className="group min-w-0">
      <Link
        href={`/editor?id=${project.id}`}
        aria-label={`Open ${project.name}`}
        className="block rounded-lg focus-visible:outline-offset-4"
      >
        <div className="relative overflow-hidden rounded-lg border border-border bg-well">
          <div className="aspect-[16/10]">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={project.name} className="size-full object-cover" />
            ) : previewRequested && preview.data ? (
              <ProjectDocumentPreview doc={preview.data} />
            ) : (
              <div className="grid size-full place-items-center bg-well">
                <IconPhoto size={32} stroke={1} className="text-muted" aria-hidden="true" />
              </div>
            )}
          </div>
          <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/90 text-secondary group-hover:text-accent">
            <IconArrowUpRight size={18} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <strong className="truncate text-sm font-semibold">{project.name}</strong>
          <span className="shrink-0 font-mono text-[10px] text-tertiary">
            {dateFormat.format(project.updatedAt)}
          </span>
        </div>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3 border-b border-border pb-4">
        <span className="eyebrow text-[9px]">SCREENSHOT PROJECT</span>
        <div className="flex gap-1">
          {!project.thumbnailKey && (
            <Button
              iconOnly
              variant="ghost"
              aria-label={`Preview ${project.name}`}
              aria-pressed={previewRequested}
              title={preview.isError ? 'Retry preview' : 'Preview'}
              disabled={preview.isFetching}
              onClick={() => {
                if (preview.isError) void preview.refetch();
                else setPreviewRequested((requested) => !requested);
              }}
            >
              <IconEye size={18} />
            </Button>
          )}
          <Button
            iconOnly
            variant="ghost"
            disabled={isBusy}
            aria-label={`Duplicate ${project.name}`}
            title="Duplicate"
            onClick={() => onDuplicate(project.id)}
          >
            <IconCopy size={18} />
          </Button>
          <Button
            iconOnly
            variant="ghost"
            disabled={isBusy}
            aria-label={`Rename ${project.name}`}
            title="Rename"
            onClick={() => onRename(project)}
          >
            <IconPencil size={18} />
          </Button>
          <Button
            iconOnly
            variant="ghost"
            disabled={isBusy}
            aria-label={`Delete ${project.name}`}
            title="Delete"
            onClick={() => onDelete(project.id)}
            className="hover:text-danger"
          >
            <IconTrash size={18} />
          </Button>
        </div>
      </div>
      {previewRequested && preview.isError && <p role="alert" className="mt-2 text-xs text-danger">Preview unavailable. Retry the preview or open the project.</p>}
    </li>
  );
}

export function ProjectList({ projects, ...actions }: Props) {
  if (!projects.length)
    return (
      <section className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
        <div className="crop-corners mb-6 grid size-20 place-items-center text-accent">
          <IconPhoto size={32} stroke={1} aria-hidden="true" />
        </div>
        <p className="eyebrow">No projects yet</p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight">Your next shot starts here.</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-secondary">
          Create a project, bring a screenshot, and make it your own.
        </p>
      </section>
    );
  return (
    <ul className="grid list-none gap-x-6 gap-y-8 p-0 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} {...actions} />
      ))}
    </ul>
  );
}
