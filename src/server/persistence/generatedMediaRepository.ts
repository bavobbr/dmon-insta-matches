import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { ServiceError } from '../errors/ServiceError';

const GENERATED_DIR = config.paths.generated;

export function saveGeneratedImage(imageDataUrl: string) {
  // 1. Save graphic to public/generated so Meta's servers can download it
  // Meta Instagram Content Publishing API STRICTLY requires JPEG format (.jpg/.jpeg)
  const matches = imageDataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!matches) {
    throw new ServiceError(400, { success: false, error: 'Ongeldige Base64 structuur.' });
  }

  const base64Data = matches[2];
  // Instagram Graph API container creation strictly mandates .jpg / .jpeg extension!
  const fileName = `story_${Date.now()}.jpg`;
  const filePath = path.join(GENERATED_DIR, fileName);
  const fileBuffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, fileBuffer);

  return { fileName, fileBuffer };
}

export function getPublicUrl(fileName: string, publicOrigin: string) {
  return config.baseUrl
    ? `${config.baseUrl.replace(/\/$/, '')}/generated/${fileName}`
    : `${publicOrigin}/generated/${fileName}`;
}
