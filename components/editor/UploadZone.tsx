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
  const addScreenshot = useDocumentStore((s) => s.addScreenshot);
  const { data } = useSession();
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    let firstError: string | null = null;
    for (const file of files) {
      const result = validateImageFile(file);
      if (!result.ok) {
        firstError = MESSAGES[result.reason];
        continue;
      }
      try {
        const img = await ingestImageFile(file, data?.user?.id ?? null);
        addScreenshot(img);
      } catch {
        firstError = 'Could not read that image. It may be corrupt — try another file.';
      }
    }
    setError(firstError);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) void handleFiles(files);
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
      <p>Drop screenshots here, or</p>
      <label style={{ cursor: 'pointer', textDecoration: 'underline' }}>
        choose files
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) void handleFiles(files);
          }}
        />
      </label>
      {error && <p style={{ color: '#f87171', marginTop: 12 }}>{error}</p>}
    </div>
  );
}
