import type { RenderedMedia } from '../../shared/types/rendering';
import type { PublishOptions } from '../../shared/types/publishing';

export const instagramApi = {
  publish(media: RenderedMedia, options: PublishOptions = {}): Promise<Response> {
    return fetch('/api/instagram/publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType: options.mediaType ?? 'STORY', caption: options.caption, imageDataUrl: media.dataUrl }),
    });
  },
};
