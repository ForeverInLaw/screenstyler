'use client';
import type { ReactNode } from 'react';
import { useWorkspaceStore } from '@/lib/editor/workspace-store';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { IconMinus, IconPlus, IconMaximize } from '@tabler/icons-react';
import { Button } from '@/components/ui/Button';

type Props = { toolbar: ReactNode; canvas: ReactNode; panel: ReactNode; saveStatus?: string };

export function EditorShell({ toolbar, canvas, panel, saveStatus = 'Autosave on' }: Props) {
  const inspectorOpen = useWorkspaceStore((s) => s.isInspectorOpen);
  const width = useDocumentStore((s) => s.doc.canvas.width);
  const height = useDocumentStore((s) => s.doc.canvas.height);
  const count = useDocumentStore((s) => s.doc.content.screenshots?.length ?? 0);
  const zoom = useEditorUiStore((s) => s.viewportZoom);
  const setZoom = useEditorUiStore((s) => s.setViewportZoom);
  const resetZoom = useEditorUiStore((s) => s.resetViewportZoom);
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {toolbar}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main aria-label="Screenshot canvas" className="flex min-h-0 min-w-0 flex-1 bg-workbench">
          {canvas}
        </main>
        {panel && inspectorOpen && (
          <aside
            id="editor-inspector"
            aria-label="Design inspector"
            className="h-[36dvh] w-full shrink-0 overflow-y-auto border-t border-border bg-background lg:h-auto lg:w-80 lg:border-l lg:border-t-0"
          >
            {panel}
          </aside>
        )}
      </div>
      <footer className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3 text-[11px] text-tertiary sm:px-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="font-mono tabular-nums">
            {width} × {height}
          </span>
          <span className="hidden sm:inline">
            {count} {count === 1 ? 'screenshot' : 'screenshots'}
          </span>
          <span role="status">{saveStatus}</span>
        </div>
        <span className="hidden text-[10px] lg:block">Alt + scroll to zoom · Middle mouse to pan</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" iconOnly aria-label="Zoom out" onClick={() => setZoom(zoom - 0.1)}>
            <IconMinus size={14} />
          </Button>
          <span className="w-10 text-center font-mono tabular-nums text-secondary">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" iconOnly aria-label="Zoom in" onClick={() => setZoom(zoom + 0.1)}>
            <IconPlus size={14} />
          </Button>
          <Button variant="ghost" iconOnly aria-label="Fit canvas" title="Fit canvas" onClick={resetZoom}>
            <IconMaximize size={14} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
