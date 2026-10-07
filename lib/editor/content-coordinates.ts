import type { Point, ScreenstylerDoc } from '@/lib/document/schema';

function project(matrix: DOMMatrix, x: number, y: number): Point {
  const point = new DOMPoint(x, y).matrixTransform(matrix);
  return { x: point.x / point.w, y: point.y / point.w };
}

/** Map the content plane through its CSS transform, parent perspective and viewport scale. */
export function createContentCoordinates(layout: HTMLElement, canvas: ScreenstylerDoc['canvas']) {
  const style = getComputedStyle(layout);
  const width = parseFloat(style.width);
  const height = parseFloat(style.height);
  const bounds = layout.getBoundingClientRect();
  if (!width || !height || !bounds.width || !bounds.height) return null;
  const [ox, oy, oz = 0] = style.transformOrigin.split(' ').map(parseFloat);
  let matrix = new DOMMatrix().translate(ox, oy, oz)
    .multiply(new DOMMatrix(style.transform === 'none' ? undefined : style.transform))
    .translate(-ox, -oy, -oz);

  // ContentLayer fills its perspective parent, so both use the same local origin.
  const parentStyle = layout.parentElement && getComputedStyle(layout.parentElement);
  if (parentStyle && parentStyle.perspective !== 'none') {
    const [px, py] = parentStyle.perspectiveOrigin.split(' ').map(parseFloat);
    const perspective = new DOMMatrix();
    perspective.m34 = -1 / parseFloat(parentStyle.perspective);
    matrix = new DOMMatrix().translate(px, py).multiply(perspective).translate(-px, -py).multiply(matrix);
  }

  // Invert the projected z=0 plane, rather than assuming a screen point has z=0 in 3D.
  matrix.m13 = matrix.m23 = matrix.m43 = 0;
  matrix.m31 = matrix.m32 = matrix.m34 = 0;
  matrix.m33 = 1;
  const inverse = matrix.inverse();
  if (!Number.isFinite(inverse.m11)) return null;
  const corners = [[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => project(matrix, x, y));
  const left = Math.min(...corners.map((point) => point.x));
  const top = Math.min(...corners.map((point) => point.y));
  const sx = bounds.width / (Math.max(...corners.map((point) => point.x)) - left);
  const sy = bounds.height / (Math.max(...corners.map((point) => point.y)) - top);

  const point = (x: number, y: number): Point => {
    const local = project(inverse, (x - bounds.x) / sx + left, (y - bounds.y) / sy + top);
    return { x: local.x * canvas.width / width, y: local.y * canvas.height / height };
  };
  const tolerance = (x: number, y: number, pixels: number): Point => {
    const origin = point(x, y);
    const dx = point(x + pixels, y);
    const dy = point(x, y + pixels);
    return { x: Math.hypot(dx.x - origin.x, dy.x - origin.x), y: Math.hypot(dx.y - origin.y, dy.y - origin.y) };
  };
  return { point, tolerance };
}
