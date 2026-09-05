// Simple typed error you can throw from any controller:
//   throw new ApiError(404, 'Product not found');
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Keep this as the LAST app.use() so Express treats it as the error handler.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  if (status === 500) {
    console.error('[unhandled error]', err);
  }
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}