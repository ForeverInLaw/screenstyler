'use client';
import { Fragment } from 'react';
import { useObjectUrl } from '@/components/canvas/use-object-url';
import type { Frame, ScreenstylerDoc, ScreenshotItem } from '@/lib/document/schema';
import { backgroundToStyle, imageCropToStyle } from '@/lib/style/css';
import { arrowStrokeDasharray, getArrowVariant } from '@/lib/annotations/arrows';
import { blurPreviewFill } from '@/lib/annotations/blurs';
import { getTextFontFamily } from '@/lib/annotations/text';
import { normalizeDoc } from '@/lib/document/store';

function ProjectScreenshotItem({
  item,
  docWidth,
  docHeight,
  frame,
}: {
  item: ScreenshotItem;
  docWidth: number;
  docHeight: number;
  frame: Frame;
}) {
  const imageUrl = useObjectUrl(item.image.blobKey);
  if (!imageUrl) return null;

  const showChrome = frame.type === 'window' || frame.type === 'browser';
  const chromeDark =
    (frame.type === 'window' && frame.variant === 'macos-dark') ||
    (frame.type === 'browser' && frame.theme === 'dark');

  return (
    <div
      style={{
        position: 'absolute',
        left: `${(item.x / docWidth) * 100}%`,
        top: `${(item.y / docHeight) * 100}%`,
        width: `${(item.width / docWidth) * 100}%`,
        height: `${(item.height / docHeight) * 100}%`,
        borderRadius: frame.type === 'none' ? 4 : 6,
        background: chromeDark ? '#1f1f22' : '#ffffff',
        boxShadow: '0 8px 22px rgb(0 0 0 / 0.18)',
        overflow: 'hidden',
      }}
    >
      {showChrome && (
        <div
          style={{
            height: 12,
            background: chromeDark ? '#2d2e30' : '#eceff1',
            borderBottom: `1px solid ${chromeDark ? '#1f2022' : '#d7dce0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            paddingInline: 5,
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: 99, background: '#ff5f56' }} />
          <span style={{ width: 4, height: 4, borderRadius: 99, background: '#ffbd2e' }} />
          <span style={{ width: 4, height: 4, borderRadius: 99, background: '#27c93f' }} />
        </div>
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: showChrome ? 'calc(100% - 12px)' : '100%',
          overflow: 'hidden',
        }}
      >
        {item.crop ? (
          <img
            src={imageUrl}
            alt=""
            style={{
              position: 'absolute',
              ...imageCropToStyle(item.image, item.crop),
              maxWidth: 'none',
              maxHeight: 'none',
            }}
          />
        ) : (
          <img
            src={imageUrl}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: frame.type === 'device' ? 'cover' : 'fill',
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ProjectDocumentPreview({ doc: rawDoc }: { doc: ScreenstylerDoc }) {
  const doc = normalizeDoc(rawDoc);
  const backgroundUrl = useObjectUrl(
    doc.canvas.background.type === 'image' ? doc.canvas.background.ref.blobKey : null,
  );
  const docAspect = doc.canvas.width / doc.canvas.height;
  const previewAspect = 16 / 10;
  const padding = doc.content.padding;
  const fitStyle =
    docAspect >= previewAspect
      ? { height: '100%', aspectRatio: `${doc.canvas.width} / ${doc.canvas.height}` }
      : { width: '100%', aspectRatio: `${doc.canvas.width} / ${doc.canvas.height}` };

  const frame = doc.content.frame;

  const scaleX = Math.max(0.1, (doc.canvas.width - 2 * padding) / doc.canvas.width);
  const scaleY = Math.max(0.1, (doc.canvas.height - 2 * padding) / doc.canvas.height);
  const paddingScale = Math.min(scaleX, scaleY);
  const finalScale = doc.content.transform3d.scale * paddingScale;

  const screenshots = doc.content.screenshots || [];

  return (
    <div className="grid h-full w-full place-items-center bg-well">
      <div
        style={{
          ...fitStyle,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...backgroundToStyle(doc.canvas.background, backgroundUrl ?? undefined),
          }}
        />
        {(screenshots.length > 0 || doc.annotations.length > 0) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              perspective: `${doc.content.transform3d.perspective}px`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: `rotateX(${doc.content.transform3d.rotateX}deg) rotateY(${doc.content.transform3d.rotateY}deg) rotateZ(${doc.content.transform3d.rotateZ}deg) scale(${finalScale})`,
              }}
            >
              {screenshots.map((item) => (
                <ProjectScreenshotItem
                  key={item.id}
                  item={item}
                  docWidth={doc.canvas.width}
                  docHeight={doc.canvas.height}
                  frame={frame}
                />
              ))}
              <svg
                viewBox={`0 0 ${doc.canvas.width} ${doc.canvas.height}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  {doc.annotations
                    .filter(
                      (a): a is Extract<ScreenstylerDoc['annotations'][number], { type: 'arrow' }> =>
                        a.type === 'arrow',
                    )
                    .map((arrow) => {
                      const variant = getArrowVariant(arrow.variant);
                      return (
                        <Fragment key={`preview-marker-${arrow.id}`}>
                          <marker
                            id={`preview-arrow-head-${arrow.id}`}
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
                              id={`preview-arrow-tail-${arrow.id}`}
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
                              id={`preview-arrow-tail-${arrow.id}`}
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
                        </Fragment>
                      );
                    })}
                </defs>
                {doc.annotations.map((annotation) => {
                  if (annotation.type === 'highlight') {
                    return (
                      <rect
                        key={annotation.id}
                        x={annotation.rect.x}
                        y={annotation.rect.y}
                        width={annotation.rect.w}
                        height={annotation.rect.h}
                        fill={annotation.color}
                        rx="8"
                      />
                    );
                  }
                  if (annotation.type === 'arrow') {
                    const variant = getArrowVariant(annotation.variant);
                    return (
                      <line
                        key={annotation.id}
                        x1={annotation.from.x}
                        y1={annotation.from.y}
                        x2={annotation.to.x}
                        y2={annotation.to.y}
                        stroke={annotation.color}
                        strokeWidth={Math.max(annotation.thickness, 6)}
                        strokeDasharray={arrowStrokeDasharray(variant)}
                        strokeLinecap="round"
                        markerStart={
                          variant === 'double' || variant === 'dot'
                            ? `url(#preview-arrow-tail-${annotation.id})`
                            : undefined
                        }
                        markerEnd={`url(#preview-arrow-head-${annotation.id})`}
                      />
                    );
                  }
                  if (annotation.type === 'text') {
                    return (
                      <text
                        key={annotation.id}
                        x={annotation.pos.x}
                        y={annotation.pos.y}
                        fill={annotation.color}
                        fontSize={Math.max(annotation.fontSize, 24)}
                        fontWeight="700"
                        fontFamily={getTextFontFamily(annotation.fontFamily)}
                      >
                        {annotation.text}
                      </text>
                    );
                  }
                  return (
                    <rect
                      key={annotation.id}
                      x={annotation.rect.x}
                      y={annotation.rect.y}
                      width={annotation.rect.w}
                      height={annotation.rect.h}
                      fill={blurPreviewFill(annotation.variant)}
                      rx="8"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
