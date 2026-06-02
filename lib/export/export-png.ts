import { snapdom } from '@zumer/snapdom';

export type ExportScale = 1 | 2 | 3;

export function exportFilename(projectName: string, scale: ExportScale): string {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'screenstyler'}@${scale}x.png`;
}

export async function exportPng(node: HTMLElement, scale: ExportScale = 2): Promise<Blob> {
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(
    Array.from(node.querySelectorAll('img')).map((img) => img.decode().catch(() => undefined)),
  );
  const style = document.createElement('style');
  style.textContent = '.hide-on-export { display: none !important; }';
  node.appendChild(style);
  try {
    const blob = await snapdom.toBlob(node, { type: 'png', scale, embedFonts: true });
    if (!blob || blob.size === 0) throw new Error('EXPORT_EMPTY');
    return blob;
  } finally {
    style.remove();
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Defer revoke: revoking synchronously after click() can cancel the download
  // in some browsers before it has started.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
