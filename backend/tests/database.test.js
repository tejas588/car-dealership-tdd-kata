import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import prisma from '../src/config/prisma.js';

const userIds = [];
const vehicleIds = [];
const vehicleData = {
  make: 'Test Make',
  model: 'Test Model',
  category: 'SUV',
  price: '1200000.00',
};

afterAll(async () => {
  if (vehicleIds.length) {
    await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
  }
  if (userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await prisma.$disconnect();
});

test('connects to the dedicated PostgreSQL test database', async () => {
  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;
  expect(rows[0].name).toBe('car_dealership_test');
});

test('development and testing connections target different databases', async () => {
  const development = new PrismaClient({
    datasources: { db: { url: process.env.ORIGINAL_DATABASE_URL } },
  });
  try {
    const rows = await development.$queryRaw`SELECT current_database() AS name`;
    expect(rows[0].name).toBe('car_dealership');
    expect(rows[0].name).not.toBe('car_dealership_test');
  } finally {
    await development.$disconnect();
  }
});

test('creates a user with a database UUID, USER role, and timestamp', async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Database Test User',
      email: `${randomUUID()}@example.test`,
      passwordHash: 'test-hash-only',
    },
  });
  userIds.push(user.id);
  expect(user.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  expect(user.role).toBe('USER');
  expect(user.createdAt).toBeInstanceOf(Date);
});

test('rejects duplicate user emails', async () => {
  const email = `${randomUUID()}@example.test`;
  const first = await prisma.user.create({
    data: { name: 'First', email, passwordHash: 'test-hash-only' },
  });
  userIds.push(first.id);
  await expect(
    prisma.user.create({
      data: { name: 'Second', email, passwordHash: 'test-hash-only' },
    }),
  ).rejects.toMatchObject({ code: 'P2002' });
});

test('creates a vehicle with UUID, zero default quantity, and timestamps', async () => {
  const vehicle = await prisma.vehicle.create({ data: vehicleData });
  vehicleIds.push(vehicle.id);
  expect(vehicle.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  expect(vehicle.quantity).toBe(0);
  expect(vehicle.createdAt).toBeInstanceOf(Date);
  expect(vehicle.updatedAt).toBeInstanceOf(Date);
});

test.each([
  ['negative price', '-1.00', 0, 'Vehicle_price_positive'],
  ['zero price', '0.00', 0, 'Vehicle_price_positive'],
  ['negative quantity', '100.00', -1, 'Vehicle_quantity_nonnegative'],
])('database rejects %s', async (_case, price, quantity, constraint) => {
  await expect(
    prisma.vehicle.create({ data: { ...vehicleData, price, quantity } }),
  ).rejects.toThrow(constraint);
});

test.each(['make', 'model', 'category'])(
  'database rejects empty %s',
  async (field) => {
    await expect(
      prisma.vehicle.create({ data: { ...vehicleData, [field]: '' } }),
    ).rejects.toThrow(`Vehicle_${field}_nonempty`);
  },
);

test('updates updatedAt when a vehicle changes', async () => {
  const vehicle = await prisma.vehicle.create({ data: vehicleData });
  vehicleIds.push(vehicle.id);
  await new Promise((resolve) => setTimeout(resolve, 20));
  const updated = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { quantity: 2 },
  });
  expect(updated.updatedAt.getTime()).toBeGreaterThan(
    vehicle.updatedAt.getTime(),
  );
});
