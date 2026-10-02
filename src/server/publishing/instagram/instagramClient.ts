import { config } from '../../config/env';

const INSTAGRAM_ACCOUNT_ID = config.instagram.accountId;
const INSTAGRAM_ACCESS_TOKEN = config.instagram.accessToken;

export async function createStoryContainer(publicImageUrl: string, isStory: boolean, caption?: string) {
  const containerParams = new URLSearchParams();
  containerParams.append('image_url', publicImageUrl);
  containerParams.append('access_token', INSTAGRAM_ACCESS_TOKEN);

  if (isStory) {
    containerParams.append('media_type', 'STORIES');
  } else {
    if (caption) containerParams.append('caption', caption);
  }

  const containerRes = await fetch(
    `https://graph.facebook.com/v20.0/${INSTAGRAM_ACCOUNT_ID}/media`,
    {
      method: 'POST',
      body: containerParams
    }
  );

  const containerData = (await containerRes.json()) as any;
  return { containerRes, containerData };

}

export async function getContainerStatus(creationId: string) {
  const statusRes = await fetch(
        `https://graph.facebook.com/v20.0/${creationId}?fields=status_code,status&access_token=${INSTAGRAM_ACCESS_TOKEN}`
      );
      return (await statusRes.json()) as any;

}

export async function publishContainer(creationId: string) {
  const publishParams = new URLSearchParams();
  publishParams.append('creation_id', creationId);
  publishParams.append('access_token', INSTAGRAM_ACCESS_TOKEN);

  const publishRes = await fetch(
    `https://graph.facebook.com/v20.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
    {
      method: 'POST',
      body: publishParams
    }
  );

  const publishData = (await publishRes.json()) as any;
  return { publishRes, publishData };

}
