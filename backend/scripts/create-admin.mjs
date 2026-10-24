import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

try {
  const url = process.env.DATABASE_URL;
  if (!url || new URL(url).pathname.slice(1) !== 'car_dealership') {
    throw new Error(
      'Admin provisioning is limited to the development database',
    );
  }
  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;
  if (rows[0].name !== 'car_dealership') throw new Error('Unexpected database');

  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (
    !name ||
    !email ||
    !password ||
    password.length < 8 ||
    password.length > 72
  ) {
    throw new Error('Missing or invalid admin provisioning input');
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new Error('Admin email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, role: 'ADMIN' },
  });
  console.log('Development ADMIN user created');
} catch {
  console.error('Admin provisioning failed; details withheld');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
