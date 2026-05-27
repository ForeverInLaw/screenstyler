'use client';
import { useState, useRef, type MouseEvent, useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import type { Annotation, Point, Rect } from '@/lib/document/schema';
import { arrowStrokeDasharray, getArrowVariant } from '@/lib/annotations/arrows';
import { blurOverlayStyle } from '@/lib/annotations/blurs';
import { getTextFontFamily } from '@/lib/annotations/text';
import { useAnnotationStyleStore } from '@/lib/editor/annotation-style-store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { withAlpha } from '@/lib/style/css';

type Props = {
  annotations: Annotation[];
  activeTool: 'select' | 'arrow' | 'text' | 'highlight' | 'blur';
  onChangeTool?: (tool: 'select' | 'arrow' | 'text' | 'highlight' | 'blur') => void;
  canvasWidth: number;
  canvasHeight: number;
  onAddAnnotation: (a: Annotation) => void;
  onRemoveAnnotation: (id: string) => void;
  isPreview?: boolean;
};

export function AnnotationsLayer({
  annotations,
  activeTool,
  onChangeTool,
  canvasWidth,
  canvasHeight,
  onAddAnnotation,
  onRemoveAnnotation,
  isPreview = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedAnnotationId = useEditorUiStore((s) => s.selectedAnnotationId);
  const setSelectedAnnotationId = useEditorUiStore((s) => s.setSelectedAnnotationId);

  function handleSelectAnnotation(e: MouseEvent, id: string, type: 'arrow' | 'text' | 'highlight' | 'blur') {
    if (isPreview) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedAnnotationId(id);
    onChangeTool?.(type);
  }
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState<Annotation | null>(null);
  const [textPos, setTextPos] = useState<Point | null>(null);
  const [textVal, setTextVal] = useState('');
  const arrowColor = useAnnotationStyleStore((s) => s.arrowColor);
  const arrowVariant = useAnnotationStyleStore((s) => s.arrowVariant);
  const textFontFamily = useAnnotationStyleStore((s) => s.textFontFamily);
  const textSize = useAnnotationStyleStore((s) => s.textSize);
  const highlightColor = useAnnotationStyleStore((s) => s.highlightColor);
  const highlightOpacity = useAnnotationStyleStore((s) => s.highlightOpacity);
  const blurVariant = useAnnotationStyleStore((s) => s.blurVariant);
  const blurIntensity = useAnnotationStyleStore((s) => s.blurIntensity);

  // Convert screen coordinates to canvas-relative coordinates.
  // Projects coordinates using browser's offsetX/offsetY on the transformed container.
  function getCanvasCoords(e: MouseEvent<HTMLDivElement>): Point {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const width = containerRef.current.clientWidth || rect.width || canvasWidth;
    const height = containerRef.current.clientHeight || rect.height || canvasHeight;

    let localX = e.nativeEvent.offsetX;
    let localY = e.nativeEvent.offsetY;

    // Fallback to bounding rect projection if nativeEvent.offsetX is missing (jsdom tests) or if target is a child
    if (typeof localX !== 'number' || e.target !== e.currentTarget) {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      localX = (clickX / (rect.width || 1)) * width;
      localY = (clickY / (rect.height || 1)) * height;
    }

    const x = (localX / width) * canvasWidth;
    const y = (localY / height) * canvasHeight;
    return { x: Math.round(x), y: Math.round(y) };
  }

  function handleMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (activeTool === 'select') return;
    e.preventDefault();

    const pt = getCanvasCoords(e);
    if (activeTool === 'text') {
      setTextPos(pt);
      setTextVal('');
      return;
    }

    setIsDrawing(true);
    setStartPoint(pt);

    const id = `temp-${Date.now()}`;
    if (activeTool === 'arrow') {
      setTempAnnotation({
        id,
        type: 'arrow',
        from: pt,
        to: pt,
        color: arrowColor,
        thickness: 4,
        variant: arrowVariant,
      });
    } else if (activeTool === 'highlight') {
      setTempAnnotation({
        id,
        type: 'highlight',
        rect: { x: pt.x, y: pt.y, w: 0, h: 0 },
        color: withAlpha(highlightColor, highlightOpacity),
      });
    } else if (activeTool === 'blur') {
      setTempAnnotation({
        id,
        type: 'blur',
        rect: { x: pt.x, y: pt.y, w: 0, h: 0 },
        intensity: blurIntensity,
        variant: blurVariant,
      });
    }
  }

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!isDrawing || !startPoint || !tempAnnotation) return;
    const pt = getCanvasCoords(e);

    if (tempAnnotation.type === 'arrow') {
      setTempAnnotation({ ...tempAnnotation, to: pt });
    } else if (tempAnnotation.type === 'highlight' || tempAnnotation.type === 'blur') {
      const newRect: Rect = {
        x: Math.min(startPoint.x, pt.x),
        y: Math.min(startPoint.y, pt.y),
        w: Math.abs(startPoint.x - pt.x),
        h: Math.abs(startPoint.y - pt.y),
      };
      setTempAnnotation({ ...tempAnnotation, rect: newRect });
    }
  }

  function handleMouseUp() {
    if (!isDrawing || !tempAnnotation) return;
    setIsDrawing(false);
    setStartPoint(null);
    setTempAnnotation(null);

    // Filter out zero-size shapes
    if (tempAnnotation.type === 'highlight' || tempAnnotation.type === 'blur') {
      if (tempAnnotation.rect.w < 5 || tempAnnotation.rect.h < 5) return;
    }
    if (tempAnnotation.type === 'arrow') {
      const dx = tempAnnotation.to.x - tempAnnotation.from.x;
      const dy = tempAnnotation.to.y - tempAnnotation.from.y;
      if (Math.sqrt(dx * dx + dy * dy) < 5) return;
    }

    onAddAnnotation({ ...tempAnnotation, id: crypto.randomUUID() });
  }

  function handleTextSubmit() {
    if (textPos && textVal.trim()) {
      onAddAnnotation({
        id: crypto.randomUUID(),
        type: 'text',
        pos: textPos,
        text: textVal,
        fontSize: textSize,
        fontFamily: textFontFamily,
        color: '#ef4444',
      });
    }
    setTextPos(null);
    setTextVal('');
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setTextPos(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // The layer captures mouse events for drawing when a tool is active.
  // In select mode it is transparent to clicks (pointerEvents: none)
  // EXCEPT for the delete buttons which have their own pointerEvents: auto.
  const isDrawMode = !isPreview && activeTool !== 'select';

  return (
    <div
      ref={containerRef}
      data-testid="annotations-layer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        cursor: isDrawMode ? 'crosshair' : 'default',
        pointerEvents: isDrawMode ? 'auto' : 'none',
      }}
    >
      {/* SVG Layer for Arrows / Highlights / Texts */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      >
        <defs>
          {annotations
            .concat(tempAnnotation ? [tempAnnotation] : [])
            .filter((a): a is Extract<Annotation, { type: 'arrow' }> => a.type === 'arrow')
            .map((arrow) => {
              const variant = getArrowVariant(arrow.variant);
              return (
                <g key={`marker-${arrow.id}`}>
                  <marker
                    id={`arrow-head-${arrow.id}`}
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill={arrow.color} />
                  </marker>
                  {variant === 'double' && (
                    <marker
                      id={`arrow-tail-${arrow.id}`}
                      markerWidth="8"
                      markerHeight="6"
                      refX="1"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <polygon points="8 0, 0 3, 8 6" fill={arrow.color} />
                    </marker>
                  )}
                  {variant === 'dot' && (
                    <marker
                      id={`arrow-tail-${arrow.id}`}
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <circle cx="3" cy="3" r="2.2" fill={arrow.color} />
                    </marker>
                  )}
                </g>
              );
            })}
        </defs>

        {/* Highlights */}
        {annotations
          .concat(tempAnnotation && tempAnnotation.type === 'highlight' ? [tempAnnotation] : [])
          .filter((a): a is Extract<Annotation, { type: 'highlight' }> => a.type === 'highlight')
          .map((hl) => {
            const isSel = selectedAnnotationId === hl.id;
            const isTemp = hl.id.startsWith('temp-');
            return (
              <g key={hl.id}>
                <rect x={hl.rect.x} y={hl.rect.y} width={hl.rect.w} height={hl.rect.h} fill={hl.color} rx="4"
                  style={{ cursor: isPreview ? 'default' : (isTemp ? 'crosshair' : 'pointer'), pointerEvents: isPreview ? 'none' : 'auto' }}
                  onMouseDown={(e) => !isTemp && handleSelectAnnotation(e, hl.id, 'highlight')} />
                {!isPreview && isSel && (
                  <rect x={hl.rect.x - 2} y={hl.rect.y - 2} width={hl.rect.w + 4} height={hl.rect.h + 4} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" rx={6} style={{ pointerEvents: 'none' }} />
                )}
              </g>
            );
          })}

        {/* Arrows */}
        {annotations
          .concat(tempAnnotation && tempAnnotation.type === 'arrow' ? [tempAnnotation] : [])
          .filter((a): a is Extract<Annotation, { type: 'arrow' }> => a.type === 'arrow')
          .map((arrow) => {
            const variant = getArrowVariant(arrow.variant);
            const isSel = selectedAnnotationId === arrow.id;
            const isTemp = arrow.id.startsWith('temp-');
            return (
              <g key={arrow.id}>
                {!isPreview && !isTemp && (
                  <line x1={arrow.from.x} y1={arrow.from.y} x2={arrow.to.x} y2={arrow.to.y} stroke="transparent" strokeWidth={24} strokeLinecap="round" style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    onMouseDown={(e) => handleSelectAnnotation(e, arrow.id, 'arrow')} />
                )}
                <line x1={arrow.from.x} y1={arrow.from.y} x2={arrow.to.x} y2={arrow.to.y} stroke={arrow.color} strokeWidth={arrow.thickness} strokeDasharray={arrowStrokeDasharray(variant)} strokeLinecap="round"
                  markerStart={variant === 'double' || variant === 'dot' ? `url(#arrow-tail-${arrow.id})` : undefined} markerEnd={`url(#arrow-head-${arrow.id})`}
                  style={{ cursor: isPreview ? 'default' : (isTemp ? 'crosshair' : 'pointer'), pointerEvents: isPreview ? 'none' : 'stroke' }}
                  onMouseDown={(e) => !isTemp && handleSelectAnnotation(e, arrow.id, 'arrow')} />
                {!isPreview && isSel && (
                  <>
                    <circle cx={arrow.from.x} cy={arrow.from.y} r={5} fill="#ffffff" stroke="#3b82f6" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
                    <circle cx={arrow.to.x} cy={arrow.to.y} r={5} fill="#ffffff" stroke="#3b82f6" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
                  </>
                )}
              </g>
            );
          })}

        {/* Texts */}
        {annotations
          .filter((a): a is Extract<Annotation, { type: 'text' }> => a.type === 'text')
          .map((t) => {
            const isSel = selectedAnnotationId === t.id;
            const w = t.text.length * t.fontSize * 0.6;
            const h = t.fontSize * 1.2;
            return (
              <g key={t.id}>
                {!isPreview && (
                  <rect x={t.pos.x - 4} y={t.pos.y - 2} width={w + 8} height={h + 4} fill="transparent" style={{ cursor: 'pointer', pointerEvents: 'fill' }}
                    onMouseDown={(e) => handleSelectAnnotation(e, t.id, 'text')} />
                )}
                <text x={t.pos.x} y={t.pos.y} fill={t.color} fontSize={t.fontSize} fontWeight="bold" fontFamily={getTextFontFamily(t.fontFamily)} textAnchor="start" dominantBaseline="hanging"
                  style={{ cursor: isPreview ? 'default' : 'pointer', pointerEvents: isPreview ? 'none' : 'auto', userSelect: 'none' }}
                  onMouseDown={(e) => handleSelectAnnotation(e, t.id, 'text')}
                >
                  {t.text}
                </text>
                {!isPreview && isSel && (
                  <rect x={t.pos.x - 4} y={t.pos.y - 2} width={w + 8} height={h + 4} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" rx={2} style={{ pointerEvents: 'none' }} />
                )}
              </g>
            );
          })}
      </svg>

      {/* HTML Layer for Blurs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {annotations
          .concat(tempAnnotation && tempAnnotation.type === 'blur' ? [tempAnnotation] : [])
          .filter((a): a is Extract<Annotation, { type: 'blur' }> => a.type === 'blur')
          .map((b) => {
            const isSel = selectedAnnotationId === b.id;
            const isTemp = b.id.startsWith('temp-');
            return (
              <div key={b.id} onMouseDown={(e) => !isTemp && handleSelectAnnotation(e, b.id, 'blur')}
                style={{
                  position: 'absolute',
                  left: `${(b.rect.x / canvasWidth) * 100}%`,
                  top: `${(b.rect.y / canvasHeight) * 100}%`,
                  width: `${(b.rect.w / canvasWidth) * 100}%`,
                  height: `${(b.rect.h / canvasHeight) * 100}%`,
                  ...blurOverlayStyle(b.variant, b.intensity),
                  borderRadius: '4px',
                  cursor: isPreview ? 'default' : (isTemp ? 'crosshair' : 'pointer'),
                  pointerEvents: isPreview ? 'none' : 'auto',
                }}
              >
                {!isPreview && isSel && (
                  <div style={{ position: 'absolute', inset: '-2px', border: '1.5px dashed #3b82f6', borderRadius: '6px', pointerEvents: 'none' }} />
                )}
              </div>
            );
          })}
      </div>

      {/* Delete buttons — always visible when annotations exist */}
      {!isPreview && (
        <div className="hide-on-export" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {annotations.map((a) => {
            let left = 0; let top = 0;
            if (a.type === 'arrow') {
              left = (a.to.x / canvasWidth) * 100; top = (a.to.y / canvasHeight) * 100;
            } else if (a.type === 'text') {
              left = (a.pos.x / canvasWidth) * 100; top = (a.pos.y / canvasHeight) * 100;
            } else {
              left = ((a.rect.x + a.rect.w) / canvasWidth) * 100; top = (a.rect.y / canvasHeight) * 100;
            }
            return (
              <button key={`delete-${a.id}`} type="button"
                onMouseDown={(e) => {
                  e.stopPropagation(); e.preventDefault();
                  onRemoveAnnotation(a.id);
                  if (selectedAnnotationId === a.id) setSelectedAnnotationId(null);
                }}
                style={{
                  position: 'absolute', left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)',
                  width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', border: '2px solid #fff',
                  color: '#ffffff', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', zIndex: 30, boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  pointerEvents: 'auto',
                }}
              >
                <IconX size={12} stroke={2.5} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}

      {/* Floating text input */}
      {textPos && !isPreview && (
        <div
          className="hide-on-export"
          style={{
            position: 'absolute',
            left: `${(textPos.x / canvasWidth) * 100}%`,
            top: `${(textPos.y / canvasHeight) * 100}%`,
            zIndex: 40,
          }}
        >
          <input
            autoFocus
            type="text"
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit();
            }}
            placeholder="Type and press Enter"
            style={{
              background: '#1f2937',
              border: '1px solid #ef4444',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '16px',
              outline: 'none',
              width: '200px',
            }}
          />
        </div>
      )}
    </div>
  );
}
