'use client';
import { Suspense, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { EditorShell } from '@/components/editor/EditorShell';
import { Toolbar } from '@/components/editor/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { DocumentCanvas } from '@/components/canvas/DocumentCanvas';
import { UploadZone } from '@/components/editor/UploadZone';
import { useDocumentStore } from '@/lib/document/store';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { getProjectStore } from '@/lib/storage/active-stores';
import { exportPng, downloadBlob, exportFilename } from '@/lib/export/export-png';
import { useAutosave } from '@/lib/editor/use-autosave';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function EditorPage() {
  const id = useSearchParams().get('id') ?? '';
  const frameRef = useRef<HTMLDivElement>(null);
  const doc = useDocumentStore((s) => s.doc);
  const loadDoc = useDocumentStore((s) => s.loadDoc);

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectStore().load(id),
    enabled: Boolean(id),
  });

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => getProjectStore().list() });
  const projectName = projects.data?.find((p) => p.id === id)?.name ?? 'Untitled';

  const saveMutation = useMutation({
    mutationFn: ({ id: pid, doc: d }: { id: string; doc: typeof doc }) =>
      getProjectStore().save(pid, d),
    onError: async (err) => {
      if (err instanceof Error) {
        if (err.message === 'STORAGE_FULL') {
          window.alert('Local storage is full. Delete old projects to keep saving.');
          return;
        }
        if (err.message === 'HTTP_401') {
          const { signOut } = await import('@/lib/auth/client');
          await signOut();
          window.alert('Session expired. Sign in to keep saving.');
          return;
        }
      }
    },
  });
  const { mutate: saveProjectMutate } = saveMutation;
  const saveProject = useCallback(
    (pid: string, d: ScreenstylerDoc) => saveProjectMutate({ id: pid, doc: d }),
    [saveProjectMutate],
  );
  useAutosave(id || null, saveProject, project.data);

  useEffect(() => {
    if (project.data) {
      loadDoc(project.data);
      useDocumentStore.temporal.getState().clear();
    }
  }, [project.data, loadDoc]);

  async function handleExport() {
    if (!frameRef.current) return;
    try {
      const blob = await exportPng(frameRef.current, 2);
      downloadBlob(blob, exportFilename(projectName, 2));
    } catch {
      window.alert('Export failed. Make sure the image finished loading, then retry.');
    }
  }

  if (project.isError) {
    return (
      <p style={{ padding: 32 }}>
        Could not load this project. It may have been deleted.
      </p>
    );
  }

  return (
    <EditorShell
      toolbar={<Toolbar projectName={projectName} onExport={handleExport} />}
      canvas={
        doc.content.image ? (
          <ErrorBoundary fallback={<p style={{ margin: 'auto' }}>Canvas failed to render.</p>}>
            <CanvasStage docWidth={doc.canvas.width} docHeight={doc.canvas.height}>
              <DocumentCanvas ref={frameRef} doc={doc} />
            </CanvasStage>
          </ErrorBoundary>
        ) : (
          <div style={{ flex: 1, display: 'flex', background: '#0f1115' }}>
            <UploadZone />
          </div>
        )
      }
      panel={<PropertiesPanel />}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EditorPage />
    </Suspense>
  );
}
