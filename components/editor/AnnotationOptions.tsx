'use client';
import { useEffect } from 'react';
import {
  IconArrowRight,
  IconArrowRightDashed,
  IconArrowsLeftRight,
  IconCircleDot,
  type Icon,
} from '@tabler/icons-react';
import { useDocumentStore } from '@/lib/document/store';
import { arrowColors, arrowVariants } from '@/lib/annotations/arrows';
import { blurVariants } from '@/lib/annotations/blurs';
import { highlightColors } from '@/lib/annotations/highlights';
import { textFontOptions } from '@/lib/annotations/text';
import type { ArrowVariant, BlurVariant } from '@/lib/document/schema';
import { useAnnotationStyleStore } from '@/lib/editor/annotation-style-store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { withAlpha } from '@/lib/style/css';
import { Select } from '@/components/ui/Select';
import { DocumentSlider } from '@/components/ui/DocumentSlider';
import { DocumentColorPicker } from '@/components/ui/DocumentColorPicker';

import type { EditorTool } from '@/lib/editor/workspace-store';

const arrowVariantIcons: Record<ArrowVariant, Icon> = {
  solid: IconArrowRight,
  dashed: IconArrowRightDashed,
  double: IconArrowsLeftRight,
  dot: IconCircleDot,
};

export function AnnotationOptions({ activeTool }: { activeTool: EditorTool }) {
  const selectedAnnotationId = useEditorUiStore((s) => s.selectedAnnotationId);
  const annotations = useDocumentStore((s) => s.doc.annotations);
  const updateAnnotation = useDocumentStore((s) => s.updateAnnotation);

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId
    && (activeTool === 'select' || a.type === activeTool));
  const effectiveTool = selectedAnnotation ? selectedAnnotation.type : activeTool;

  const arrowColor = useAnnotationStyleStore((s) => s.arrowColor);
  const arrowVariant = useAnnotationStyleStore((s) => s.arrowVariant);
  const setArrowColor = useAnnotationStyleStore((s) => s.setArrowColor);
  const setArrowVariant = useAnnotationStyleStore((s) => s.setArrowVariant);
  const textFontFamily = useAnnotationStyleStore((s) => s.textFontFamily);
  const textSize = useAnnotationStyleStore((s) => s.textSize);
  const highlightColor = useAnnotationStyleStore((s) => s.highlightColor);
  const highlightOpacity = useAnnotationStyleStore((s) => s.highlightOpacity);
  const blurVariant = useAnnotationStyleStore((s) => s.blurVariant);
  const blurIntensity = useAnnotationStyleStore((s) => s.blurIntensity);
  const setTextFontFamily = useAnnotationStyleStore((s) => s.setTextFontFamily);
  const setTextSize = useAnnotationStyleStore((s) => s.setTextSize);
  const setHighlightColor = useAnnotationStyleStore((s) => s.setHighlightColor);
  const setHighlightOpacity = useAnnotationStyleStore((s) => s.setHighlightOpacity);
  const setBlurVariant = useAnnotationStyleStore((s) => s.setBlurVariant);
  const setBlurIntensity = useAnnotationStyleStore((s) => s.setBlurIntensity);

  function parseRgba(color: string): { hex: string; opacity: number } {
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const opacity = match[4] !== undefined ? parseFloat(match[4]) : 1;
        const toHex = (c: number) => {
          const hex = c.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };
        return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, opacity };
      }
    }
    return { hex: color, opacity: 1 };
  }

  useEffect(() => {
    if (!selectedAnnotation) return;
    if (selectedAnnotation.type === 'arrow') {
      setArrowColor(selectedAnnotation.color);
      setArrowVariant(selectedAnnotation.variant || 'solid');
    } else if (selectedAnnotation.type === 'text') {
      setTextFontFamily(selectedAnnotation.fontFamily || 'inter');
      setTextSize(selectedAnnotation.fontSize);
    } else if (selectedAnnotation.type === 'highlight') {
      const parsed = parseRgba(selectedAnnotation.color);
      setHighlightColor(parsed.hex);
      setHighlightOpacity(parsed.opacity);
    } else if (selectedAnnotation.type === 'blur') {
      setBlurVariant(selectedAnnotation.variant || 'soft');
      setBlurIntensity(selectedAnnotation.intensity);
    }
  }, [
    selectedAnnotation,
    setArrowColor,
    setArrowVariant,
    setTextFontFamily,
    setTextSize,
    setHighlightColor,
    setHighlightOpacity,
    setBlurVariant,
    setBlurIntensity,
  ]);

  function handleArrowVariantChange(variantId: ArrowVariant) {
    setArrowVariant(variantId);
    if (selectedAnnotation?.type === 'arrow') updateAnnotation(selectedAnnotation.id, { variant: variantId });
  }
  function handleArrowColorChange(color: string) {
    setArrowColor(color);
    if (selectedAnnotation?.type === 'arrow') updateAnnotation(selectedAnnotation.id, { color });
  }
  function handleTextFontFamilyChange(fontFamily: string) {
    setTextFontFamily(fontFamily);
    if (selectedAnnotation?.type === 'text') updateAnnotation(selectedAnnotation.id, { fontFamily });
  }
  function handleTextSizeChange(size: number) {
    setTextSize(size);
    if (selectedAnnotation?.type === 'text') updateAnnotation(selectedAnnotation.id, { fontSize: size });
  }
  function handleHighlightColorChange(color: string) {
    setHighlightColor(color);
    if (selectedAnnotation?.type === 'highlight') {
      updateAnnotation(selectedAnnotation.id, { color: withAlpha(color, highlightOpacity) });
    }
  }
  function handleHighlightOpacityChange(opacity: number) {
    setHighlightOpacity(opacity);
    if (selectedAnnotation?.type === 'highlight') {
      updateAnnotation(selectedAnnotation.id, { color: withAlpha(highlightColor, opacity) });
    }
  }
  function handleBlurVariantChange(variant: BlurVariant) {
    setBlurVariant(variant);
    if (selectedAnnotation?.type === 'blur') updateAnnotation(selectedAnnotation.id, { variant });
  }
  function handleBlurIntensityChange(intensity: number) {
    setBlurIntensity(intensity);
    if (selectedAnnotation?.type === 'blur') updateAnnotation(selectedAnnotation.id, { intensity });
  }

  if (effectiveTool === 'select') return null;
  return (
    <div className="flex min-h-14 items-center justify-center border-t border-border bg-background px-4 py-2">
      {effectiveTool === 'arrow' && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Arrow options">
          {arrowVariants.map((variant) => {
            const VariantIcon = arrowVariantIcons[variant.id];
            const isActive = arrowVariant === variant.id;
            return (
              <button
                className="button button-icon button-ghost"
                aria-pressed={isActive}
                key={variant.id}
                type="button"
                aria-label={variant.label}
                title={variant.label}
                onClick={() => handleArrowVariantChange(variant.id)}
              >
                <VariantIcon size={16} stroke={1.8} aria-hidden="true" />
              </button>
            );
          })}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          {arrowColors.map((color) => (
            <button
              className="size-10 shrink-0 rounded-full border-8 border-background ring-1 ring-border aria-pressed:ring-2 aria-pressed:ring-accent"
              style={{ backgroundColor: color }}
              aria-pressed={arrowColor === color}
              key={color}
              type="button"
              aria-label={`Arrow color ${color}`}
              title={color}
              onClick={() => handleArrowColorChange(color)}
            />
          ))}
          <DocumentColorPicker
            label="Custom arrow color"
            value={arrowColor}
            onChange={handleArrowColorChange}
            hideValue
          />
        </div>
      )}

      {effectiveTool === 'text' && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Text options">
          <Select
            className="w-40"
            label="Text font"
            hideLabel
            value={textFontFamily}
            onValueChange={handleTextFontFamilyChange}
            options={textFontOptions.map((font) => ({ value: font.id, label: font.label }))}
          />
          <DocumentSlider
            label="Text size"
            compact
            min={14}
            max={72}
            step={2}
            value={textSize}
            suffix=" px"
            onChange={handleTextSizeChange}
          />
        </div>
      )}

      {effectiveTool === 'highlight' && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Highlight options">
          {highlightColors.map((color) => (
            <button
              className="size-10 shrink-0 rounded-full border-8 border-background ring-1 ring-border aria-pressed:ring-2 aria-pressed:ring-accent"
              style={{ backgroundColor: color }}
              aria-pressed={highlightColor === color}
              key={color}
              type="button"
              aria-label={`Highlight color ${color}`}
              title={color}
              onClick={() => handleHighlightColorChange(color)}
            />
          ))}
          <DocumentColorPicker
            label="Custom highlight color"
            value={highlightColor}
            onChange={handleHighlightColorChange}
            hideValue
          />
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <DocumentSlider
            label="Highlight opacity"
            compact
            min={10}
            max={90}
            step={5}
            value={Math.round(highlightOpacity * 100)}
            suffix="%"
            onChange={(opacity) => handleHighlightOpacityChange(opacity / 100)}
          />
        </div>
      )}

      {effectiveTool === 'blur' && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Blur options">
          <Select
            className="w-40"
            label="Blur type"
            hideLabel
            value={blurVariant}
            onValueChange={handleBlurVariantChange}
            options={blurVariants.map((variant) => ({ value: variant.id, label: variant.label }))}
          />
          <DocumentSlider
            label="Blur intensity"
            compact
            min={2}
            max={28}
            step={1}
            value={blurIntensity}
            suffix=" px"
            onChange={handleBlurIntensityChange}
          />
        </div>
      )}
    </div>
  );
}
