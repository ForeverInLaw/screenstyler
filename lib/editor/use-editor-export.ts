'use client';
import type { RefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import { exportPng, downloadBlob, exportFilename } from '@/lib/export/export-png';
import { useProjectsQuery } from '@/lib/projects/use-projects';

export function useEditorExport(canvas: RefObject<HTMLDivElement | null>, projectId: string) {
  const projects = useProjectsQuery();
  return useMutation({
    mutationFn: async () => {
      const node = canvas.current;
      if (!node) return;
      let name = projectId ? projects.data?.find((project) => project.id === projectId)?.name : 'Untitled';
      if (name === undefined) {
        const result = await projects.refetch();
        name = result.data?.find((project) => project.id === projectId)?.name;
        if (result.error || name === undefined) throw new Error('Could not load the project name. Check your connection and retry.');
      }
      const blob = await exportPng(node, 2);
      downloadBlob(blob, exportFilename(name, 2));
    },
    onError: (error) => window.alert(error.message || 'Export failed. Make sure the image finished loading, then retry.'),
  });
}
