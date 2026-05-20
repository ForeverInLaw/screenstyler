import { z } from 'zod';

export const pointSchema = z.object({ x: z.number(), y: z.number() });
export const rectSchema = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });
export const gradientStopSchema = z.object({ color: z.string(), offset: z.number().min(0).max(1) });

export const imageRefSchema = z.object({
  id: z.string(),
  blobKey: z.string(),
  naturalWidth: z.number().positive(),
  naturalHeight: z.number().positive(),
});

export const backgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: z.string() }),
  z.object({ type: z.literal('gradient'), angle: z.number(),
    stops: z.array(gradientStopSchema).min(2) }),
  z.object({ type: z.literal('image'), ref: imageRefSchema, fit: z.enum(['cover', 'contain']) }),
]);

export const shadowSchema = z.object({
  x: z.number(), y: z.number(), blur: z.number().min(0), spread: z.number(),
  color: z.string(), opacity: z.number().min(0).max(1),
});

export const frameSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('window'), variant: z.enum(['macos', 'macos-dark']) }),
  z.object({ type: z.literal('browser'), variant: z.enum(['safari', 'chrome', 'arc']),
    url: z.string().optional(), theme: z.enum(['light', 'dark']) }),
  z.object({ type: z.literal('device'), variant: z.enum(['iphone', 'macbook', 'ipad']) }),
]);

export const transform3dSchema = z.object({
  rotateX: z.number(), rotateY: z.number(), rotateZ: z.number(),
  perspective: z.number().positive(), scale: z.number().positive(),
});

export const annotationSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string(), type: z.literal('arrow'), from: pointSchema, to: pointSchema,
    color: z.string(), thickness: z.number() }),
  z.object({ id: z.string(), type: z.literal('text'), pos: pointSchema, text: z.string(),
    fontSize: z.number(), color: z.string() }),
  z.object({ id: z.string(), type: z.literal('highlight'), rect: rectSchema, color: z.string() }),
  z.object({ id: z.string(), type: z.literal('blur'), rect: rectSchema, intensity: z.number() }),
]);

export const screenstylerDocSchema = z.object({
  version: z.literal(1),
  canvas: z.object({
    preset: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    background: backgroundSchema,
  }),
  content: z.object({
    image: imageRefSchema.nullable(),
    padding: z.number().min(0),
    cornerRadius: z.number().min(0),
    shadow: shadowSchema,
    frame: frameSchema,
    transform3d: transform3dSchema,
  }),
  annotations: z.array(annotationSchema),
});

export type ScreenstylerDoc = z.infer<typeof screenstylerDocSchema>;
export type Point = z.infer<typeof pointSchema>;
export type Rect = z.infer<typeof rectSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type Shadow = z.infer<typeof shadowSchema>;
export type Frame = z.infer<typeof frameSchema>;
export type Transform3D = z.infer<typeof transform3dSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type ImageRef = z.infer<typeof imageRefSchema>;
export type GradientStop = z.infer<typeof gradientStopSchema>;

export class CorruptDocumentError extends Error {
  isCorrupt = true;
  constructor(public rawJson: string, public cause: Error) {
    super('Corrupted project document: ' + cause.message);
    this.name = 'CorruptDocumentError';
  }
}

