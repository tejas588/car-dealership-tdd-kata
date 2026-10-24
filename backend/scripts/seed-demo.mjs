
import 'dotenv/config';
import prisma from '../src/config/prisma.js';

const samples = [
  { make: 'Hyundai', model: 'Creta', category: 'SUV', price: '1150000.00', quantity: 8 },
  { make: 'Honda', model: 'City', category: 'Sedan', price: '1250000.00', quantity: 6 },
  { make: 'Tata', model: 'Nexon', category: 'SUV', price: '850000.00', quantity: 10 },
  { make: 'Maruti', model: 'Baleno', category: 'Hatchback', price: '700000.00', quantity: 12 },
  { make: 'Mahindra', model: 'XUV700', category: 'SUV', price: '1800000.00', quantity: 5 },
];

async function seedDemo() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const url = new URL(connectionString);

  if (
    !url.hostname.endsWith('.neon.tech') ||
    url.pathname !== '/neondb' ||
    process.env.CONFIRM_DEMO_SEED !== 'YES'
  ) {
    throw new Error('Demo seed requires confirmed Neon database');
  }

  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;

  if (rows[0].name !== 'neondb') {
    throw new Error('Connected database is not neondb');
  }

  let created = 0;

  for (const sample of samples) {
    const existing = await prisma.vehicle.findFirst({
      where: {
        make: sample.make,
        model: sample.model,
        category: sample.category,
      },
    });

    if (!existing) {
      await prisma.vehicle.create({ data: sample });
      created++;
    }
  }

  console.log(`Demo seed complete: ${created} vehicles created`);
}

try {
  await seedDemo();
} catch (error) {
  console.error('Demo seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
