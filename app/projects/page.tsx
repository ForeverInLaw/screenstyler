'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconSearch, IconFolder, IconArrowUpRight } from '@tabler/icons-react';
import { ProjectList } from '@/components/projects/ProjectList';
import { MigrationRunner } from '@/components/migration/MigrationRunner';
import { AppHeader } from '@/components/common/AppHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useDuplicateProjectMutation,
  useProjectsQuery,
  useRenameProjectMutation,
} from '@/lib/projects/use-projects';
import type { ProjectMeta } from '@/lib/storage/types';

type ProjectDialog =
  { type: 'create' } | { type: 'rename'; project: ProjectMeta } | { type: 'delete'; project: ProjectMeta };

export default function ProjectsPage() {
  const router = useRouter();
  const [dialog, setDialog] = useState<ProjectDialog | null>(null);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const projects = useProjectsQuery();
  const create = useCreateProjectMutation(projects.userId, (id) => router.push(`/editor?id=${id}`));
  const remove = useDeleteProjectMutation(projects.userId);
  const duplicate = useDuplicateProjectMutation(projects.userId, projects.data);
  const rename = useRenameProjectMutation(projects.userId);
  const loading = projects.isAuthPending || projects.isLoading;
  const mutating = create.isPending || rename.isPending || remove.isPending || duplicate.isPending;
  const filtered = (projects.data ?? [])
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .toSorted((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt - a.updatedAt));
  const count = projects.data?.length ?? 0;

  function openDialog(next: ProjectDialog) {
    create.reset();
    rename.reset();
    remove.reset();
    setName(next.type === 'rename' ? next.project.name : '');
    setDialog(next);
  }
  function closeDialog() {
    if (!mutating) setDialog(null);
  }
  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog?.type === 'create') create.mutate(name, { onSuccess: () => setDialog(null) });
    if (dialog?.type === 'rename')
      rename.mutate({ id: dialog.project.id, name }, { onSuccess: () => setDialog(null) });
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <AppHeader active="projects" />
      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10 sm:py-14">
        <MigrationRunner />
        <header className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-4">YOUR WORKSPACE</p>
            <h1 className="text-4xl font-medium tracking-[-.045em] sm:text-5xl">
              Projects<span className="text-accent">.</span>
            </h1>
            <p className="mt-4 text-sm text-secondary">
              A home for your screenshots and the ideas around them.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => openDialog({ type: 'create' })}
            disabled={projects.isAuthPending || mutating}
            className="min-h-12 self-start px-5"
          >
            <IconPlus size={18} />
            New project
          </Button>
        </header>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
          <div className="flex items-center gap-3">
            <IconFolder size={17} stroke={1.6} className="text-tertiary" />
            <h2 className="text-sm font-semibold">All projects</h2>
            <span className="rounded bg-well px-2 py-1 font-mono text-[10px] tabular-nums text-secondary">
              {loading ? '...' : count}
            </span>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <label className="relative min-w-0 flex-1 sm:w-60">
              <IconSearch
                size={16}
                className="pointer-events-none absolute left-3 top-3 text-tertiary"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search projects"
                placeholder="Find a project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field pl-9"
              />
            </label>
            <Select
              label="Sort projects"
              hideLabel
              value={sort}
              onValueChange={setSort}
              className="w-36 shrink-0"
              options={[
                { value: 'recent', label: 'Last edited' },
                { value: 'name', label: 'Name A–Z' },
              ]}
            />
          </div>
        </div>
        {loading && (
          <div
            role="status"
            aria-label="Loading projects"
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="aspect-[16/10] rounded-lg bg-well" />
                <div className="mt-4 h-4 w-32 rounded bg-well" />
              </div>
            ))}
          </div>
        )}
        {projects.isError && (
          <div role="alert" className="notice notice-error flex flex-wrap items-center justify-between gap-3">
            <span>Could not load projects. Try again.</span>
            <Button onClick={() => projects.refetch()}>Retry</Button>
          </div>
        )}
        {!loading &&
          projects.data &&
          (search && !filtered.length ? (
            <div className="py-20 text-center">
              <h2 className="text-xl font-medium">No matching projects.</h2>
              <p className="mt-3 text-sm text-secondary">
                Try another name, or{' '}
                <button
                  type="button"
                  className="text-accent underline underline-offset-4"
                  onClick={() => setSearch('')}
                >
                  clear your search
                </button>
                .
              </p>
            </div>
          ) : (
            <ProjectList
              projects={filtered}
              onDelete={(id) => {
                const project = projects.data.find((p) => p.id === id);
                if (project) openDialog({ type: 'delete', project });
              }}
              onDuplicate={(id) => duplicate.mutate(id)}
              onRename={(project) => openDialog({ type: 'rename', project })}
              isBusy={mutating}
            />
          ))}
        {duplicate.isError && (
          <p role="alert" className="notice notice-error mt-4">
            Could not duplicate this project. Try again.
          </p>
        )}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-tertiary">
          <span>
            {projects.userId ? 'Your cloud workspace' : 'Stored in this browser'} · {count}{' '}
            {count === 1 ? 'project' : 'projects'}
          </span>
          <span className="flex items-center gap-2">
            Made for the details
            <IconArrowUpRight size={13} />
          </span>
        </footer>
      </div>
      {dialog && (
        <Dialog
          title={
            dialog.type === 'create'
              ? 'New project'
              : dialog.type === 'rename'
                ? 'Rename project'
                : 'Delete project'
          }
          description={
            dialog.type === 'create' ? 'Start a fresh canvas for your next screenshot.' : undefined
          }
          onDismiss={closeDialog}
        >
          {dialog.type === 'delete' ? (
            <>
              <p className="text-sm leading-6 text-secondary">
                Delete <strong className="text-foreground">{dialog.project.name}</strong>? This permanently
                removes the project and its images. This can&apos;t be undone.
              </p>
              {remove.isError && (
                <p role="alert" className="notice notice-error mt-4">
                  Could not delete the project. Try again.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <Button onClick={closeDialog} disabled={mutating}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => remove.mutate(dialog.project.id, { onSuccess: () => setDialog(null) })}
                  disabled={mutating}
                >
                  {remove.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={saveName}>
              <label className="grid gap-2 text-sm text-secondary">
                Project name
                <input
                  autoFocus
                  data-autofocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Untitled"
                  className="field"
                />
              </label>
              {(create.isError || rename.isError) && (
                <p role="alert" className="notice notice-error mt-4">
                  Could not save the project. Try again.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <Button onClick={closeDialog} disabled={mutating}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={mutating}>
                  {dialog.type === 'create'
                    ? create.isPending
                      ? 'Creating...'
                      : 'Create'
                    : rename.isPending
                      ? 'Saving...'
                      : 'Save'}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </main>
  );
}
