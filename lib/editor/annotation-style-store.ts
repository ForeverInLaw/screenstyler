import { create } from 'zustand';
import type { ArrowVariant } from '@/lib/document/schema';

type AnnotationStyleState = {
  arrowColor: string;
  arrowVariant: ArrowVariant;
  textFontFamily: string;
  textSize: number;
  setArrowColor: (color: string) => void;
  setArrowVariant: (variant: ArrowVariant) => void;
  setTextFontFamily: (fontFamily: string) => void;
  setTextSize: (size: number) => void;
  reset: () => void;
};

const defaults = {
  arrowColor: '#ef4444',
  arrowVariant: 'solid' as ArrowVariant,
  textFontFamily: 'inter',
  textSize: 24,
};

export const useAnnotationStyleStore = create<AnnotationStyleState>((set) => ({
  ...defaults,
  setArrowColor: (arrowColor) => set({ arrowColor }),
  setArrowVariant: (arrowVariant) => set({ arrowVariant }),
  setTextFontFamily: (textFontFamily) => set({ textFontFamily }),
  setTextSize: (textSize) => set({ textSize }),
  reset: () => set(defaults),
}));
