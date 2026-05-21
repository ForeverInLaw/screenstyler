'use client';
import Link from 'next/link';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowLeft,
  IconArrowUpRight,
  IconBlur,
  IconClearAll,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconHighlight,
  IconMouse,
  IconTypography,
  type Icon,
} from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';

type Tool = 'select' | 'arrow' | 'text' | 'highlight' | 'blur';

type Props = {
  projectName: string;
  onExport: () => void;
  activeTool?: Tool;
  onChangeTool?: (tool: Tool) => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
};

export function Toolbar({
  projectName,
  onExport,
  activeTool = 'select',
  onChangeTool = () => {},
  isPreview = false,
  onTogglePreview = () => {},
}: Props) {
  const undo = () => useDocumentStore.temporal.getState().undo();
  const redo = () => useDocumentStore.temporal.getState().redo();
  const setAnnotations = useDocumentStore((s) => s.setAnnotations);

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
      <span style={{ opacity: 0.7, fontSize: '14px' }}>{projectName}</span>

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
