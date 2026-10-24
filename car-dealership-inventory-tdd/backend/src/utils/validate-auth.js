import { HttpError } from './http-error.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validObject(body, allowedFields) {
  return (
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.keys(body).every((field) => allowedFields.includes(field))
  );
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function validateRegistration(body) {
  if (!validObject(body, ['name', 'email', 'password', 'role'])) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid registration input');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = normalizeEmail(body.email);
  if (
    'role' in body ||
    !name ||
    name.length > 100 ||
    !emailPattern.test(email) ||
    email.length > 254 ||
    typeof body.password !== 'string' ||
    body.password.length < 8 ||
    body.password.length > 72
  ) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid registration input');
  }
  return { name, email, password: body.password };
}

export function validateLogin(body) {
  if (!validObject(body, ['email', 'password'])) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid login input');
  }
  const email = normalizeEmail(body.email);
  if (
    !emailPattern.test(email) ||
    email.length > 254 ||
    typeof body.password !== 'string' ||
    !body.password
  ) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid login input');
  }
  return { email, password: body.password };
}
