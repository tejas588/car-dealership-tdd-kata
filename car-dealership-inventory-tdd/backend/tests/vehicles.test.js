import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

const users = [];
const vehicles = [];
let userToken;
let adminToken;
const data = {
  make: 'Honda',
  model: 'City',
  category: 'Sedan',
  price: '1200000.00',
  quantityInStock: 2,
};

beforeAll(async () => {
  for (const role of ['USER', 'ADMIN']) {
    const user = await prisma.user.create({
      data: {
        name: role,
        email: `${randomUUID()}@example.test`,
        passwordHash: 'test-only',
        role,
      },
    });
    users.push(user.id);
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      subject: user.id,
      expiresIn: '1h',
    });
    if (role === 'USER') userToken = token;
    else adminToken = token;
  }
});

afterAll(async () => {
  await prisma.vehicle.deleteMany({ where: { id: { in: vehicles } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

test('ADMIN creates a vehicle with normalized fields', async () => {
  const response = await request(app)
    .post('/api/vehicles')
    .set(auth(adminToken))
    .send({ ...data, make: ' Honda ' });
  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({
    make: 'Honda',
    price: '1200000.00',
    quantityInStock: 2,
  });
  vehicles.push(response.body.id);
});

test.each([
  ['zero price', { ...data, price: 0 }],
  ['negative price', { ...data, price: -1 }],
  ['fractional stock', { ...data, quantityInStock: 1.5 }],
  ['negative stock', { ...data, quantityInStock: -1 }],
  ['blank make', { ...data, make: ' ' }],
])('rejects %s', async (_case, body) => {
  const response = await request(app)
    .post('/api/vehicles')
    .set(auth(adminToken))
    .send(body);
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

test('requires ADMIN for writes and authentication for reads', async () => {
  expect(
    (await request(app).post('/api/vehicles').set(auth(userToken)).send(data))
      .status,
  ).toBe(403);
  expect((await request(app).get('/api/vehicles')).status).toBe(401);
});

test('lists vehicles with stable pagination', async () => {
  const created = await prisma.vehicle.create({
    data: {
      make: 'Tata',
      model: 'Nexon',
      category: 'SUV',
      price: '900000.00',
      quantity: 0,
    },
  });
  vehicles.push(created.id);
  const response = await request(app)
    .get('/api/vehicles?page=1&limit=1')
    .set(auth(userToken));
  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);
  expect(response.body.pagination).toMatchObject({ page: 1, limit: 1 });
  expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
});

test('combines search filters and returns an empty list for no matches', async () => {
  const response = await request(app)
    .get(
      '/api/vehicles/search?make=honda&category=sedan&minPrice=1200000&maxPrice=1200000&inStock=true',
    )
    .set(auth(userToken));
  expect(response.status).toBe(200);
  expect(response.body.data.some((vehicle) => vehicle.id === vehicles[0])).toBe(
    true,
  );
  const empty = await request(app)
    .get('/api/vehicles/search?make=NoSuchMake')
    .set(auth(userToken));
  expect(empty.body.data).toEqual([]);
});

test('rejects invalid search bounds', async () => {
  const response = await request(app)
    .get('/api/vehicles/search?minPrice=20&maxPrice=10')
    .set(auth(userToken));
  expect(response.status).toBe(400);
});

test('ADMIN replaces an existing vehicle', async () => {
  const response = await request(app)
    .put(`/api/vehicles/${vehicles[0]}`)
    .set(auth(adminToken))
    .send({ ...data, model: 'Civic', quantityInStock: 0 });
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({ model: 'Civic', quantityInStock: 0 });
});

test('returns 404 for updates and deletes of a missing vehicle', async () => {
  const id = randomUUID();
  expect(
    (
      await request(app)
        .put(`/api/vehicles/${id}`)
        .set(auth(adminToken))
        .send(data)
    ).status,
  ).toBe(404);
  expect(
    (await request(app).delete(`/api/vehicles/${id}`).set(auth(adminToken)))
      .status,
  ).toBe(404);
});

test('ADMIN deletes a vehicle', async () => {
  const response = await request(app)
    .delete(`/api/vehicles/${vehicles[0]}`)
    .set(auth(adminToken));
  expect(response.status).toBe(204);
  vehicles.shift();
});
