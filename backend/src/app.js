import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import taskRoutes from './routes/task.routes.js';
import { errorHandler, notFound } from './middleware/index.js';

export function createApp() {
  const app = express();

  const origins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.use(helmet());
  app.use(cors({ origin: origins.length ? origins : true }));
  app.use(express.json({ limit: '100kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/', (_req, res) => {
    res.json({
      name: 'Weekly To-Do API',
      health: '/api/health',
      endpoints: [
        'GET    /api/tasks?q=&from=&to=&status=',
        'GET    /api/tasks/weeks?tz=<IANA time zone>',
        'GET    /api/tasks/:id',
        'POST   /api/tasks',
        'PATCH  /api/tasks/:id',
        'DELETE /api/tasks/:id',
      ],
      note: 'All /api/tasks routes require an X-Client-Id header.',
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });

  app.use('/api/tasks', taskRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
