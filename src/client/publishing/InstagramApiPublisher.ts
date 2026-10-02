import type { MediaPublisher, PublishOptions, PublishResult } from '../../shared/types/publishing';
import type { RenderedMedia } from '../../shared/types/rendering';
import { instagramApi } from '../services/instagramApi';
import { ensureJpegDataUrl } from '../rendering/imageEncoding';

// Browser adapter for the existing HTTP endpoint; Meta orchestration remains server-side.
export class InstagramApiPublisher implements MediaPublisher {
  async publish(media: RenderedMedia, options: PublishOptions = {}): Promise<PublishResult> {
    const jpegDataUrl = await ensureJpegDataUrl(media.dataUrl!);
    const res = await instagramApi.publish({ ...media, dataUrl: jpegDataUrl, mimeType: 'image/jpeg' }, options);
    const data = await res.json();
    console.log('Instagram Publish API Response:', data);
    if (!res.ok || !data.success) {
      const detail = data.metaError?.message || data.error || 'Fout bij publiceren naar Instagram';
      throw new Error(detail);
    }
    return data;
  }
}

export const instagramApiPublisher = new InstagramApiPublisher();
