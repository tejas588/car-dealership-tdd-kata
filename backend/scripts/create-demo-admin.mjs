
import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

try {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const url = new URL(connectionString);

  // Only allow explicitly confirmed Neon demo provisioning.
  if (
    !url.hostname.endsWith('.neon.tech') ||
    url.pathname !== '/neondb' ||
    process.env.CONFIRM_DEMO_ADMIN !== 'YES'
  ) {
    throw new Error('Demo admin provisioning is not authorized');
  }

  const rows = await prisma.$queryRaw`
    SELECT current_database() AS name
  `;

  if (rows[0].name !== 'neondb') {
    throw new Error('Unexpected database');
  }

  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (
    !name ||
    !email ||
    !password ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new Error('Missing or invalid admin credentials');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error('Admin email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Neon demo ADMIN user created successfully');
} catch (error) {
  console.error('Admin provisioning failed:', error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
