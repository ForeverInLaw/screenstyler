'use client';
import { useRouter } from 'next/navigation';
import { ProjectList } from '@/components/projects/ProjectList';
import { MigrationRunner } from '@/components/migration/MigrationRunner';
import { AppHeader } from '@/components/common/AppHeader';
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useDuplicateProjectMutation,
  useProjectsQuery,
} from '@/lib/projects/use-projects';

export default function ProjectsPage() {
  const router = useRouter();
  const projects = useProjectsQuery();
  const createProject = useCreateProjectMutation(projects.userId, (id) => router.push(`/editor?id=${id}`));
  const deleteProject = useDeleteProjectMutation(projects.userId);
  const duplicateProject = useDuplicateProjectMutation(projects.userId, projects.data);
  const isProjectsPending = projects.isAuthPending || projects.isLoading;

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
            onClick={() => createProject.mutate()}
            disabled={projects.isAuthPending || createProject.isPending}
            className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
          >
            {createProject.isPending ? 'Creating...' : 'New project'}
          </button>
        </header>

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
            onDelete={(id) => deleteProject.mutate(id)}
            onDuplicate={(id) => duplicateProject.mutate(id)}
          />
        )}
      </div>
    </main>
  );
}
