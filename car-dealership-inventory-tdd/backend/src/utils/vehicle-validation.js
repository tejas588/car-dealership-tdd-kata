import { HttpError } from './http-error.js';

const fail = () => {
  throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid vehicle input');
};
const fields = ['make', 'model', 'category', 'price', 'quantityInStock'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decimal(value, allowZero = false) {
  if (typeof value !== 'string' && typeof value !== 'number') fail();
  const text = String(value);
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) fail();
  const amount = Number(text);
  if (
    !Number.isFinite(amount) ||
    (!allowZero && amount <= 0) ||
    amount > 9999999999.99
  )
    fail();
  return amount.toFixed(2);
}

export function vehicleInput(body) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).length !== fields.length ||
    Object.keys(body).some((key) => !fields.includes(key))
  )
    fail();
  const result = {};
  for (const field of ['make', 'model', 'category']) {
    if (
      typeof body[field] !== 'string' ||
      !body[field].trim() ||
      body[field].trim().length > 100
    )
      fail();
    result[field] = body[field].trim();
  }
  result.price = decimal(body.price);
  if (
    !Number.isInteger(body.quantityInStock) ||
    body.quantityInStock < 0 ||
    body.quantityInStock > 2147483647
  )
    fail();
  result.quantity = body.quantityInStock;
  return result;
}

export function vehicleId(id) {
  if (!uuid.test(id)) fail();
  return id;
}

export function listQuery(query, search = false) {
  const allowed = search
    ? [
        'page',
        'limit',
        'make',
        'model',
        'category',
        'minPrice',
        'maxPrice',
        'inStock',
      ]
    : ['page', 'limit'];
  if (Object.keys(query).some((key) => !allowed.includes(key))) fail();
  const integer = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (
      typeof value !== 'string' ||
      !/^[1-9]\d*$/.test(value) ||
      Number(value) > max
    )
      fail();
    return Number(value);
  };
  const page = integer(query.page, 1, 2147483647);
  const limit = integer(query.limit, 20, 100);
  if ((page - 1) * limit > 2147483647) fail();
  const where = {};
  if (search) {
    for (const field of ['make', 'model', 'category']) {
      if (query[field] !== undefined) {
        if (typeof query[field] !== 'string' || !query[field].trim()) fail();
        where[field] = { equals: query[field].trim(), mode: 'insensitive' };
      }
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined)
        where.price.gte = decimal(query.minPrice, true);
      if (query.maxPrice !== undefined)
        where.price.lte = decimal(query.maxPrice, true);
      if (
        where.price.gte &&
        where.price.lte &&
        Number(where.price.gte) > Number(where.price.lte)
      )
        fail();
    }
    if (query.inStock !== undefined) {
      if (query.inStock !== 'true' && query.inStock !== 'false') fail();
      where.quantity = query.inStock === 'true' ? { gt: 0 } : { equals: 0 };
    }
  }
  return { where, page, limit };
}
