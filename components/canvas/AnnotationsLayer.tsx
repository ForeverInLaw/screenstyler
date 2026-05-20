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
};

export function AnnotationsLayer({
  annotations,
  activeTool,
  canvasWidth,
  canvasHeight,
  onAddAnnotation,
  onRemoveAnnotation,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState<Annotation | null>(null);
  const [textPos, setTextPos] = useState<Point | null>(null);
  const [textVal, setTextVal] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Convert screen coordinates to canvas-relative coordinates
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
        color: 'rgba(234, 179, 8, 0.4)', // yellow highlight
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
      setTempAnnotation({
        ...tempAnnotation,
        to: pt,
      });
    } else if (tempAnnotation.type === 'highlight' || tempAnnotation.type === 'blur') {
      const rect: Rect = {
        x: Math.min(startPoint.x, pt.x),
        y: Math.min(startPoint.y, pt.y),
        w: Math.abs(startPoint.x - pt.x),
        h: Math.abs(startPoint.y - pt.y),
      };
      if (tempAnnotation.type === 'highlight') {
        setTempAnnotation({ ...tempAnnotation, rect });
      } else {
        setTempAnnotation({ ...tempAnnotation, rect });
      }
    }
  }

  function handleMouseUp(e: MouseEvent<HTMLDivElement>) {
    if (!isDrawing || !tempAnnotation) return;
    setIsDrawing(false);
    setStartPoint(null);
    setTempAnnotation(null);

    // Filter out zero-size rectangles
    if (tempAnnotation.type === 'highlight' || tempAnnotation.type === 'blur') {
      if (tempAnnotation.rect.w < 5 || tempAnnotation.rect.h < 5) return;
    }
    if (tempAnnotation.type === 'arrow') {
      const dx = tempAnnotation.to.x - tempAnnotation.from.x;
      const dy = tempAnnotation.to.y - tempAnnotation.from.y;
      if (Math.sqrt(dx * dx + dy * dy) < 5) return;
    }

    onAddAnnotation({
      ...tempAnnotation,
      id: crypto.randomUUID(),
    });
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

  // Handle escape to cancel text drawing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTextPos(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        cursor: activeTool === 'select' ? 'default' : 'crosshair',
        pointerEvents: activeTool === 'select' && hoveredId === null ? 'none' : 'auto',
      }}
    >
      {/* SVG Layer for Drawing Arrows/Highlights/Texts */}
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
          {/* Dynamic markers for arrows */}
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

        {/* Render Highlights */}
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

        {/* Render Arrows */}
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

        {/* Render SVG Texts */}
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

      {/* HTML Layer for Backdrop Blurs and Delete Handles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Render HTML Blurs */}
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
                border: '1px dashed rgba(255,255,255,0.2)',
                borderRadius: '4px',
              }}
            />
          ))}

        {/* Render Interactive Delete Handles (only active when in select mode) */}
        {activeTool === 'select' &&
          annotations.map((a) => {
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
                onMouseEnter={() => setHoveredId(a.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  onRemoveAnnotation(a.id);
                  setHoveredId(null);
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
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 30,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  pointerEvents: 'auto',
                }}
              >
                ×
              </button>
            );
          })}
      </div>

      {/* Floating text input box for typing text */}
      {textPos && (
        <div
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
