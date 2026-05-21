export function imageFileFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;

  for (const item of Array.from(data.items)) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (file) return file;
  }

  return Array.from(data.files).find((file) => file.type.startsWith('image/')) ?? null;
}

export function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.closest('input, textarea, select, [contenteditable]') !== null;
}
