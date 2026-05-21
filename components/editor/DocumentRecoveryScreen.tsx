'use client';
import Link from 'next/link';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconFileDownload,
  IconSparkles,
} from '@tabler/icons-react';
import { downloadBlob } from '@/lib/export/export-png';

type Props = {
  id: string;
  rawJson: string;
  error: Error;
  onReset: () => void;
};

export function DocumentRecoveryScreen({ id, rawJson, error, onReset }: Props) {
  function handleDownload() {
    const blob = new Blob([rawJson], { type: 'application/json' });
    downloadBlob(blob, `corrupt-project-${id}.json`);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f1115',
        color: '#e5e7eb',
        padding: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          background: '#16181d',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <IconAlertTriangle size={36} stroke={1.8} color="#ef4444" style={{ display: 'block', marginBottom: '16px' }} aria-hidden="true" />
        <h1 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
          Document Corruption Detected
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: '14px', lineHeight: '1.5', opacity: 0.8 }}>
          The project document could not be loaded because the stored data is invalid or corrupted. You can download the raw data below to try and recover it.
        </p>

        {/* Technical details */}
        <div
          style={{
            background: '#0f1115',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            marginBottom: '24px',
            maxHeight: '120px',
            overflowY: 'auto',
            border: '1px solid #2a2d36',
          }}
        >
          <strong>Error Details:</strong>
          <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#f87171' }}>
            {error.message || String(error)}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={handleDownload}
            style={{
              width: '100%',
              padding: '12px',
              background: '#6366f1',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#4f46e5')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#6366f1')}
          >
            <IconFileDownload size={18} stroke={1.8} aria-hidden="true" />
            <span>Download Raw JSON Data</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#ef4444',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <IconSparkles size={18} stroke={1.8} aria-hidden="true" />
            <span>Reset Project to Blank State</span>
          </button>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textAlign: 'center',
              width: '100%',
              padding: '12px',
              background: '#2a2d36',
              border: '1px solid #3a3d46',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 'bold',
              textDecoration: 'none',
              fontSize: '14px',
              boxSizing: 'border-box',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#374151')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#2a2d36')}
          >
            <IconArrowLeft size={18} stroke={1.8} aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
