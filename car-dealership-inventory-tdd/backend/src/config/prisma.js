import { PrismaClient } from '@prisma/client';
import { assertSafeTestDatabase } from './database-safety.js';

if (process.env.NODE_ENV === 'test') {
  assertSafeTestDatabase(
    process.env.ORIGINAL_DATABASE_URL,
    process.env.TEST_DATABASE_URL,
  );
}

const prisma = new PrismaClient();

export default prisma;
