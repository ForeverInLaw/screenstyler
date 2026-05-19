'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { EditorShell } from '@/components/editor/EditorShell';
import { Toolbar } from '@/components/editor/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { DocumentCanvas } from '@/components/canvas/DocumentCanvas';
import { UploadZone } from '@/components/editor/UploadZone';
import { useDocumentStore } from '@/lib/document/store';
import { projectStore } from '@/lib/storage/project-store-instance';
import { exportPng, downloadBlob, exportFilename } from '@/lib/export/export-png';

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

  useEffect(() => {
    if (project.data) {
      loadDoc(project.data);
      useDocumentStore.temporal.getState().clear();
    }
  }, [project.data, loadDoc]);

  async function handleExport() {
    if (!frameRef.current) return;
    const blob = await exportPng(frameRef.current, 2);
    downloadBlob(blob, exportFilename(id, 2));
  }

  return (
    <EditorShell
      toolbar={<Toolbar projectName={id} onExport={handleExport} />}
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
      panel={<div style={{ padding: 16 }}>Panels added in Task 15</div>}
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
