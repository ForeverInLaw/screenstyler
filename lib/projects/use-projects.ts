'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/client';
import { createBlankDoc } from '@/lib/document/factory';
import { duplicateDocWithBlobs } from '@/lib/document/clone';
import { getProjectStoreForUser } from '@/lib/storage/active-stores';
import type { ProjectMeta } from '@/lib/storage/types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (userId: string | null) =>
    ['projects', userId ? 'cloud' : 'local', userId ?? 'anonymous'] as const,
  detail: (userId: string | null, id: string) =>
    ['project', userId ? 'cloud' : 'local', userId ?? 'anonymous', id] as const,
};

export function useProjectStorageIdentity() {
  const session = useSession();
  return {
    userId: session.data?.user?.id ?? null,
    isAuthPending: Boolean(session.isPending),
  };
}

export function useProjectsQuery() {
  const { userId, isAuthPending } = useProjectStorageIdentity();
  const query = useQuery({
    queryKey: projectKeys.list(userId),
    queryFn: () => getProjectStoreForUser(userId).list(),
    enabled: !isAuthPending,
  });

  return { ...query, userId, isAuthPending };
}

export function useProjectQuery(id: string, enabled = true) {
  const { userId, isAuthPending } = useProjectStorageIdentity();
  const query = useQuery({
    queryKey: projectKeys.detail(userId, id),
    queryFn: () => getProjectStoreForUser(userId).load(id),
    enabled: enabled && Boolean(id) && !isAuthPending,
  });

  return { ...query, userId, isAuthPending };
}

export function useCreateProjectMutation(userId: string | null, onCreated: (id: string) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => {
      const projectName = name.trim() || 'Untitled';
      return getProjectStoreForUser(userId).create(projectName, createBlankDoc());
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onCreated(id);
    },
  });
}

export function useDeleteProjectMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getProjectStoreForUser(userId).remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useRenameProjectMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const projectName = name.trim() || 'Untitled';
      const store = getProjectStoreForUser(userId);
      const doc = await store.load(id);
      await store.save(id, doc, { name: projectName });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useDuplicateProjectMutation(userId: string | null, projects: ProjectMeta[] | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      const store = getProjectStoreForUser(userId);
      const source = projects?.find((p) => p.id === sourceId);
      const doc = await store.load(sourceId);
      const cloned = await duplicateDocWithBlobs(doc, userId);
      return store.create(`${source?.name ?? 'Untitled'} copy`, cloned);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
