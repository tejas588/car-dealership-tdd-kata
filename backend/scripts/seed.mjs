import 'dotenv/config';
import prisma from '../src/config/prisma.js';

const samples = [
  {
    make: 'Hyundai',
    model: 'Creta',
    category: 'SUV',
    price: '1150000.00',
    quantity: 8,
  },
  {
    make: 'Honda',
    model: 'City',
    category: 'Sedan',
    price: '1250000.00',
    quantity: 6,
  },
  {
    make: 'Tata',
    model: 'Nexon',
    category: 'SUV',
    price: '850000.00',
    quantity: 10,
  },
  {
    make: 'Maruti',
    model: 'Baleno',
    category: 'Hatchback',
    price: '700000.00',
    quantity: 12,
  },
  {
    make: 'Mahindra',
    model: 'XUV700',
    category: 'SUV',
    price: '1800000.00',
    quantity: 5,
  },
];

async function assertDevelopmentDatabase() {
  const developmentUrl = process.env.DATABASE_URL;
  if (
    !developmentUrl ||
    new URL(developmentUrl).pathname.slice(1) !== 'car_dealership'
  ) {
    throw new Error('Seeding is limited to car_dealership');
  }
  if (developmentUrl === process.env.TEST_DATABASE_URL) {
    throw new Error('Development and test databases must be separate');
  }
  const rows = await prisma.$queryRaw`SELECT current_database() AS name`;
  if (rows[0].name !== 'car_dealership') {
    throw new Error('Connected database is not car_dealership');
  }
}

try {
  await assertDevelopmentDatabase();
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
      created += 1;
    }
  }
  console.log(`Development seed complete: ${created} vehicles created`);
} catch {
  console.error('Development seed failed; details withheld');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
