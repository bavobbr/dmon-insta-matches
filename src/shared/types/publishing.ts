import type { RenderedMedia } from './rendering';

export interface PublishOptions {
  mediaType?: string;
  caption?: string;
  publicOrigin?: string;
}

// Success payload retains the existing Instagram API response fields.
export interface PublishResult {
  success: boolean;
  id?: string;
  mediaType?: string;
  permalink?: string;
  publicImageUrl?: string;
  message?: string;
}

export interface MediaPublisher {
  publish(media: RenderedMedia, options?: PublishOptions): Promise<PublishResult>;
}
