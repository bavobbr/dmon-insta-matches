import { getPublicUrl, saveGeneratedImage } from '../persistence/generatedMediaRepository';

export async function hostGeneratedImage(imageDataUrl: string, publicOrigin: string) {
  const { fileName, fileBuffer } = saveGeneratedImage(imageDataUrl);
  // Meta's crawler requires a directly downloadable image URL without authentication cookies or redirects.
  // The sandboxed Cloud Run preview environment redirects external anonymous crawlers to a cookie check.
  // Therefore, we upload the generated JPEG directly to a high-speed direct CDN endpoint (uguu.se / tmpfiles)
  // which serves direct Content-Type: image/jpeg with 200 OK to Meta's servers.
  let publicImageUrl = '';
  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('files[]', blob, fileName);

    const cdnRes = await fetch('https://uguu.se/upload.php', {
      method: 'POST',
      body: formData
    });
    const cdnData = (await cdnRes.json()) as any;
    if (cdnData.success && cdnData.files?.[0]?.url) {
      publicImageUrl = cdnData.files[0].url;
      console.log(`[Instagram Publishing] Direct CDN URL for Meta crawler: ${publicImageUrl}`);
    }
  } catch (uploadErr) {
    console.warn('[Instagram Publishing] Primary CDN upload failed, falling back:', uploadErr);
  }

  if (!publicImageUrl) publicImageUrl = getPublicUrl(fileName, publicOrigin);
  return publicImageUrl;
}
