'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { EditorShell } from '@/components/editor/EditorShell';
import { Toolbar } from '@/components/editor/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { DocumentCanvas } from '@/components/canvas/DocumentCanvas';
import { UploadZone } from '@/components/editor/UploadZone';
import { useDocumentStore } from '@/lib/document/store';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { getProjectStore, getBlobStore } from '@/lib/storage/active-stores';
import { exportPng, downloadBlob, exportFilename } from '@/lib/export/export-png';
import { useAutosave } from '@/lib/editor/use-autosave';
import { CorruptDocumentError, type ScreenstylerDoc } from '@/lib/document/schema';
import { createBlankDoc } from '@/lib/document/factory';
import { DocumentRecoveryScreen } from '@/components/editor/DocumentRecoveryScreen';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function EditorPage() {
  const id = useSearchParams().get('id') ?? '';
  const frameRef = useRef<HTMLDivElement>(null);
  const doc = useDocumentStore((s) => s.doc);
  const loadDoc = useDocumentStore((s) => s.loadDoc);
  const [activeTool, setActiveTool] = useState<'select' | 'arrow' | 'text' | 'highlight' | 'blur'>('select');

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectStore().load(id),
    enabled: Boolean(id),
  });

  const resetToBlank = useCallback(async () => {
    const blank = createBlankDoc();
    await getProjectStore().save(id, blank);
    project.refetch();
  }, [id, project]);

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => getProjectStore().list() });
  const projectName = projects.data?.find((p) => p.id === id)?.name ?? 'Untitled';

  const saveMutation = useMutation({
    mutationFn: async ({ id: pid, doc: d }: { id: string; doc: typeof doc }) => {
      let thumbnailKey: string | null = null;
      if (frameRef.current && d.content.image) {
        try {
          const blob = await exportPng(frameRef.current, 0.15);
          const key = `thumbnail_${pid}`;
          await getBlobStore().put(key, blob);
          thumbnailKey = key;
        } catch (err) {
          console.warn('Thumbnail generation skipped:', err);
        }
      }
      await getProjectStore().save(pid, d, thumbnailKey ? { thumbnailKey } : undefined);
    },
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

  const isCorrupted = project.error && (project.error as any).isCorrupt;
  if (isCorrupted) {
    return (
      <DocumentRecoveryScreen
        id={id}
        rawJson={(project.error as any).rawJson}
        error={project.error as Error}
        onReset={resetToBlank}
      />
    );
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
      toolbar={
        <Toolbar
          projectName={projectName}
          onExport={handleExport}
          activeTool={activeTool}
          onChangeTool={setActiveTool}
        />
      }
      canvas={
        doc.content.image ? (
          <ErrorBoundary fallback={<p style={{ margin: 'auto' }}>Canvas failed to render.</p>}>
            <CanvasStage docWidth={doc.canvas.width} docHeight={doc.canvas.height}>
              <DocumentCanvas ref={frameRef} doc={doc} activeTool={activeTool} />
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
