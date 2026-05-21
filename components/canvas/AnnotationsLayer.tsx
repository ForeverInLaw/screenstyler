'use client';
import { useState, useRef, type MouseEvent, useEffect } from 'react';
import type { Annotation, Point, Rect } from '@/lib/document/schema';

type Props = {
  annotations: Annotation[];
  activeTool: 'select' | 'arrow' | 'text' | 'highlight' | 'blur';
  canvasWidth: number;
  canvasHeight: number;
  onAddAnnotation: (a: Annotation) => void;
  onRemoveAnnotation: (id: string) => void;
  isPreview?: boolean;
};

export function AnnotationsLayer({
  annotations,
  activeTool,
  canvasWidth,
  canvasHeight,
  onAddAnnotation,
  onRemoveAnnotation,
  isPreview = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState<Annotation | null>(null);
  const [textPos, setTextPos] = useState<Point | null>(null);
  const [textVal, setTextVal] = useState('');

  // Convert screen coordinates to canvas-relative coordinates.
  // The container fills the entire DocumentFrame (inset: 0), so we can
  // map pixel offsets directly to the canvas coordinate space.
  function getCanvasCoords(e: MouseEvent<HTMLDivElement>): Point {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasWidth;
    const y = ((e.clientY - rect.top) / rect.height) * canvasHeight;
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
        color: '#ef4444',
        thickness: 4,
      });
    } else if (activeTool === 'highlight') {
      setTempAnnotation({
        id,
        type: 'highlight',
        rect: { x: pt.x, y: pt.y, w: 0, h: 0 },
        color: 'rgba(234, 179, 8, 0.4)',
      });
    } else if (activeTool === 'blur') {
      setTempAnnotation({
        id,
        type: 'blur',
        rect: { x: pt.x, y: pt.y, w: 0, h: 0 },
        intensity: 8,
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
        fontSize: 24,
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
            .map((arrow) => (
              <marker
                key={`marker-${arrow.id}`}
                id={`arrow-${arrow.id}`}
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 8 3, 0 6" fill={arrow.color} />
              </marker>
            ))}
        </defs>

        {/* Highlights */}
        {annotations
          .concat(tempAnnotation && tempAnnotation.type === 'highlight' ? [tempAnnotation] : [])
          .filter((a): a is Extract<Annotation, { type: 'highlight' }> => a.type === 'highlight')
          .map((hl) => (
            <rect
              key={hl.id}
              x={hl.rect.x}
              y={hl.rect.y}
              width={hl.rect.w}
              height={hl.rect.h}
              fill={hl.color}
              rx="4"
            />
          ))}

        {/* Arrows */}
        {annotations
          .concat(tempAnnotation && tempAnnotation.type === 'arrow' ? [tempAnnotation] : [])
          .filter((a): a is Extract<Annotation, { type: 'arrow' }> => a.type === 'arrow')
          .map((arrow) => (
            <line
              key={arrow.id}
              x1={arrow.from.x}
              y1={arrow.from.y}
              x2={arrow.to.x}
              y2={arrow.to.y}
              stroke={arrow.color}
              strokeWidth={arrow.thickness}
              markerEnd={`url(#arrow-${arrow.id})`}
            />
          ))}

        {/* Texts */}
        {annotations
          .filter((a): a is Extract<Annotation, { type: 'text' }> => a.type === 'text')
          .map((t) => (
            <text
              key={t.id}
              x={t.pos.x}
              y={t.pos.y}
              fill={t.color}
              fontSize={t.fontSize}
              fontWeight="bold"
              fontFamily="sans-serif"
              textAnchor="start"
              dominantBaseline="hanging"
            >
              {t.text}
            </text>
          ))}
      </svg>

      {/* HTML Layer for Blurs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {annotations
          .concat(tempAnnotation && tempAnnotation.type === 'blur' ? [tempAnnotation] : [])
          .filter((a): a is Extract<Annotation, { type: 'blur' }> => a.type === 'blur')
          .map((b) => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: `${(b.rect.x / canvasWidth) * 100}%`,
                top: `${(b.rect.y / canvasHeight) * 100}%`,
                width: `${(b.rect.w / canvasWidth) * 100}%`,
                height: `${(b.rect.h / canvasHeight) * 100}%`,
                backdropFilter: `blur(${b.intensity}px)`,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
              }}
            />
          ))}
      </div>

      {/* Delete buttons — always visible when annotations exist */}
      {!isPreview && (
        <div className="hide-on-export" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {annotations.map((a) => {
            let left = 0;
            let top = 0;

            if (a.type === 'arrow') {
              left = (a.to.x / canvasWidth) * 100;
              top = (a.to.y / canvasHeight) * 100;
            } else if (a.type === 'text') {
              left = (a.pos.x / canvasWidth) * 100;
              top = (a.pos.y / canvasHeight) * 100;
            } else {
              left = ((a.rect.x + a.rect.w) / canvasWidth) * 100;
              top = (a.rect.y / canvasHeight) * 100;
            }

            return (
              <button
                key={`delete-${a.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAnnotation(a.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid #fff',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 30,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  pointerEvents: 'auto',
                }}
              >
                ×
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
