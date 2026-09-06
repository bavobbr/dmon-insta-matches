import { PhotoPoolItem, GraphicSettings } from '../types';
import { INITIAL_PHOTO_POOL } from '../data/photoPool';

const DB_NAME = 'dmon_hockey_app';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';
const SETTINGS_KEY = 'dmon_graphic_settings';
const ACTIVE_PHOTO_ID_KEY = 'dmon_active_photo_id';

/**
 * Save active photo ID
 */
export function saveActivePhotoId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PHOTO_ID_KEY, id);
  } catch (e) {
    console.warn('Could not save active photo ID:', e);
  }
}

/**
 * Load active photo ID
 */
export function loadActivePhotoId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PHOTO_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Open or upgrade native IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all photos from IndexedDB
 */
export async function getLocalPhotos(): Promise<PhotoPoolItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const store = tx.objectStore(PHOTO_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to initial pool:', err);
    return [];
  }
}

/**
 * Store a photo in IndexedDB
 */
export async function saveLocalPhoto(photo: PhotoPoolItem): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const request = store.put(photo);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed:', err);
  }
}

/**
 * Save entire list of photos to IndexedDB
 */
export async function saveAllLocalPhotos(photos: PhotoPoolItem[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      store.clear();
      photos.forEach((p) => store.put(p));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB bulk write failed:', err);
  }
}

/**
 * Delete a photo from IndexedDB
 */
export async function deleteLocalPhoto(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
}

/**
 * Fetch photos from backend server API
 */
export async function fetchServerPhotos(): Promise<PhotoPoolItem[] | null> {
  try {
    const res = await fetch('/api/photos');
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return null;
  } catch (err) {
    console.warn('Server photos fetch failed:', err);
    return null;
  }
}

/**
 * Persist uploaded photo to server
 */
export async function uploadPhotoToServer(photo: PhotoPoolItem): Promise<PhotoPoolItem> {
  try {
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo)
    });
    if (res.ok) {
      const saved = await res.json();
      return saved;
    }
  } catch (err) {
    console.warn('Server photo upload failed:', err);
  }
  return photo;
}

/**
 * Delete photo from server
 */
export async function deletePhotoFromServer(id: string): Promise<void> {
  try {
    await fetch(`/api/photos/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Server photo deletion failed:', err);
  }
}

/**
 * Reset server photos to default
 */
export async function resetServerPhotos(): Promise<PhotoPoolItem[]> {
  try {
    const res = await fetch('/api/photos/reset', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Server photos reset failed:', err);
  }
  return INITIAL_PHOTO_POOL;
}

/**
 * High-level: Load full persistent photo pool
 * Checks IndexedDB first for instant render, then checks server API, merges or falls back to INITIAL_PHOTO_POOL.
 */
export async function loadPersistentPhotos(): Promise<PhotoPoolItem[]> {
  // 1. Try server photos
  const serverPhotos = await fetchServerPhotos();
  if (serverPhotos && serverPhotos.length > 0) {
    // Cache to IndexedDB
    saveAllLocalPhotos(serverPhotos).catch(() => {});
    return serverPhotos;
  }

  // 2. Try IndexedDB
  const localPhotos = await getLocalPhotos();
  if (localPhotos && localPhotos.length > 0) {
    return localPhotos;
  }

  // 3. Fallback to Initial Pool and seed IndexedDB
  saveAllLocalPhotos(INITIAL_PHOTO_POOL).catch(() => {});
  return INITIAL_PHOTO_POOL;
}

/**
 * Persist Graphic Settings to LocalStorage
 */
export function saveGraphicSettings(settings: GraphicSettings): void {
  try {
    const toSave = { ...settings };
    // If photoUrl is an uncompressed base64 data URL (> 50KB), don't choke localStorage quota
    if (toSave.photoUrl && toSave.photoUrl.startsWith('data:image/') && toSave.photoUrl.length > 50000) {
      toSave.photoUrl = '';
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Could not save settings to localStorage:', e);
  }
}

/**
 * Load Graphic Settings from LocalStorage
 */
export function loadGraphicSettings(): Partial<GraphicSettings> | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read settings from localStorage:', e);
  }
  return null;
}
