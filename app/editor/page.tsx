'use client';
import { Suspense, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/lib/editor/workspace-store';
import { EditorShell } from '@/components/editor/EditorShell';
import { Toolbar } from '@/components/editor/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { DocumentCanvas } from '@/components/canvas/DocumentCanvas';
import { UploadZone } from '@/components/editor/UploadZone';
import { useDocumentStore } from '@/lib/document/store';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { getBlobStoreForUser, getProjectStoreForUser } from '@/lib/storage/active-stores';
import { useEditorExport } from '@/lib/editor/use-editor-export';
import { exportPng } from '@/lib/export/export-png';
import { useAutosave } from '@/lib/editor/use-autosave';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { createBlankDoc } from '@/lib/document/factory';
import { DocumentRecoveryScreen } from '@/components/editor/DocumentRecoveryScreen';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import {
  projectKeys,
  useProjectQuery,
  useProjectsQuery,
  useRenameProjectMutation,
} from '@/lib/projects/use-projects';
import { imageFileFromClipboard, isEditablePasteTarget } from '@/lib/upload/clipboard';
import { ingestImageFile, validateImageFile } from '@/lib/upload/load-image';
import { handleScreenshotShortcut } from '@/lib/editor/selection-shortcuts';

function EditorPage() {
  const id = useSearchParams().get('id') ?? '';
  const queryClient = useQueryClient();
  const frameRef = useRef<HTMLDivElement>(null);
  const lastThumbAtRef = useRef(0);
  const doc = useDocumentStore((s) => s.doc);
  const loadDoc = useDocumentStore((s) => s.loadDoc);
  const addScreenshot = useDocumentStore((s) => s.addScreenshot);
  const activeTool = useWorkspaceStore((s) => s.activeTool);
  const setActiveTool = useWorkspaceStore((s) => s.setActiveTool);
  const isPreview = useWorkspaceStore((s) => s.isPreview);
  const togglePreview = useWorkspaceStore((s) => s.togglePreview);

  const resetTools = useWorkspaceStore((s) => s.resetTools);
  useEffect(() => resetTools(), [id, resetTools]);

  const project = useProjectQuery(id);
  const renameProject = useRenameProjectMutation(project.userId);

  const resetToBlank = useCallback(async () => {
    const blank = createBlankDoc();
    await getProjectStoreForUser(project.userId).save(id, blank);
    project.refetch();
    queryClient.invalidateQueries({ queryKey: projectKeys.all });
  }, [id, project, queryClient]);

  const projects = useProjectsQuery();
  const projectName = projects.data?.find((p) => p.id === id)?.name ?? 'Untitled';

  const saveMutation = useMutation({
    mutationFn: async ({ id: pid, doc: d }: { id: string; doc: typeof doc }) => {
      let thumbnailKey: string | null = null;
      const hasScreenshots = d.content.screenshots && d.content.screenshots.length > 0;
      // exportPng (full snapdom raster) is expensive; throttle it so a burst of
      // edits doesn't re-rasterize the canvas on every 800ms autosave tick.
      const THUMB_INTERVAL_MS = 15000;
      const now = Date.now();
      if (frameRef.current && hasScreenshots && now - lastThumbAtRef.current > THUMB_INTERVAL_MS) {
        try {
          const blob = await exportPng(frameRef.current, 1);
          const userId = project.userId;
          const baseKey = `thumbnail_${pid}`;
          const key = userId ? `users/${userId}/${baseKey}` : baseKey;
          await getBlobStoreForUser(userId).put(key, blob);
          thumbnailKey = key;
          lastThumbAtRef.current = now;
        } catch (err) {
          console.warn('Thumbnail generation skipped:', err);
        }
      }
      await getProjectStoreForUser(project.userId).save(pid, d, thumbnailKey ? { thumbnailKey } : undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
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

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      if (isPreview || isEditablePasteTarget(event.target)) return;

      const file = imageFileFromClipboard(event.clipboardData);
      if (!file) return;

      event.preventDefault();
      const validation = validateImageFile(file);
      if (!validation.ok) {
        window.alert(
          validation.reason === 'TOO_LARGE'
            ? 'Image is larger than 25 MB.'
            : 'Use a PNG, JPG, or WebP image.',
        );
        return;
      }

      void ingestImageFile(file, project.userId)
        .then((img) => addScreenshot(img))
        .catch(() => window.alert('Could not read that image. It may be corrupt — try another file.'));
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isPreview, project.userId, addScreenshot]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isPreview) return;

      // Ignore shortcuts if user is typing in input, textarea, or contenteditable
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }
      if (handleScreenshotShortcut(event)) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      if (isCmdOrCtrl) {
        if (event.key.toLowerCase() === 'z') {
          event.preventDefault();
          if (event.shiftKey) {
            useDocumentStore.temporal.getState().redo();
          } else {
            useDocumentStore.temporal.getState().undo();
          }
        } else if (event.key.toLowerCase() === 'y') {
          event.preventDefault();
          useDocumentStore.temporal.getState().redo();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreview]);

  const exportMutation = useEditorExport(frameRef, projectName);

  function handleRenameProject(name: string) {
    if (!id) return;
    renameProject.mutate({ id, name });
  }

  const corruptError =
    project.error instanceof Error && 'isCorrupt' in project.error
      ? (project.error as Error & { isCorrupt: true; rawJson: string })
      : null;

  if (corruptError) {
    return (
      <DocumentRecoveryScreen
        id={id}
        rawJson={corruptError.rawJson}
        error={corruptError}
        onReset={resetToBlank}
      />
    );
  }

  if (project.isError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-medium">Project unavailable.</h1>
          <p className="mt-3 text-sm text-secondary">It may have been deleted, or the connection failed.</p>
          <Link href="/projects" className="button mt-6">
            Back to projects
          </Link>
        </div>
      </main>
    );
  }
  if (id && (project.isLoading || project.isAuthPending)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background">
        <p role="status" className="text-sm text-secondary">
          Opening your canvas...
        </p>
      </main>
    );
  }

  return (
    <EditorShell
      saveStatus={
        !id
          ? 'Unsaved canvas'
          : saveMutation.isPending
            ? 'Saving...'
            : saveMutation.isError
              ? 'Save failed'
              : 'Autosave on'
      }
      toolbar={
        <Toolbar
          projectName={projectName}
          onExport={() => exportMutation.mutate()}
          isExporting={exportMutation.isPending}
          canExport={!!doc.content.screenshots?.length}
          activeTool={activeTool}
          onChangeTool={setActiveTool}
          isPreview={isPreview}
          onTogglePreview={togglePreview}
          onRenameProject={handleRenameProject}
          isRenamingProject={renameProject.isPending}
        />
      }
      canvas={
        doc.content.screenshots && doc.content.screenshots.length > 0 ? (
          <ErrorBoundary fallback={<p style={{ margin: 'auto' }}>Canvas failed to render.</p>}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                let rejected = false;
                files.forEach((file) => {
                  const validation = validateImageFile(file);
                  if (validation.ok) {
                    ingestImageFile(file, project.userId)
                      .then((img) => addScreenshot(img))
                      .catch(() =>
                        window.alert('Could not read that image. It may be corrupt — try another file.'),
                      );
                  } else {
                    rejected = true;
                  }
                });
                if (rejected) {
                  window.alert('Some files were skipped. Use PNG, JPG, or WebP images under 25 MB.');
                }
              }}
              style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}
            >
              <CanvasStage docWidth={doc.canvas.width} docHeight={doc.canvas.height}>
                <DocumentCanvas
                  ref={frameRef}
                  doc={doc}
                  activeTool={activeTool}
                  onChangeTool={setActiveTool}
                  isPreview={isPreview}
                />
              </CanvasStage>
            </div>
          </ErrorBoundary>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-y-auto bg-workbench">
            <UploadZone />
          </div>
        )
      }
      panel={!isPreview && <PropertiesPanel />}
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
