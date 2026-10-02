import type { PhotoPoolItem } from '../../shared/types/photos';

export const photosApi = {
  list(): Promise<Response> { return fetch('/api/photos'); },
  add(photo: PhotoPoolItem): Promise<Response> {
    return fetch('/api/photos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(photo) });
  },
  delete(id: string): Promise<Response> { return fetch(`/api/photos/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  reset(): Promise<Response> { return fetch('/api/photos/reset', { method: 'POST' }); },
};
