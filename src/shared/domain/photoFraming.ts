import type { GraphicSettings } from '../types/rendering';

export interface PhotoFraming {
  photoZoom: number;
  photoOffsetX: number;
  photoOffsetY: number;
}

export interface Size { width: number; height: number }
export interface Point { x: number; y: number }

function clamp(value: number | undefined, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value!)) : fallback;
}

export function normalizePhotoFraming(settings: Partial<PhotoFraming>): PhotoFraming {
  return {
    photoZoom: clamp(settings.photoZoom, 1, 3, 1),
    photoOffsetX: clamp(settings.photoOffsetX, -1, 1, 0),
    photoOffsetY: clamp(settings.photoOffsetY, -1, 1, 0),
  };
}

export function getPhotoSplit(settings: Pick<GraphicSettings, 'format' | 'splitRatio'>): number {
  return clamp(settings.splitRatio || undefined, 0.35, 0.55, settings.format === 'story' ? 0.44 : 0.42);
}

export function getPhotoPlacement(image: Size, pane: Size, input: Partial<PhotoFraming>) {
  const framing = normalizePhotoFraming(input);
  const imageRatio = image.width / image.height;
  const paneRatio = pane.width / pane.height;
  // Use the existing cover calculation so unframed graphics retain their crop.
  const width = (imageRatio > paneRatio ? pane.height * imageRatio : pane.width) * framing.photoZoom;
  const height = (imageRatio > paneRatio ? pane.height : pane.width / imageRatio) * framing.photoZoom;
  const overflowX = Math.max(0, width - pane.width);
  const overflowY = Math.max(0, height - pane.height);
  return {
    width, height, overflowX, overflowY,
    x: overflowX ? -(overflowX / 2) * (1 + framing.photoOffsetX) : 0,
    y: overflowY ? -(overflowY / 2) * (1 + framing.photoOffsetY) : 0,
  };
}

export function panPhoto(image: Size, pane: Size, input: PhotoFraming, delta: Point): PhotoFraming {
  const placement = getPhotoPlacement(image, pane, input);
  return normalizePhotoFraming({
    ...input,
    photoOffsetX: placement.overflowX ? input.photoOffsetX - 2 * delta.x / placement.overflowX : input.photoOffsetX,
    photoOffsetY: placement.overflowY ? input.photoOffsetY - 2 * delta.y / placement.overflowY : input.photoOffsetY,
  });
}

export function zoomPhotoAtPoint(image: Size, pane: Size, input: PhotoFraming, zoom: number, anchor: Point): PhotoFraming {
  const current = getPhotoPlacement(image, pane, input);
  const next = normalizePhotoFraming({ ...input, photoZoom: zoom });
  if (next.photoZoom === input.photoZoom) return next;
  const target = getPhotoPlacement(image, pane, next);
  const x = anchor.x - ((anchor.x - current.x) / current.width) * target.width;
  const y = anchor.y - ((anchor.y - current.y) / current.height) * target.height;
  return normalizePhotoFraming({
    ...next,
    photoOffsetX: target.overflowX ? -2 * x / target.overflowX - 1 : next.photoOffsetX,
    photoOffsetY: target.overflowY ? -2 * y / target.overflowY - 1 : next.photoOffsetY,
  });
}
