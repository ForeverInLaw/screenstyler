import type { Point, Rect } from '@/lib/document/schema';

export type AlignmentGuide = { axis: 'x' | 'y'; position: number; start: number; end: number };

function nearestAlignment(moving: Rect, targets: readonly Rect[], axis: 'x' | 'y', tolerance: number) {
  const dimension = axis === 'x' ? 'w' : 'h';
  let nearest: { offset: number; position: number; target: Rect } | null = null;
  for (const target of targets) {
    for (const targetAnchor of [0, 0.5, 1]) {
      const position = target[axis] + target[dimension] * targetAnchor;
      for (const movingAnchor of [0, 0.5, 1]) {
        const offset = position - moving[axis] - moving[dimension] * movingAnchor;
        if (Math.abs(offset) <= tolerance && (!nearest || Math.abs(offset) < Math.abs(nearest.offset))) {
          nearest = { offset, position, target };
        }
      }
    }
  }
  return nearest;
}

/** Snap a translated selection's edges/centre to other images in each axis. */
export function alignScreenshotSelection(selection: Rect, targets: readonly Rect[], delta: Point, tolerance: Point) {
  const moving = { ...selection, x: selection.x + delta.x, y: selection.y + delta.y };
  const horizontal = nearestAlignment(moving, targets, 'x', tolerance.x);
  const vertical = nearestAlignment(moving, targets, 'y', tolerance.y);
  const aligned = { x: delta.x + (horizontal?.offset ?? 0), y: delta.y + (vertical?.offset ?? 0) };
  const guides: AlignmentGuide[] = [];
  if (horizontal) guides.push({
    axis: 'x', position: horizontal.position,
    start: Math.min(selection.y + aligned.y, horizontal.target.y),
    end: Math.max(selection.y + aligned.y + selection.h, horizontal.target.y + horizontal.target.h),
  });
  if (vertical) guides.push({
    axis: 'y', position: vertical.position,
    start: Math.min(selection.x + aligned.x, vertical.target.x),
    end: Math.max(selection.x + aligned.x + selection.w, vertical.target.x + vertical.target.w),
  });
  return { delta: aligned, guides };
}
