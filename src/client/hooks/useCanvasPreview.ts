import { useEffect, useRef, useState } from 'react';
import type { MatchPublication } from '../../shared/types/publication';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { RenderingService } from '../services/renderingService';
import { generateWeekendPublication } from '../services/publicationService';

// The only UI adapter that knows about a Canvas surface. Drawing remains in its renderer.
export function useCanvasPreview(publication: MatchPublication) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const render = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);
      try {
        const rendering = new RenderingService(new CanvasRenderer(canvasRef.current));
        await generateWeekendPublication(publication, rendering);
      } catch (err) {
        console.error('Rendering failed:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };
    render();
    return () => { isCancelled = true; };
  }, [publication]);

  const getMedia = (mimeType: 'image/png' | 'image/jpeg') => canvasRef.current
    ? new CanvasRenderer(canvasRef.current).captureMedia(mimeType) : undefined;

  return { canvasRef, isRendering, getMedia };
}
