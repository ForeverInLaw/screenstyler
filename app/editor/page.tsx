'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { EditorShell } from '@/components/editor/EditorShell';
import { Toolbar } from '@/components/editor/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { DocumentCanvas } from '@/components/canvas/DocumentCanvas';
import { UploadZone } from '@/components/editor/UploadZone';
import { useDocumentStore } from '@/lib/document/store';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { projectStore } from '@/lib/storage/project-store-instance';
import { exportPng, downloadBlob, exportFilename } from '@/lib/export/export-png';
import { useAutosave } from '@/lib/editor/use-autosave';

function EditorPage() {
  const id = useSearchParams().get('id') ?? '';
  const frameRef = useRef<HTMLDivElement>(null);
  const doc = useDocumentStore((s) => s.doc);
  const loadDoc = useDocumentStore((s) => s.loadDoc);

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectStore.load(id),
    enabled: Boolean(id),
  });

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => projectStore.list() });
  const projectName = projects.data?.find((p) => p.id === id)?.name ?? 'Untitled';

  const saveMutation = useMutation({
    mutationFn: ({ id: pid, doc: d }: { id: string; doc: typeof doc }) =>
      projectStore.save(pid, d),
    onError: (err) => {
      if (err instanceof Error && err.message === 'STORAGE_FULL') {
        window.alert('Local storage is full. Delete old projects to keep saving.');
      }
    },
  });
  useAutosave(id || null, (pid, d) => saveMutation.mutate({ id: pid, doc: d }));

  useEffect(() => {
    if (project.data) {
      loadDoc(project.data);
      useDocumentStore.temporal.getState().clear();
    }
  }, [project.data, loadDoc]);

  async function handleExport() {
    if (!frameRef.current) return;
    const blob = await exportPng(frameRef.current, 2);
    downloadBlob(blob, exportFilename(projectName, 2));
  }

  return (
    <EditorShell
      toolbar={<Toolbar projectName={projectName} onExport={handleExport} />}
      canvas={
        doc.content.image ? (
          <CanvasStage docWidth={doc.canvas.width} docHeight={doc.canvas.height}>
            <DocumentCanvas ref={frameRef} doc={doc} />
          </CanvasStage>
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
