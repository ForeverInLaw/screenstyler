'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectList } from '@/components/projects/ProjectList';
import { MigrationRunner } from '@/components/migration/MigrationRunner';
import { AppHeader } from '@/components/common/AppHeader';
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useDuplicateProjectMutation,
  useProjectsQuery,
  useRenameProjectMutation,
} from '@/lib/projects/use-projects';
import type { ProjectMeta } from '@/lib/storage/types';

export default function ProjectsPage() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [renameTarget, setRenameTarget] = useState<ProjectMeta | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProjectMeta | null>(null);
  const projects = useProjectsQuery();
  const createProject = useCreateProjectMutation(projects.userId, (id) => router.push(`/editor?id=${id}`));
  const deleteProject = useDeleteProjectMutation(projects.userId);
  const duplicateProject = useDuplicateProjectMutation(projects.userId, projects.data);
  const renameProject = useRenameProjectMutation(projects.userId);
  const isProjectsPending = projects.isAuthPending || projects.isLoading;

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createProject.mutate(projectName, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setProjectName('');
      },
    });
  }

  function openRenameProject(project: ProjectMeta) {
    setRenameTarget(project);
    setRenameName(project.name);
  }

  function handleRenameProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renameTarget) return;
    renameProject.mutate({ id: renameTarget.id, name: renameName }, {
      onSuccess: () => {
        setRenameTarget(null);
        setRenameName('');
      },
    });
  }

  function closeAllModals() {
    setIsCreateOpen(false);
    setProjectName('');
    setRenameTarget(null);
    setRenameName('');
    setDeleteTarget(null);
  }

  function handleDeleteProject() {
    if (!deleteTarget) return;
    deleteProject.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeAllModals();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main className="min-h-dvh bg-stone-50 text-zinc-950">
      <AppHeader active="projects" />
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <MigrationRunner />
        <header className="mb-8 flex flex-col gap-5 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Keep local drafts moving, duplicate good layouts, and open the editor only when you are ready to work.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            disabled={projects.isAuthPending || createProject.isPending}
            className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
          >
            New project
          </button>
        </header>

        {isCreateOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4 backdrop-blur-sm"
            onClick={() => {
              setIsCreateOpen(false);
              setProjectName('');
            }}
          >
            <form
              onSubmit={handleCreateProject}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/20"
            >
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">New project</h2>
              <label className="mt-4 grid gap-1.5 text-sm font-medium text-zinc-700">
                Project name
                <input
                  autoFocus
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Untitled"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setProjectName('');
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="rounded-md bg-zinc-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createProject.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {renameTarget && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4 backdrop-blur-sm"
            onClick={() => {
              setRenameTarget(null);
              setRenameName('');
            }}
          >
            <form
              onSubmit={handleRenameProject}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/20"
            >
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Rename project</h2>
              <label className="mt-4 grid gap-1.5 text-sm font-medium text-zinc-700">
                Project name
                <input
                  autoFocus
                  value={renameName}
                  onChange={(event) => setRenameName(event.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRenameTarget(null);
                    setRenameName('');
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameProject.isPending}
                  className="rounded-md bg-zinc-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renameProject.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/20"
            >
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Delete project</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Delete <strong className="text-zinc-950">{deleteTarget.name}</strong>? This permanently
                removes the project and its images. This can&apos;t be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={deleteProject.isPending}
                  className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteProject.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isProjectsPending && (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
                <div className="m-4 h-36 rounded-md bg-zinc-100" />
                <div className="mx-4 mt-5 h-3 w-32 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        )}

        {projects.isError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
            Could not load projects. Refresh the page and try again.
          </p>
        )}

        {!isProjectsPending && projects.data && (
          <ProjectList
            projects={projects.data}
            onDelete={(id) => setDeleteTarget(projects.data?.find((p) => p.id === id) ?? null)}
            onDuplicate={(id) => duplicateProject.mutate(id)}
            onRename={openRenameProject}
          />
        )}
      </div>
    </main>
  );
}
