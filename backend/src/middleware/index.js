import mongoose from 'mongoose';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const CLIENT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * There is no login in this app, so every browser generates an anonymous id
 * and sends it in `X-Client-Id`. All task queries are scoped to that id so
 * visitors of the public demo don't see each other's tasks.
 */
export function requireClientId(req, _res, next) {
  const clientId = req.get('x-client-id');
  if (!clientId || !CLIENT_ID_RE.test(clientId)) {
    return next(new HttpError(400, 'Missing or invalid X-Client-Id header'));
  }
  req.clientId = clientId;
  next();
}

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid ${err.path}` });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
    ...(err.details && { details: err.details }),
  });
}
