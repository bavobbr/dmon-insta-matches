import type { PhotoPoolItem } from '../../shared/types/photos';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

const PHOTOS_FILE = path.join(config.paths.data, 'photos.json');
const UPLOADS_DIR = config.paths.uploads;

export const DEFAULT_PHOTOS = [
  {
    id: 'photo-1',
    title: 'Youth Team Huddle (D-Mon Blauw & Rood)',
    photographer: 'Coach Sarah',
    url: '/photos/photo-1.jpg',
    aspectRatio: '1:1'
  },
  {
    id: 'photo-2',
    title: 'Hockey Turf Match Sprint',
    photographer: 'Coach Thomas',
    url: '/photos/photo-2.jpg',
    aspectRatio: '9:16'
  },
  {
    id: 'photo-3',
    title: 'Junior Stick Dribble & Balcontrole',
    photographer: 'Coach Bart',
    url: '/photos/photo-3.jpg',
    aspectRatio: '1:1'
  },
  {
    id: 'photo-4',
    title: 'Team High-Five & Overwinning',
    photographer: 'Coach Pieter',
    url: '/photos/photo-4.jpg',
    aspectRatio: '1:1'
  },
  {
    id: 'photo-5',
    title: 'Goalie Uitrusting & Veldactie',
    photographer: 'Coach Dimitri',
    url: '/photos/photo-5.jpg',
    aspectRatio: '9:16'
  },
  {
    id: 'photo-6',
    title: 'Avondtraining D-Mon Waterveld',
    photographer: 'Coach Elena',
    url: '/photos/photo-6.jpg',
    aspectRatio: '9:16'
  }
];

export function readStoredPhotos(): PhotoPoolItem[] {
  try {
    if (fs.existsSync(PHOTOS_FILE)) {
      const content = fs.readFileSync(PHOTOS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading photos.json:', err);
  }
  // Initialize with defaults
  writeStoredPhotos(DEFAULT_PHOTOS);
  return DEFAULT_PHOTOS;
}

export function writeStoredPhotos(photos: PhotoPoolItem[]): void {
  try {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing photos.json:', err);
  }
}

export function saveUploadedPhoto(url: string, photoId: string) {
  let savedUrl = url;

  // If it's a data URL, save it as an image file on disk in public/uploads/
  if (url.startsWith('data:image/')) {
    const commaIdx = url.indexOf(',');
    if (commaIdx !== -1) {
      const header = url.substring(0, commaIdx);
      const base64Data = url.substring(commaIdx + 1);
      let ext = 'jpg';
      if (header.includes('png')) ext = 'png';
      else if (header.includes('webp')) ext = 'webp';
      else if (header.includes('svg')) ext = 'svg';
      else if (header.includes('gif')) ext = 'gif';

      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${photoId}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      savedUrl = `/uploads/${filename}`;
    }
  }

  return savedUrl;
}

export function deleteUploadedPhoto(photoToDelete: PhotoPoolItem | undefined) {
  // If it was uploaded to public/uploads/, remove the file from disk
  if (photoToDelete && photoToDelete.url && photoToDelete.url.startsWith('/uploads/')) {
    const filename = path.basename(photoToDelete.url);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Failed to delete file from uploads:', e);
      }
    }
  }

}
