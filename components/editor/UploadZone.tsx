'use client';
import { useState } from 'react';
import { useSession } from '@/lib/auth/client';
import { useDocumentStore } from '@/lib/document/store';
import { ingestImageFile, validateImageFile } from '@/lib/upload/load-image';

const MESSAGES: Record<string, string> = {
  UNSUPPORTED_TYPE: 'Use a PNG, JPG, or WebP image.',
  TOO_LARGE: 'Image is larger than 25 MB.',
};

export function UploadZone() {
  const setImage = useDocumentStore((s) => s.setImage);
  const { data } = useSession();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const result = validateImageFile(file);
    if (!result.ok) {
      setError(MESSAGES[result.reason]);
      return;
    }
    setError(null);
    try {
      setImage(await ingestImageFile(file, data?.user?.id ?? null));
    } catch {
      setError('Could not read that image. It may be corrupt — try another file.');
    }
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
      style={{
        margin: 'auto',
        padding: 48,
        border: '2px dashed #3a3d46',
        borderRadius: 16,
        textAlign: 'center',
        color: '#e5e7eb',
      }}
    >
      <p>Drop a screenshot here, or</p>
      <label style={{ cursor: 'pointer', textDecoration: 'underline' }}>
        choose a file
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>
      {error && <p style={{ color: '#f87171', marginTop: 12 }}>{error}</p>}
    </div>
  );
}
