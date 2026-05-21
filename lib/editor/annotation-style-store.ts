import { create } from 'zustand';
import type { ArrowVariant, BlurVariant } from '@/lib/document/schema';

type AnnotationStyleState = {
  arrowColor: string;
  arrowVariant: ArrowVariant;
  textFontFamily: string;
  textSize: number;
  highlightColor: string;
  highlightOpacity: number;
  blurVariant: BlurVariant;
  blurIntensity: number;
  setArrowColor: (color: string) => void;
  setArrowVariant: (variant: ArrowVariant) => void;
  setTextFontFamily: (fontFamily: string) => void;
  setTextSize: (size: number) => void;
  setHighlightColor: (color: string) => void;
  setHighlightOpacity: (opacity: number) => void;
  setBlurVariant: (variant: BlurVariant) => void;
  setBlurIntensity: (intensity: number) => void;
  reset: () => void;
};

const defaults = {
  arrowColor: '#ef4444',
  arrowVariant: 'solid' as ArrowVariant,
  textFontFamily: 'inter',
  textSize: 24,
  highlightColor: '#facc15',
  highlightOpacity: 0.4,
  blurVariant: 'soft' as BlurVariant,
  blurIntensity: 8,
};

export const useAnnotationStyleStore = create<AnnotationStyleState>((set) => ({
  ...defaults,
  setArrowColor: (arrowColor) => set({ arrowColor }),
  setArrowVariant: (arrowVariant) => set({ arrowVariant }),
  setTextFontFamily: (textFontFamily) => set({ textFontFamily }),
  setTextSize: (textSize) => set({ textSize }),
  setHighlightColor: (highlightColor) => set({ highlightColor }),
  setHighlightOpacity: (highlightOpacity) => set({ highlightOpacity }),
  setBlurVariant: (blurVariant) => set({ blurVariant }),
  setBlurIntensity: (blurIntensity) => set({ blurIntensity }),
  reset: () => set(defaults),
}));
