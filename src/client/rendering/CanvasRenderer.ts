import type { MediaRenderer, RenderRequest, RenderedMedia } from '../../shared/types/rendering';
import { renderGraphicToCanvas } from './canvas/drawing';

export class CanvasRenderer implements MediaRenderer {
  constructor(private readonly canvas: HTMLCanvasElement, private readonly shouldCommit?: () => boolean) {}

  async render(publication: RenderRequest): Promise<RenderedMedia> {
    await renderGraphicToCanvas({ canvas: this.canvas, ...publication, shouldCommit: this.shouldCommit });
    // Export stays lazy: preview rendering never previously encoded an image.
    const renderer = this;
    return {
      provider: 'canvas', mediaType: 'image', mimeType: 'image/png',
      get dataUrl() { return renderer.captureMedia('image/png').dataUrl; },
    };
  }

  // Only the Canvas preview adapter uses this; orchestration consumes RenderedMedia.
  captureMedia(mimeType: 'image/png' | 'image/jpeg'): RenderedMedia {
    return {
      provider: 'canvas', mediaType: 'image', mimeType,
      dataUrl: this.canvas.toDataURL(mimeType, mimeType === 'image/png' ? 1.0 : 0.95),
    };
  }
}
