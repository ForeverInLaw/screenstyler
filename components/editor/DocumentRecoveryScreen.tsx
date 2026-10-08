'use client';
import Link from 'next/link';
import { IconAlertTriangle, IconArrowLeft, IconFileDownload } from '@tabler/icons-react';
import { downloadBlob } from '@/lib/export/export-png';
import { Button } from '@/components/ui/Button';
import { Brand } from '@/components/common/Brand';

type Props = { id: string; rawJson: string; error: Error; onReset: () => void };

export function DocumentRecoveryScreen({ id, rawJson, error, onReset }: Props) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-10">
      <div className="w-full max-w-lg">
        <Link href="/projects" className="mb-8 inline-block">
          <Brand />
        </Link>
        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <IconAlertTriangle size={32} stroke={1.5} className="mb-5 text-danger" aria-hidden="true" />
          <h1 className="text-2xl font-medium tracking-tight">This project needs recovery.</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            The saved document could not be read. Download a copy of the original data before resetting the
            canvas.
          </p>
          <details className="mt-6 rounded-lg bg-well p-3 text-xs text-secondary">
            <summary>Error details</summary>
            <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-danger">
              {error.message}
            </pre>
          </details>
          <div className="mt-6 grid gap-3">
            <Button
              variant="primary"
              onClick={() =>
                downloadBlob(new Blob([rawJson], { type: 'application/json' }), `corrupt-project-${id}.json`)
              }
            >
              <IconFileDownload size={17} />
              Download Raw JSON Data
            </Button>
            <Button variant="danger" onClick={onReset}>
              Reset Project to Blank State
            </Button>
            <Link href="/projects" className="button button-ghost">
              <IconArrowLeft size={16} />
              Back to projects
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
