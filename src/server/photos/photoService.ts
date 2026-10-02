import type { PhotoPoolItem } from '../../shared/types/photos';
import { ServiceError } from '../errors/ServiceError';
import { DEFAULT_PHOTOS, readStoredPhotos, writeStoredPhotos, saveUploadedPhoto, deleteUploadedPhoto } from './photoRepository';

export function listPhotos() {
  const photos = readStoredPhotos();
  return photos;
}

export function addPhoto(input: Partial<PhotoPoolItem>) {
  const { id, title, photographer, url, aspectRatio } = input;
  if (!url) {
    throw new ServiceError(400, { error: 'url is required' });
  }

  const photoId = id || `photo-${Date.now()}`;
  const savedUrl = saveUploadedPhoto(url, photoId);

  const newPhoto = {
    id: photoId,
    title: title || 'Nieuwe Clubfoto',
    photographer: photographer || 'Clublid',
    url: savedUrl,
    isUserUploaded: true,
    aspectRatio: aspectRatio || '1:1',
    uploadedAt: new Date().toISOString()
  };

  const photos = readStoredPhotos();
  // Prepend to top of list
  const updatedPhotos = [newPhoto, ...photos.filter((p) => p.id !== photoId)];
  writeStoredPhotos(updatedPhotos);

  return newPhoto;
}

export function deletePhoto(photoId: string) {
  const photos = readStoredPhotos();
  const photoToDelete = photos.find((p) => p.id === photoId);

  deleteUploadedPhoto(photoToDelete);

  const updated = photos.filter((p) => p.id !== photoId);
  writeStoredPhotos(updated);
  return { success: true, remainingCount: updated.length };
}

export function resetPhotos() {
  writeStoredPhotos(DEFAULT_PHOTOS);
  return DEFAULT_PHOTOS;
}
