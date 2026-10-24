import 'dotenv/config';
import { assertSafeTestDatabase } from '../src/config/database-safety.js';

const developmentUrl = process.env.DATABASE_URL;
const testUrl = process.env.TEST_DATABASE_URL;
assertSafeTestDatabase(developmentUrl, testUrl);

process.env.ORIGINAL_DATABASE_URL = developmentUrl;
process.env.DATABASE_URL = testUrl;
process.env.JWT_SECRET = 'test-only-jwt-secret-with-sufficient-length';
