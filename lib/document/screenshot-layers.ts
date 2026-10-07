import type { ScreenshotItem } from './schema';

export type LayerDirection = 'forward' | 'backward';

/** Move each selected image past one unselected neighbour, retaining its order. */
export function moveScreenshotLayers(items: readonly ScreenshotItem[], ids: readonly string[], direction: LayerDirection) {
  const selected = new Set(ids);
  const list = [...items];
  const step = direction === 'forward' ? 1 : -1;
  let changed = false;
  for (let index = step === 1 ? list.length - 2 : 1; index >= 0 && index < list.length; index -= step) {
    const neighbour = index + step;
    if (selected.has(list[index].id) && !selected.has(list[neighbour].id)) {
      [list[index], list[neighbour]] = [list[neighbour], list[index]];
      changed = true;
    }
  }
  return changed ? list : items;
}
