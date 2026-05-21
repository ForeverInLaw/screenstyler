'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowLeft,
  IconArrowRight,
  IconArrowRightDashed,
  IconArrowUpRight,
  IconArrowsLeftRight,
  IconBlur,
  IconCheck,
  IconCircleDot,
  IconClearAll,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconHighlight,
  IconMouse,
  IconPencil,
  IconTypography,
  IconX,
  type Icon,
} from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { arrowColors, arrowVariants } from '@/lib/annotations/arrows';
import type { ArrowVariant } from '@/lib/document/schema';
import { useAnnotationStyleStore } from '@/lib/editor/annotation-style-store';

type Tool = 'select' | 'arrow' | 'text' | 'highlight' | 'blur';

const arrowVariantIcons: Record<ArrowVariant, Icon> = {
  solid: IconArrowRight,
  dashed: IconArrowRightDashed,
  double: IconArrowsLeftRight,
  dot: IconCircleDot,
};

type Props = {
  projectName: string;
  onExport: () => void;
  activeTool?: Tool;
  onChangeTool?: (tool: Tool) => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
  onRenameProject?: (name: string) => void;
  isRenamingProject?: boolean;
};

export function Toolbar({
  projectName,
  onExport,
  activeTool = 'select',
  onChangeTool = () => {},
  isPreview = false,
  onTogglePreview = () => {},
  onRenameProject,
  isRenamingProject = false,
}: Props) {
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [draftProjectName, setDraftProjectName] = useState(projectName);
  const undo = () => useDocumentStore.temporal.getState().undo();
  const redo = () => useDocumentStore.temporal.getState().redo();
  const setAnnotations = useDocumentStore((s) => s.setAnnotations);
  const arrowColor = useAnnotationStyleStore((s) => s.arrowColor);
  const arrowVariant = useAnnotationStyleStore((s) => s.arrowVariant);
  const setArrowColor = useAnnotationStyleStore((s) => s.setArrowColor);
  const setArrowVariant = useAnnotationStyleStore((s) => s.setArrowVariant);

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRenameProject?.(draftProjectName);
    setIsEditingProjectName(false);
  }

  const tools: { id: Tool; label: string; Icon: Icon }[] = [
    { id: 'select', label: 'Select', Icon: IconMouse },
    { id: 'arrow', label: 'Arrow', Icon: IconArrowUpRight },
    { id: 'text', label: 'Text', Icon: IconTypography },
    { id: 'highlight', label: 'Highlight', Icon: IconHighlight },
    { id: 'blur', label: 'Blur', Icon: IconBlur },
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 16px',
        borderBottom: '1px solid #2a2d36',
        background: '#16181d',
        color: '#e5e7eb',
      }}
    >
      <strong>Screenstyler</strong>
      <Link
        href="/projects"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: '1px solid #3a3d46',
          borderRadius: '6px',
          color: '#e5e7eb',
          padding: '6px 10px',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: 700,
          background: '#20232b',
        }}
      >
        <IconArrowLeft size={16} stroke={1.8} aria-hidden="true" />
        Projects
      </Link>
      {isEditingProjectName ? (
        <form onSubmit={handleRenameSubmit} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            autoFocus
            aria-label="Project name"
            value={draftProjectName}
            onChange={(event) => setDraftProjectName(event.target.value)}
            style={{
              width: 180,
              border: '1px solid #3a3d46',
              borderRadius: 6,
              background: '#0f1115',
              color: '#ffffff',
              padding: '6px 8px',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button type="submit" aria-label="Save project name" disabled={isRenamingProject} style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid #3a3d46', background: '#2a2d36', color: '#ffffff', cursor: 'pointer' }}>
            <IconCheck size={16} stroke={1.8} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Cancel rename" onClick={() => setIsEditingProjectName(false)} style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid #3a3d46', background: 'transparent', color: '#e5e7eb', cursor: 'pointer' }}>
            <IconX size={16} stroke={1.8} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ opacity: 0.7, fontSize: '14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectName}</span>
          {onRenameProject && (
            <button type="button" aria-label="Rename project" onClick={() => {
              setDraftProjectName(projectName);
              setIsEditingProjectName(true);
            }} style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #3a3d46', background: 'transparent', color: '#e5e7eb', cursor: 'pointer' }}>
              <IconPencil size={15} stroke={1.8} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Annotation Drawing Tools - hidden in preview */}
      {!isPreview && (
        <div style={{ display: 'flex', gap: 4, margin: '0 auto', background: '#0f1115', padding: 4, borderRadius: 8, border: '1px solid #2a2d36' }}>
          {tools.map((t) => {
            const isActive = activeTool === t.id;
            const ToolIcon = t.Icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTool(t.id)}
                title={t.label}
                style={{
                  background: isActive ? '#6366f1' : 'transparent',
                  color: isActive ? '#ffffff' : '#e5e7eb',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'background 0.2s',
                }}
              >
                <ToolIcon size={16} stroke={1.8} aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {!isPreview && activeTool === 'arrow' && (
        <div aria-label="Arrow options" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f1115', padding: 4, borderRadius: 8, border: '1px solid #2a2d36' }}>
          {arrowVariants.map((variant) => {
            const VariantIcon = arrowVariantIcons[variant.id];
            const isActive = arrowVariant === variant.id;
            return (
              <button
                key={variant.id}
                type="button"
                aria-label={variant.label}
                title={variant.label}
                onClick={() => setArrowVariant(variant.id)}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: isActive ? '1px solid #818cf8' : '1px solid transparent',
                  background: isActive ? '#312e81' : 'transparent',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                }}
              >
                <VariantIcon size={16} stroke={1.8} aria-hidden="true" />
              </button>
            );
          })}
          <div style={{ width: 1, height: 18, background: '#2a2d36' }} />
          {arrowColors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Arrow color ${color}`}
              title={color}
              onClick={() => setArrowColor(color)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                border: arrowColor === color ? '2px solid #ffffff' : '1px solid #3a3d46',
                backgroundColor: color,
                cursor: 'pointer',
              }}
            />
          ))}
          <input
            type="color"
            aria-label="Custom arrow color"
            value={arrowColor}
            onChange={(event) => setArrowColor(event.target.value)}
            style={{ width: 28, height: 28, border: '1px solid #3a3d46', borderRadius: 6, backgroundColor: 'transparent', padding: 0, cursor: 'pointer' }}
          />
        </div>
      )}

      {/* Spacer when tools are hidden */}
      {isPreview && <div style={{ margin: '0 auto' }} />}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!isPreview && (
          <>
            <button
              type="button"
              onClick={() => setAnnotations([])}
              style={{
                background: 'transparent',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                color: '#e5e7eb',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IconClearAll size={16} stroke={1.8} aria-hidden="true" />
              <span>Clear annotations</span>
            </button>
            <div style={{ width: 1, height: 20, background: '#2a2d36' }} />
            <button type="button" onClick={undo} aria-label="Undo" style={{ background: '#2a2d36', border: '1px solid #3a3d46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}><IconArrowBackUp size={16} stroke={1.8} aria-hidden="true" />Undo</button>
            <button type="button" onClick={redo} aria-label="Redo" style={{ background: '#2a2d36', border: '1px solid #3a3d46', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}><IconArrowForwardUp size={16} stroke={1.8} aria-hidden="true" />Redo</button>
            <div style={{ width: 1, height: 20, background: '#2a2d36' }} />
          </>
        )}
        <button
          type="button"
          onClick={onTogglePreview}
          style={{
            background: isPreview ? '#4b5563' : '#2a2d36',
            border: isPreview ? '1px solid #6b7280' : '1px solid #3a3d46',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#ffffff',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isPreview ? <IconEyeOff size={16} stroke={1.8} aria-hidden="true" /> : <IconEye size={16} stroke={1.8} aria-hidden="true" />}
          <span>{isPreview ? 'Edit Mode' : 'Preview'}</span>
        </button>
        <button type="button" onClick={onExport} style={{ background: '#6366f1', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#ffffff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}><IconDownload size={16} stroke={1.8} aria-hidden="true" />Export</button>
      </div>
    </header>
  );
}
