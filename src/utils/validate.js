import { ApiError } from '../middleware/errorHandler.js';

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) {
    throw new ApiError(400, `Missing required field(s): ${missing.join(', ')}`);
  }
}

export function asNonNegativeNumber(value, fieldName) {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number`);
  }
  return num;
}