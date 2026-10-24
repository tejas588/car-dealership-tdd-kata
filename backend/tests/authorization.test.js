import { randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import prisma from '../src/config/prisma.js';
import { requireAuth, requireRole } from '../src/middleware/authorization.js';
import { errorHandler } from '../src/middleware/error-handler.js';

const app = express();
app.get('/private', requireAuth, (req, res) => res.json({ id: req.user.id }));
app.get('/admin', requireAuth, requireRole('ADMIN'), (_req, res) =>
  res.json({ ok: true }),
);
app.use(errorHandler);

const ids = [];
let user;
let admin;
const tokenFor = (id, options = {}) =>
  jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    subject: id,
    ...options,
  });

beforeAll(async () => {
  user = await prisma.user.create({
    data: {
      name: 'Auth User',
      email: `${randomUUID()}@example.test`,
      passwordHash: 'unused-test-hash',
    },
  });
  admin = await prisma.user.create({
    data: {
      name: 'Auth Admin',
      email: `${randomUUID()}@example.test`,
      passwordHash: 'unused-test-hash',
      role: 'ADMIN',
    },
  });
  ids.push(user.id, admin.id);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test('accepts a valid USER token and loads current user from database', async () => {
  const response = await request(app)
    .get('/private')
    .set('Authorization', `Bearer ${tokenFor(user.id)}`);
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ id: user.id });
});

test.each([
  ['missing header', undefined],
  ['wrong scheme', 'Basic something'],
  ['malformed token', 'Bearer invalid'],
  ['expired token', () => `Bearer ${tokenFor(user.id, { expiresIn: -1 })}`],
  ['unknown user', () => `Bearer ${tokenFor(randomUUID())}`],
])('rejects %s with 401', async (_case, authorization) => {
  const value =
    typeof authorization === 'function' ? authorization() : authorization;
  const call = request(app).get('/private');
  const response = await (value ? call.set('Authorization', value) : call);
  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHENTICATED');
});

test('forbids a USER on an ADMIN route despite a forged role claim', async () => {
  const token = jwt.sign({ role: 'ADMIN' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    subject: user.id,
  });
  const response = await request(app)
    .get('/admin')
    .set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(403);
  expect(response.body.error.code).toBe('FORBIDDEN');
});

test('accepts an ADMIN on an ADMIN route', async () => {
  const response = await request(app)
    .get('/admin')
    .set('Authorization', `Bearer ${tokenFor(admin.id)}`);
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ ok: true });
});
