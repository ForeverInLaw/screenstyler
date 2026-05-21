'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectList } from '@/components/projects/ProjectList';
import { MigrationRunner } from '@/components/migration/MigrationRunner';
import { AppHeader } from '@/components/common/AppHeader';
import { getProjectStore } from '@/lib/storage/active-stores';
import { createBlankDoc } from '@/lib/document/factory';

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => getProjectStore().list() });

  const createProject = useMutation({
    mutationFn: () => getProjectStore().create('Untitled', createBlankDoc()),
    onSuccess: (id) => router.push(`/editor?id=${id}`),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => getProjectStore().remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const duplicateProject = useMutation({
    mutationFn: async (sourceId: string) => {
      const source = projects.data?.find((p) => p.id === sourceId);
      const doc = await getProjectStore().load(sourceId);
      return getProjectStore().create(`${source?.name ?? 'Untitled'} copy`, doc);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] aspect-square rounded-full bg-violet-600/5 blur-[130px] pointer-events-none" />

      <AppHeader active="projects" />
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 relative z-10">
        <MigrationRunner />
        <header className="mb-10 flex flex-col gap-5 border-b border-zinc-800/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Workspace</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">Projects</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Keep local drafts moving, duplicate good layouts, and open the editor only when you are ready to work.
            </p>
          </div>
          <button
            type="button"
            onClick={() => createProject.mutate()}
            disabled={createProject.isPending}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition-all duration-205 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            {createProject.isPending ? 'Creating...' : 'New project'}
          </button>
        </header>

        {projects.isLoading && (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 rounded-xl bg-zinc-900/35 border border-zinc-850 p-4 shadow-sm backdrop-blur-sm animate-pulse">
                <div className="h-36 rounded-lg bg-zinc-950/80 border border-zinc-850/50" />
                <div className="mt-5 h-3.5 w-32 rounded bg-zinc-800" />
                <div className="mt-2 h-2.5 w-20 rounded bg-zinc-900" />
              </div>
            ))}
          </div>
        )}

        {projects.isError && (
          <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-400">
            Could not load projects. Refresh the page and try again.
          </p>
        )}

        {projects.data && (
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
