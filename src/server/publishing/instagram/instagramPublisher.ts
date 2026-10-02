import { config } from '../../config/env';
import { ServiceError } from '../../errors/ServiceError';
import { hostGeneratedImage } from '../publicMediaHosting';
import { createStoryContainer, getContainerStatus, publishContainer } from './instagramClient';
import type { MediaPublisher, PublishOptions, PublishResult } from '../MediaPublisher';
import type { RenderedMedia } from '../../../shared/types/rendering';

const INSTAGRAM_ACCOUNT_ID = config.instagram.accountId;
const INSTAGRAM_ACCESS_TOKEN = config.instagram.accessToken;

export class InstagramPublisher implements MediaPublisher {
  async publish(media: RenderedMedia, options: PublishOptions = {}): Promise<PublishResult> {
    const { mediaType = 'STORY', caption } = options;
    const imageDataUrl = media.dataUrl;

    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
      throw new ServiceError(400, {
        success: false,
        error: 'Instagram API credentials (account ID of access token) ontbreken op de server.'
      });
    }

    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image')) {
      throw new ServiceError(400, {
        success: false,
        error: 'Geen geldige Base64 afbeelding (data:image/png) ontvangen.'
      });
    }

    const publicImageUrl = await hostGeneratedImage(imageDataUrl, options.publicOrigin || 'https://localhost:3000');

    console.log(`[Instagram Publishing] Final Public Image URL: ${publicImageUrl}`);
    const isStory = mediaType.toUpperCase() === 'STORY';

    // 2. Call Meta Graph API: POST /{ig-user-id}/media
    const { containerRes, containerData } = await createStoryContainer(publicImageUrl, isStory, caption);

    console.log('[Instagram Publishing] Container creation result:', containerData);

    if (!containerRes.ok || containerData.error) {
      const errMsg = containerData.error?.message || 'Fout bij aanmaken Instagram media container';
      throw new ServiceError(400, {
        success: false,
        step: 'create_container',
        error: errMsg,
        metaError: containerData.error
      });
    }

    const creationId = containerData.id;
    if (!creationId) {
      throw new ServiceError(500, {
        success: false,
        error: 'Geen creation ID ontvangen van Meta.'
      });
    }

    // Poll Meta container status until FINISHED or timeout (up to 15 seconds)
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const statusData = await getContainerStatus(creationId);
        console.log(`[Instagram Publishing] Status check attempt ${attempt + 1}:`, statusData);
        if (statusData.status_code === 'FINISHED') {
          break;
        } else if (statusData.status_code === 'ERROR') {
          throw new ServiceError(400, {
            success: false,
            step: 'container_processing',
            error: statusData.status || 'Meta verwerking gaf een foutstatus.'
          });
        }
      } catch (pollErr) {
        if (pollErr instanceof ServiceError) throw pollErr;
        console.warn('Status poll attempt error:', pollErr);
      }
    }

    // 3. Call Meta Graph API: POST /{ig-user-id}/media_publish
    const { publishRes, publishData } = await publishContainer(creationId);

    console.log('[Instagram Publishing] Media publish result:', publishData);

    if (!publishRes.ok || publishData.error) {
      const errMsg = publishData.error?.message || 'Fout bij publiceren van Instagram media container';
      throw new ServiceError(400, {
        success: false,
        step: 'publish_media',
        error: errMsg,
        metaError: publishData.error
      });
    }

    return {
      success: true,
      id: publishData.id,
      mediaType: isStory ? 'STORY' : 'POST',
      permalink: 'https://www.instagram.com/dmon_hockey/',
      publicImageUrl,
      message: `Succesvol gepubliceerd naar @dmon_hockey als ${isStory ? 'Story' : 'Post'}! ID: ${publishData.id}`
    };
  }
}

export const instagramPublisher = new InstagramPublisher();
