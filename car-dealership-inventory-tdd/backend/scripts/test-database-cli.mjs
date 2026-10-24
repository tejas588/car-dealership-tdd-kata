import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve('.env'), quiet: true });

const developmentUrl = process.env.DATABASE_URL;
const testUrl = process.env.TEST_DATABASE_URL;
if (!developmentUrl || !testUrl || developmentUrl === testUrl) {
  throw new Error('Separate development and test database URLs are required');
}
if (
  new URL(developmentUrl).pathname.slice(1) !== 'car_dealership' ||
  new URL(testUrl).pathname.slice(1) !== 'car_dealership_test'
) {
  throw new Error('Unexpected database target; migration cancelled');
}

const args = process.argv.slice(2);
if (
  args.join(' ') !== 'migrate deploy' &&
  args.join(' ') !== 'migrate status'
) {
  throw new Error('Only migrate deploy and migrate status are supported');
}

const result = spawnSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', ...args],
  {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testUrl },
  },
);
process.exitCode = result.status ?? 1;
