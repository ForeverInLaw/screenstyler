import type { ArrowVariant } from '@/lib/document/schema';

export const defaultArrowVariant: ArrowVariant = 'solid';

export const arrowColors = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#ffffff'];

export const arrowVariants: { id: ArrowVariant; label: string }[] = [
  { id: 'solid', label: 'Solid arrow' },
  { id: 'dashed', label: 'Dashed arrow' },
  { id: 'double', label: 'Double arrow' },
  { id: 'dot', label: 'Dot tail arrow' },
];

export function getArrowVariant(variant?: ArrowVariant): ArrowVariant {
  return variant ?? defaultArrowVariant;
}

export function arrowStrokeDasharray(variant?: ArrowVariant) {
  return getArrowVariant(variant) === 'dashed' ? '12 10' : undefined;
}

