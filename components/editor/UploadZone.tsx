'use client';
import { useRef, useState } from 'react';
import { IconPhotoPlus, IconUpload } from '@tabler/icons-react';
import { useSession } from '@/lib/auth/client';
import { useDocumentStore } from '@/lib/document/store';
import { ingestImageFile, validateImageFile } from '@/lib/upload/load-image';
import { Button } from '@/components/ui/Button';

const MESSAGES: Record<string, string> = {
  UNSUPPORTED_TYPE: 'Use a PNG, JPG, or WebP image.',
  TOO_LARGE: 'Image is larger than 25 MB.',
};

export function UploadZone() {
  const addScreenshot = useDocumentStore((s) => s.addScreenshot);
  const { data } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFiles(files: File[]) {
    setIsLoading(true);
    let firstError: string | null = null;
    for (const file of files) {
      const result = validateImageFile(file);
      if (!result.ok) {
        firstError = MESSAGES[result.reason];
        continue;
      }
      try {
        addScreenshot(await ingestImageFile(file, data?.user?.id ?? null));
      } catch {
        firstError = 'Could not read that image. Try another file.';
      }
    }
    setError(firstError);
    setIsLoading(false);
  }

  return (
    <div
      className="m-auto w-full max-w-lg px-6 py-8 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!isLoading) void handleFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="crop-corners mx-auto mb-6 grid size-24 place-items-center text-accent sm:size-32">
        <IconPhotoPlus size={48} stroke={1} aria-hidden="true" />
      </div>
      <p className="eyebrow mb-3">YOUR NEXT PRODUCT SHOT</p>
      <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Start with a screenshot.</h1>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-secondary">
        Drop screenshots here, or paste an image straight onto the canvas.
      </p>
      <Button
        variant="primary"
        className="mt-6"
        disabled={isLoading}
        onClick={() => fileRef.current?.click()}
      >
        <IconUpload size={17} />
        {isLoading ? 'Adding images...' : 'Choose files'}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) void handleFiles(files);
          e.target.value = '';
        }}
      />
      <p className="mt-4 font-mono text-[10px] text-tertiary">PNG, JPG, WEBP · UP TO 25 MB</p>
      {error && (
        <p role="alert" className="notice notice-error mt-4">
          {error}
        </p>
      )}
    </div>
  );
}
