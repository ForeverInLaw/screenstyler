'use client';
import { Fragment } from 'react';
import Link from 'next/link';
import type { ProjectMeta } from '@/lib/storage/types';
import { useObjectUrl } from '@/components/canvas/use-object-url';
import { useProjectQuery } from '@/lib/projects/use-projects';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { backgroundToStyle } from '@/lib/style/css';
import { arrowStrokeDasharray, getArrowVariant } from '@/lib/annotations/arrows';
import { getTextFontFamily } from '@/lib/annotations/text';

type Props = {
  projects: ProjectMeta[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (project: ProjectMeta) => void;
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

function ProjectDocumentPreview({ doc }: { doc: ScreenstylerDoc }) {
  const imageUrl = useObjectUrl(doc.content.image?.blobKey ?? null);
  const backgroundUrl = useObjectUrl(
    doc.canvas.background.type === 'image' ? doc.canvas.background.ref.blobKey : null,
  );
  const image = doc.content.image;
  const docAspect = doc.canvas.width / doc.canvas.height;
  const previewAspect = 16 / 10;
  const paddingX = Math.min((doc.content.padding / doc.canvas.width) * 100, 36);
  const paddingY = Math.min((doc.content.padding / doc.canvas.height) * 100, 36);
  const fitStyle =
    docAspect >= previewAspect
      ? { height: '100%', aspectRatio: `${doc.canvas.width} / ${doc.canvas.height}` }
      : { width: '100%', aspectRatio: `${doc.canvas.width} / ${doc.canvas.height}` };
  const imageAspect = image ? image.naturalWidth / image.naturalHeight : 1;
  const imageFitStyle =
    imageAspect >= docAspect
      ? { width: '100%', aspectRatio: `${image?.naturalWidth ?? 1} / ${image?.naturalHeight ?? 1}` }
      : { height: '100%', aspectRatio: `${image?.naturalWidth ?? 1} / ${image?.naturalHeight ?? 1}` };
  const frame = doc.content.frame;
  const showChrome = frame.type === 'window' || frame.type === 'browser';
  const chromeDark =
    (frame.type === 'window' && frame.variant === 'macos-dark') ||
    (frame.type === 'browser' && frame.theme === 'dark');

  return (
    <div className="grid h-full w-full place-items-center bg-zinc-100">
      <div
        style={{
          ...fitStyle,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...backgroundToStyle(doc.canvas.background, backgroundUrl ?? undefined),
          }}
        />
        {image && imageUrl && (
          <div
            style={{
              position: 'absolute',
              left: `${paddingX}%`,
              right: `${paddingX}%`,
              top: `${paddingY}%`,
              bottom: `${paddingY}%`,
              display: 'grid',
              placeItems: 'center',
              perspective: `${doc.content.transform3d.perspective}px`,
            }}
          >
            <div
              style={{
                ...imageFitStyle,
                maxWidth: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
                borderRadius: frame.type === 'none' ? 4 : 6,
                background: chromeDark ? '#1f1f22' : '#ffffff',
                boxShadow: '0 8px 22px rgb(0 0 0 / 0.18)',
                transform: `rotateX(${doc.content.transform3d.rotateX}deg) rotateY(${doc.content.transform3d.rotateY}deg) rotateZ(${doc.content.transform3d.rotateZ}deg) scale(${doc.content.transform3d.scale})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {showChrome && (
                <div
                  style={{
                    height: 12,
                    background: chromeDark ? '#2d2e30' : '#eceff1',
                    borderBottom: `1px solid ${chromeDark ? '#1f2022' : '#d7dce0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    paddingInline: 5,
                  }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: 99, background: '#ff5f56' }} />
                  <span style={{ width: 4, height: 4, borderRadius: 99, background: '#ffbd2e' }} />
                  <span style={{ width: 4, height: 4, borderRadius: 99, background: '#27c93f' }} />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                style={{ display: 'block', width: '100%', height: showChrome ? 'calc(100% - 12px)' : '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
        <svg
          viewBox={`0 0 ${doc.canvas.width} ${doc.canvas.height}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <defs>
            {doc.annotations
              .filter((a): a is Extract<ScreenstylerDoc['annotations'][number], { type: 'arrow' }> => a.type === 'arrow')
              .map((arrow) => {
                const variant = getArrowVariant(arrow.variant);
                return (
                  <Fragment key={`preview-marker-${arrow.id}`}>
                    <marker id={`preview-arrow-head-${arrow.id}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                      <polygon points="0 0, 8 3, 0 6" fill={arrow.color} />
                    </marker>
                    {variant === 'double' && (
                      <marker id={`preview-arrow-tail-${arrow.id}`} markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto" markerUnits="strokeWidth">
                        <polygon points="8 0, 0 3, 8 6" fill={arrow.color} />
                      </marker>
                    )}
                    {variant === 'dot' && (
                      <marker id={`preview-arrow-tail-${arrow.id}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
                        <circle cx="3" cy="3" r="2.2" fill={arrow.color} />
                      </marker>
                    )}
                  </Fragment>
                );
              })}
          </defs>
          {doc.annotations.map((annotation) => {
            if (annotation.type === 'highlight') {
              return (
                <rect
                  key={annotation.id}
                  x={annotation.rect.x}
                  y={annotation.rect.y}
                  width={annotation.rect.w}
                  height={annotation.rect.h}
                  fill={annotation.color}
                  rx="8"
                />
              );
            }
            if (annotation.type === 'arrow') {
              const variant = getArrowVariant(annotation.variant);
              return (
                <line
                  key={annotation.id}
                  x1={annotation.from.x}
                  y1={annotation.from.y}
                  x2={annotation.to.x}
                  y2={annotation.to.y}
                  stroke={annotation.color}
                  strokeWidth={Math.max(annotation.thickness, 6)}
                  strokeDasharray={arrowStrokeDasharray(variant)}
                  strokeLinecap="round"
                  markerStart={variant === 'double' || variant === 'dot' ? `url(#preview-arrow-tail-${annotation.id})` : undefined}
                  markerEnd={`url(#preview-arrow-head-${annotation.id})`}
                />
              );
            }
            if (annotation.type === 'text') {
              return (
                <text
                  key={annotation.id}
                  x={annotation.pos.x}
                  y={annotation.pos.y}
                  fill={annotation.color}
                  fontSize={Math.max(annotation.fontSize, 24)}
                  fontWeight="700"
                  fontFamily={getTextFontFamily(annotation.fontFamily)}
                >
                  {annotation.text}
                </text>
              );
            }
            return (
              <rect
                key={annotation.id}
                x={annotation.rect.x}
                y={annotation.rect.y}
                width={annotation.rect.w}
                height={annotation.rect.h}
                fill="rgba(255,255,255,0.26)"
                rx="8"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function PlaceholderPreview() {
  return (
    <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#f7f3e8,#dbe7df_55%,#cad8f0)] p-6">
      <div className="h-24 w-36 rounded-md bg-white/90 shadow-lg ring-1 ring-black/10" />
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
  onDuplicate,
  onRename,
}: {
  project: ProjectMeta;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (project: ProjectMeta) => void;
}) {
  const url = useObjectUrl(project.thumbnailKey);
  const docPreview = useProjectQuery(project.id, !project.thumbnailKey);

  return (
    <li className="group flex min-h-72 flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/editor?id=${project.id}`}
        aria-label={`Open ${project.name}`}
        className="block p-3 text-inherit"
      >
        <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={project.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : docPreview.data ? (
            <ProjectDocumentPreview doc={docPreview.data} />
          ) : (
            <PlaceholderPreview />
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
          onClick={() => onRename(project)}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          Rename
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

export function ProjectList({ projects, onDelete, onDuplicate, onRename }: Props) {
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
          onRename={onRename}
        />
      ))}
    </ul>
  );
}
