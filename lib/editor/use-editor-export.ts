'use client';
import type { RefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import { exportPng, downloadBlob, exportFilename } from '@/lib/export/export-png';

export function useEditorExport(canvas: RefObject<HTMLDivElement | null>, name: string) {
  return useMutation({
    mutationFn: async () => {
      if (!canvas.current) return;
      const blob = await exportPng(canvas.current, 2);
      downloadBlob(blob, exportFilename(name, 2));
    },
    onError: () => window.alert('Export failed. Make sure the image finished loading, then retry.'),
  });
}
