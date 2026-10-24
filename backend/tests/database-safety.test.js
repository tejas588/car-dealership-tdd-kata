import { assertSafeTestDatabase } from '../src/config/database-safety.js';

const development =
  'postgresql://example:placeholder@127.0.0.1:5432/car_dealership';
const testing =
  'postgresql://example:placeholder@127.0.0.1:5432/car_dealership_test';

test('accepts a separate dedicated test database', () => {
  expect(() => assertSafeTestDatabase(development, testing)).not.toThrow();
});

test.each([
  ['missing development URL', undefined, testing],
  ['missing test URL', development, undefined],
  ['same URLs', development, development],
  ['wrong development database', testing, testing],
  [
    'wrong test database',
    development,
    development.replace('car_dealership', 'other_db'),
  ],
])('rejects %s without exposing URLs', (_case, developmentUrl, testUrl) => {
  expect(() => assertSafeTestDatabase(developmentUrl, testUrl)).toThrow(
    'Separate car_dealership and car_dealership_test databases are required',
  );
});
