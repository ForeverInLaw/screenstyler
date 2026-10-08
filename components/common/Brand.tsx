import { IconCrop } from '@tabler/icons-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
        <IconCrop size={22} stroke={1.6} aria-hidden="true" />
      </span>
      <span className={compact ? 'hidden sm:inline' : ''}>
        screenstyler<span className="text-accent">.</span>
      </span>
    </span>
  );
}
