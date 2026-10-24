import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

const userIds = [];
const uniqueEmail = () => `${randomUUID()}@example.test`;

afterAll(async () => {
  if (userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  test('creates a USER with a hashed password and no sensitive response fields', async () => {
    const email = uniqueEmail();
    const response = await request(app).post('/api/auth/register').send({
      name: '  Test User  ',
      email: email.toUpperCase(),
      password: 'correct-horse-123',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: { id: expect.any(String), name: 'Test User', email, role: 'USER' },
    });
    userIds.push(response.body.user.id);
    const stored = await prisma.user.findUnique({
      where: { id: response.body.user.id },
    });
    expect(stored.passwordHash).not.toBe('correct-horse-123');
    expect(await bcrypt.compare('correct-horse-123', stored.passwordHash)).toBe(
      true,
    );
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  test('rejects duplicate email regardless of case', async () => {
    const email = uniqueEmail();
    const first = await request(app).post('/api/auth/register').send({
      name: 'First User',
      email,
      password: 'correct-horse-123',
    });
    expect(first.status).toBe(201);
    userIds.push(first.body.user.id);

    const duplicate = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: email.toUpperCase(),
      password: 'correct-horse-456',
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  test('allows only one concurrent registration for the same email', async () => {
    const email = uniqueEmail();
    const responses = await Promise.all([
      request(app).post('/api/auth/register').send({
        name: 'First',
        email,
        password: 'correct-horse-123',
      }),
      request(app).post('/api/auth/register').send({
        name: 'Second',
        email,
        password: 'correct-horse-456',
      }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    userIds.push(
      responses.find((response) => response.status === 201).body.user.id,
    );
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  test.each([
    [
      'blank name',
      { name: '  ', email: uniqueEmail(), password: 'correct-horse-123' },
    ],
    [
      'invalid email',
      { name: 'Test', email: 'invalid', password: 'correct-horse-123' },
    ],
    [
      'short password',
      { name: 'Test', email: uniqueEmail(), password: 'short' },
    ],
    [
      'self-assigned role',
      {
        name: 'Test',
        email: uniqueEmail(),
        password: 'correct-horse-123',
        role: 'ADMIN',
      },
    ],
    [
      'unknown field',
      {
        name: 'Test',
        email: uniqueEmail(),
        password: 'correct-horse-123',
        isAdmin: true,
      },
    ],
  ])('rejects %s', async (_case, body) => {
    const response = await request(app).post('/api/auth/register').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects malformed JSON without exposing internals', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{invalid');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  const password = 'login-password-123';
  let email;

  beforeAll(async () => {
    email = uniqueEmail();
    const user = await prisma.user.create({
      data: {
        name: 'Login User',
        email,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    userIds.push(user.id);
  });

  test('returns a signed, expiring JWT and safe user details', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: email.toUpperCase(),
      password,
    });
    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: 'Login User',
      email,
      role: 'USER',
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
    const claims = jwt.verify(response.body.token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    expect(claims.sub).toBe(response.body.user.id);
    expect(claims.exp).toBeGreaterThan(claims.iat);
  });

  test.each([
    ['wrong password', () => ({ email, password: 'wrong-password' })],
    ['unknown email', () => ({ email: uniqueEmail(), password })],
  ])('returns the same 401 for %s', async (_case, body) => {
    const response = await request(app).post('/api/auth/login').send(body());
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  });

  test('rejects missing credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({ email });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
