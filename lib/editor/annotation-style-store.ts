import { create } from 'zustand';
import type { ArrowVariant } from '@/lib/document/schema';

type AnnotationStyleState = {
  arrowColor: string;
  arrowVariant: ArrowVariant;
  setArrowColor: (color: string) => void;
  setArrowVariant: (variant: ArrowVariant) => void;
  reset: () => void;
};

const defaults = {
  arrowColor: '#ef4444',
  arrowVariant: 'solid' as ArrowVariant,
};

export const useAnnotationStyleStore = create<AnnotationStyleState>((set) => ({
  ...defaults,
  setArrowColor: (arrowColor) => set({ arrowColor }),
  setArrowVariant: (arrowVariant) => set({ arrowVariant }),
  reset: () => set(defaults),
}));

