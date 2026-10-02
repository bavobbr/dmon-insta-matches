import type { Express } from 'express';
import * as twizzitService from '../twizzit/twizzitService';
import { ServiceError } from '../errors/ServiceError';

export function registerTwizzitRoutes(app: Express) {
  app.get('/api/twizzit/status', async (req, res) => {
    try {
      res.json(await twizzitService.getStatus({ force: req.query.force === 'true' }));
    } catch (err: any) {
      res.status(500).json({ success: false, connected: false, error: err.message });
    }
  });
  app.get('/api/twizzit/matches', async (req, res) => {
    try {
      res.json(await twizzitService.getMatches({
        startDate: req.query.startDate as string, endDate: req.query.endDate as string,
        ttl: req.query.ttl, force: req.query.force === 'true',
      }));
    } catch (err: any) {
      console.error('Twizzit Fetch Error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post('/api/twizzit/cache/clear', (req, res) => res.json(twizzitService.clearCache()));
  app.get('/api/twizzit/cache/stats', (req, res) => res.json(twizzitService.getCacheStats()));
  app.post('/api/twizzit/cache/ttl', (req, res) => {
    try {
      res.json(twizzitService.updateDefaultTtl(req.body.ttlMinutes));
    } catch (err) {
      if (err instanceof ServiceError) return res.status(err.status).json(err.body);
      throw err;
    }
  });
}
