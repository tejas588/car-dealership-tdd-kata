import { HttpError } from '../utils/http-error.js';

export function errorHandler(error, _request, response, _next) {
  if (error instanceof HttpError) {
    return response.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' },
    });
  }
  return response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}
