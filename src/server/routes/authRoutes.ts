import type { Express } from 'express';
import * as authService from '../auth/authService';
import { ServiceError } from '../errors/ServiceError';

export function registerAuthRoutes(app: Express) {
  app.post('/api/auth/login', (req, res) => {
    try {
      res.json(authService.login(req.body));
    } catch (err) {
      if (err instanceof ServiceError) return res.status(err.status).json(err.body);
      throw err;
    }
  });
  app.get('/api/auth/verify', (req, res) => {
    try {
      res.json(authService.verify(req.headers.authorization));
    } catch (err) {
      if (err instanceof ServiceError) return res.status(err.status).json(err.body);
      throw err;
    }
  });
}
