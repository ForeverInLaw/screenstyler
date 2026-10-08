'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowLeft,
  IconArrowUpRight,
  IconBlur,
  IconCheck,
  IconClearAll,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconHighlight,
  IconMouse,
  IconPencil,
  IconLayoutSidebarRight,
  IconTypography,
  IconX,
} from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { useWorkspaceStore, type EditorTool } from '@/lib/editor/workspace-store';
import { Brand } from '@/components/common/Brand';
import { Button } from '@/components/ui/Button';
import { AnnotationOptions } from './AnnotationOptions';

type Props = {
  projectName: string;
  onExport: () => void;
  activeTool?: EditorTool;
  onChangeTool?: (tool: EditorTool) => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
  onRenameProject?: (name: string) => Promise<void>;
  isRenamingProject?: boolean;
  renameError?: string;
  isExporting?: boolean;
  canExport?: boolean;
};

const tools = [
  { id: 'select', label: 'Select', Icon: IconMouse },
  { id: 'arrow', label: 'Arrow', Icon: IconArrowUpRight },
  { id: 'text', label: 'Text', Icon: IconTypography },
  { id: 'highlight', label: 'Highlight', Icon: IconHighlight },
  { id: 'blur', label: 'Blur', Icon: IconBlur },
] as const;

export function Toolbar({
  projectName,
  onExport,
  activeTool = 'select',
  onChangeTool = () => {},
  isPreview = false,
  onTogglePreview = () => {},
  onRenameProject,
  isRenamingProject = false,
  renameError,
  isExporting = false,
  canExport = true,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(projectName);
  const setAnnotations = useDocumentStore((s) => s.setAnnotations);
  const isInspectorOpen = useWorkspaceStore((s) => s.isInspectorOpen);
  const toggleInspector = useWorkspaceStore((s) => s.toggleInspector);

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRenamingProject) return;
    try {
      await onRenameProject?.(draftName);
      setIsEditing(false);
    } catch {
      // The mutation exposes the error; keep the draft available for retry.
    }
  }

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href="/projects" aria-label="Screenstyler workspace" title="Open workspace">
            <Brand compact />
          </Link>
          <span className="hidden text-muted sm:block" aria-hidden="true">
            /
          </span>
          {isEditing ? (
            <form onSubmit={rename} className="grid min-w-0 gap-1">
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  aria-label="Project name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="field max-w-44"
                  disabled={isRenamingProject}
                />
                <Button iconOnly type="submit" aria-label="Save project name" disabled={isRenamingProject}>
                  <IconCheck size={16} />
                </Button>
                <Button iconOnly variant="ghost" aria-label="Cancel rename" disabled={isRenamingProject} onClick={() => setIsEditing(false)}>
                  <IconX size={16} />
                </Button>
              </div>
              {renameError && <p role="alert" className="text-xs text-danger">{renameError}</p>}
            </form>
          ) : (
            <div className="flex min-w-0 items-center gap-1">
              <span className="max-w-24 truncate text-xs font-semibold sm:max-w-52 sm:text-sm">
                {projectName}
              </span>
              {onRenameProject && (
                <Button
                  iconOnly
                  variant="ghost"
                  aria-label="Rename project"
                  onClick={() => {
                    setDraftName(projectName);
                    setIsEditing(true);
                  }}
                >
                  <IconPencil size={15} />
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            onClick={onTogglePreview}
            aria-label={isPreview ? 'Edit Mode' : 'Preview'}
            aria-pressed={isPreview}
            className="max-sm:w-10 max-sm:px-2"
          >
            {isPreview ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            <span className="hidden sm:inline">{isPreview ? 'Edit Mode' : 'Preview'}</span>
          </Button>
          <Button
            variant="primary"
            onClick={onExport}
            disabled={isExporting || !canExport}
            title={canExport ? 'Export PNG at 2× resolution' : 'Add a screenshot to export'}
            aria-label="Export"
          >
            <IconDownload size={20} />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            <span className="hidden border-l border-current/20 pl-2 font-mono text-[10px] font-normal lg:inline">
              PNG · 2×
            </span>
          </Button>
        </div>
      </div>
      {!isPreview && (
        <>
          <div className="flex min-h-14 items-center justify-between gap-4 border-t border-border px-3 sm:px-6">
            <Link href="/projects" className="button button-ghost hidden gap-2 px-0 text-xs lg:inline-flex">
              <IconArrowLeft size={15} />
              All projects
            </Link>
            <div
              role="group"
              aria-label="Annotation tools"
              className="flex items-center gap-1 overflow-x-auto py-1"
            >
              {tools.map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  variant="ghost"
                  aria-label={label}
                  aria-pressed={activeTool === id}
                  onClick={() => onChangeTool(id)}
                  className="min-w-10 gap-2 px-2 sm:px-3"
                >
                  <Icon size={20} stroke={1.6} />
                  <span className="hidden text-xs sm:inline">{label}</span>
                </Button>
              ))}
              <span className="mx-1 h-5 w-px shrink-0 bg-border" />
              <Button
                variant="ghost"
                iconOnly
                onClick={() => setAnnotations([])}
                aria-label="Clear annotations"
                title="Clear annotations"
              >
                <IconClearAll size={20} />
              </Button>
              <Button
                variant="ghost"
                iconOnly
                onClick={() => useDocumentStore.temporal.getState().undo()}
                aria-label="Undo"
              >
                <IconArrowBackUp size={20} />
              </Button>
              <Button
                variant="ghost"
                iconOnly
                onClick={() => useDocumentStore.temporal.getState().redo()}
                aria-label="Redo"
              >
                <IconArrowForwardUp size={20} />
              </Button>
            </div>
            <Button
              variant="ghost"
              iconOnly
              onClick={toggleInspector}
              aria-label="Toggle inspector"
              aria-expanded={isInspectorOpen}
              aria-controls="editor-inspector"
              title="Toggle inspector"
            >
              <IconLayoutSidebarRight size={20} />
            </Button>
          </div>
          <AnnotationOptions activeTool={activeTool} />
        </>
      )}
    </header>
  );
}
