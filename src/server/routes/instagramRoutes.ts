import type { Express } from 'express';
import { instagramPublisher } from '../publishing/instagram/instagramPublisher';
import { getStatus } from '../publishing/instagram/instagramService';
import { ServiceError } from '../errors/ServiceError';

export function registerInstagramRoutes(app: Express) {
  app.get('/api/instagram/status', (req, res) => res.json(getStatus()));
  app.post('/api/instagram/publish', async (req, res) => {
    try {
      const { mediaType = 'STORY', caption, imageDataUrl } = req.body;
      // Preserve the public body shape; the application service consumes RenderedMedia.
      const media = { provider: 'canvas', mediaType: 'image' as const, mimeType: 'image/jpeg', dataUrl: imageDataUrl };
      const forwardedHost = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const forwardedProto = req.get('x-forwarded-proto') || req.protocol || 'https';
      res.json(await instagramPublisher.publish(media, { mediaType, caption, publicOrigin: `${forwardedProto}://${forwardedHost}` }));
    } catch (err: any) {
      if (err instanceof ServiceError) return res.status(err.status).json(err.body);
      console.error('[Instagram Publishing Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Onverwachte serverfout bij publiceren' });
    }
  });
}
