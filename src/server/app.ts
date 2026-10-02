import { registerInstagramRoutes } from './routes/instagramRoutes';
import { registerAuthRoutes } from './routes/authRoutes';
import { registerPhotoRoutes } from './routes/photoRoutes';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import { registerTwizzitRoutes } from './routes/twizzitRoutes';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  const DATA_DIR = config.paths.data;
  const UPLOADS_DIR = config.paths.uploads;
  const GENERATED_DIR = config.paths.generated;
  for (const directory of [DATA_DIR, UPLOADS_DIR, GENERATED_DIR]) {
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  }

  registerAuthRoutes(app);

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  registerTwizzitRoutes(app);

  registerPhotoRoutes(app);

  registerInstagramRoutes(app);

  // Explicit static handlers for uploaded photos, generated graphics and public assets
  app.use('/generated', express.static(GENERATED_DIR, {
    setHeaders: (res, filePath) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
    }
  }));
  app.use('/uploads', express.static(UPLOADS_DIR, {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));
  app.use('/photos', express.static(config.paths.photos, {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));
  app.use(express.static(config.paths.public));

  return app;
}
