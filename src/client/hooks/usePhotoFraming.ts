import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GraphicSettings } from '../../shared/types/rendering';
import { normalizePhotoFraming, panPhoto, zoomPhotoAtPoint } from '../../shared/domain/photoFraming';
import type { PhotoFraming, Point, Size } from '../../shared/domain/photoFraming';
import { loadImage } from '../rendering/canvas/drawing';

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function usePhotoFraming(settings: GraphicSettings, onUpdate: (settings: Partial<GraphicSettings>) => void) {
  const paneRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const image = useRef<(Size & { url: string }) | null>(null);
  const current = useRef(normalizePhotoFraming(settings));
  const settingsRef = useRef(settings);
  const updateRef = useRef(onUpdate);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [recentlyAdjusted, setRecentlyAdjusted] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  current.current = normalizePhotoFraming(settings);
  settingsRef.current = settings;
  updateRef.current = onUpdate;

  useEffect(() => {
    let cancelled = false;
    pointers.current.clear();
    setIsDragging(false);
    loadImage(settings.photoUrl).then(photo => {
      if (!cancelled) {
        image.current = { width: photo.width, height: photo.height, url: settings.photoUrl };
        setLoadedUrl(settings.photoUrl);
      }
    }).catch(() => { if (!cancelled) image.current = null; });
    return () => { cancelled = true; };
  }, [settings.photoUrl]);

  useEffect(() => () => { clearTimeout(idleTimer.current); }, []);

  const indicateAdjustment = () => {
    setRecentlyAdjusted(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setRecentlyAdjusted(false), 900);
  };

  const adjust = (patch: Partial<GraphicSettings>) => {
    current.current = normalizePhotoFraming({ ...current.current, ...patch });
    indicateAdjustment();
    updateRef.current({ ...patch, ...current.current });
  };

  const geometry = () => {
    const rect = paneRef.current?.getBoundingClientRect();
    const dimensions = image.current;
    if (!rect || !rect.width || !rect.height || dimensions?.url !== settingsRef.current.photoUrl) return null;
    return { rect, image: dimensions, pane: { width: rect.width, height: rect.height } };
  };

  // Native non-passive listener also handles trackpad pinch (Ctrl+wheel).
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const onWheel = (event: WheelEvent) => {
      const bounds = geometry();
      if (!bounds) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.pane.height : 1);
      const framing = zoomPhotoAtPoint(bounds.image, bounds.pane, current.current,
        current.current.photoZoom * Math.exp(-delta * 0.0015),
        { x: event.clientX - bounds.rect.left, y: event.clientY - bounds.rect.top });
      // Refs keep successive wheel events current before React paints.
      current.current = framing;
      indicateAdjustment();
      updateRef.current(framing);
    };
    pane.addEventListener('wheel', onWheel, { passive: false });
    return () => pane.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || !geometry() || pointers.current.size >= 2) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setIsDragging(true);
    indicateAdjustment();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const bounds = geometry();
    if (!bounds) return;
    const before = [...pointers.current.values()];
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = [...pointers.current.values()];
    let framing: PhotoFraming;
    if (after.length === 2) {
      const oldMid = midpoint(before[0], before[1]);
      const newMid = midpoint(after[0], after[1]);
      const oldDistance = distance(before[0], before[1]);
      const zoomed = zoomPhotoAtPoint(bounds.image, bounds.pane, current.current,
        oldDistance > 0 ? current.current.photoZoom * distance(after[0], after[1]) / oldDistance : current.current.photoZoom,
        { x: oldMid.x - bounds.rect.left, y: oldMid.y - bounds.rect.top });
      framing = panPhoto(bounds.image, bounds.pane, zoomed, { x: newMid.x - oldMid.x, y: newMid.y - oldMid.y });
    } else {
      framing = panPhoto(bounds.image, bounds.pane, current.current, { x: after[0].x - before[0].x, y: after[0].y - before[0].y });
    }
    current.current = framing;
    indicateAdjustment();
    updateRef.current(framing);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(pointers.current.size > 0);
    indicateAdjustment();
  };

  return {
    paneRef, adjust, isDragging, isFraming: isDragging || recentlyAdjusted,
    ready: loadedUrl === settings.photoUrl,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onLostPointerCapture: onPointerEnd },
  };
}
