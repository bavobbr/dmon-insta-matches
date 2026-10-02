import type { Express } from 'express';
import * as photoService from '../photos/photoService';
import { ServiceError } from '../errors/ServiceError';

export function registerPhotoRoutes(app: Express) {
  app.get('/api/photos', (req, res) => res.json(photoService.listPhotos()));
  app.post('/api/photos', (req, res) => {
    try {
      res.json(photoService.addPhoto(req.body));
    } catch (err: any) {
      if (err instanceof ServiceError) return res.status(err.status).json(err.body);
      console.error('Error saving photo:', err);
      res.status(500).json({ error: err.message });
    }
  });
  app.delete('/api/photos/:id', (req, res) => {
    try {
      res.json(photoService.deletePhoto(req.params.id));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post('/api/photos/reset', (req, res) => {
    try {
      res.json(photoService.resetPhotos());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
