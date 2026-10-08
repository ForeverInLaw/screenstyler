'use client';
import { useLayoutEffect, useId, useRef, type ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';
import { Button } from './Button';

type Props = { title: string; description?: string; onDismiss: () => void; children: ReactNode };

/** The native dialog owns focus trapping, Escape, and background inertness. */
export function Dialog({ title, description, onDismiss, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onDismiss();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-foreground backdrop:bg-scrim"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Screenstyler studio</p>
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-secondary">
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" iconOnly onClick={onDismiss} aria-label="Close dialog">
          <IconX size={18} aria-hidden="true" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
