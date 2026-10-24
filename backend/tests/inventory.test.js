import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

let user;
let admin;
let available;
let empty;
const ids = [];
const token = (id) =>
  jwt.sign({}, process.env.JWT_SECRET, { subject: id, expiresIn: '1h' });
const post = (path, id, body) =>
  request(app)
    .post(path)
    .set('Authorization', `Bearer ${token(id)}`)
    .send(body);

beforeAll(async () => {
  user = await prisma.user.create({
    data: {
      name: 'Buyer',
      email: `${randomUUID()}@example.test`,
      passwordHash: 'test-only',
    },
  });
  admin = await prisma.user.create({
    data: {
      name: 'Manager',
      email: `${randomUUID()}@example.test`,
      passwordHash: 'test-only',
      role: 'ADMIN',
    },
  });
  available = await prisma.vehicle.create({
    data: {
      make: 'Test',
      model: 'One',
      category: 'SUV',
      price: '100.00',
      quantity: 2,
    },
  });
  empty = await prisma.vehicle.create({
    data: {
      make: 'Test',
      model: 'Zero',
      category: 'SUV',
      price: '100.00',
      quantity: 0,
    },
  });
  ids.push(available.id, empty.id);
});

afterAll(async () => {
  if (prisma.purchase)
    await prisma.purchase.deleteMany({ where: { vehicleId: { in: ids } } });
  await prisma.vehicle.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: [user.id, admin.id] } } });
  await prisma.$disconnect();
});

test('purchases one vehicle and records the buyer and price', async () => {
  const response = await post(
    `/api/vehicles/${available.id}/purchase`,
    user.id,
  );
  expect(response.status).toBe(200);
  expect(response.body.quantityInStock).toBe(1);
  const purchase = await prisma.purchase.findFirst({
    where: { vehicleId: available.id },
  });
  expect(purchase.userId).toBe(user.id);
  expect(purchase.unitPrice.toFixed(2)).toBe('100.00');
});

test('rejects purchase at zero stock without a purchase record', async () => {
  const response = await post(`/api/vehicles/${empty.id}/purchase`, user.id);
  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('OUT_OF_STOCK');
  expect(await prisma.purchase.count({ where: { vehicleId: empty.id } })).toBe(
    0,
  );
});

test('only ADMIN restocks a positive quantity', async () => {
  expect(
    (await post(`/api/vehicles/${empty.id}/restock`, user.id, { quantity: 3 }))
      .status,
  ).toBe(403);
  expect(
    (await post(`/api/vehicles/${empty.id}/restock`, admin.id, { quantity: 0 }))
      .status,
  ).toBe(400);
  const response = await post(`/api/vehicles/${empty.id}/restock`, admin.id, {
    quantity: 3,
  });
  expect(response.status).toBe(200);
  expect(response.body.quantityInStock).toBe(3);
});

test('only one concurrent purchase gets the last unit', async () => {
  const vehicle = await prisma.vehicle.create({
    data: {
      make: 'Race',
      model: 'Last',
      category: 'SUV',
      price: '200.00',
      quantity: 1,
    },
  });
  ids.push(vehicle.id);
  const responses = await Promise.all([
    post(`/api/vehicles/${vehicle.id}/purchase`, user.id),
    post(`/api/vehicles/${vehicle.id}/purchase`, user.id),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    200, 409,
  ]);
  expect(
    (await prisma.vehicle.findUnique({ where: { id: vehicle.id } })).quantity,
  ).toBe(0);
  expect(
    await prisma.purchase.count({ where: { vehicleId: vehicle.id } }),
  ).toBe(1);
});

test('returns 404 for missing purchase and restock resources', async () => {
  const id = randomUUID();
  expect((await post(`/api/vehicles/${id}/purchase`, user.id)).status).toBe(
    404,
  );
  expect(
    (await post(`/api/vehicles/${id}/restock`, admin.id, { quantity: 1 }))
      .status,
  ).toBe(404);
});

test('preserves purchase history when deletion is attempted', async () => {
  const response = await request(app)
    .delete(`/api/vehicles/${available.id}`)
    .set('Authorization', `Bearer ${token(admin.id)}`);
  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('VEHICLE_HAS_PURCHASES');
  expect(
    await prisma.vehicle.findUnique({ where: { id: available.id } }),
  ).not.toBeNull();
});

test('rejects stock overflow without changing inventory', async () => {
  const response = await post(`/api/vehicles/${empty.id}/restock`, admin.id, {
    quantity: 2147483647,
  });
  expect(response.status).toBe(400);
  expect(
    (await prisma.vehicle.findUnique({ where: { id: empty.id } })).quantity,
  ).toBe(3);
});
