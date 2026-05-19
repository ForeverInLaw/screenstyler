'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectList } from '@/components/projects/ProjectList';
import { projectStore } from '@/lib/storage/project-store-instance';
import { createBlankDoc } from '@/lib/document/factory';

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => projectStore.list() });

  const createProject = useMutation({
    mutationFn: () => projectStore.create('Untitled', createBlankDoc()),
    onSuccess: (id) => router.push(`/editor?id=${id}`),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => projectStore.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const duplicateProject = useMutation({
    mutationFn: async (sourceId: string) => {
      const source = projects.data?.find((p) => p.id === sourceId);
      const doc = await projectStore.load(sourceId);
      return projectStore.create(`${source?.name ?? 'Untitled'} copy`, doc);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Projects</h1>
        <button type="button" onClick={() => createProject.mutate()}>New project</button>
      </header>
      {projects.data && (
        <ProjectList
          projects={projects.data}
          onDelete={(id) => deleteProject.mutate(id)}
          onDuplicate={(id) => duplicateProject.mutate(id)}
        />
      )}
    </main>
  );
}
