import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './src/server/config/env';
import { createApp } from './src/server/app';

const app = createApp();
const PORT = 3000;

async function startServer() {
  if (!config.production) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = config.paths.dist;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`D-Mon Hockey Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
