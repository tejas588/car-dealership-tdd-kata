# Test Report

## Phase 1: health check (2026-10-24)

Environment: Node.js v22.14.0; npm 11.4.2. Backend dependencies installed with `npm install` (472 packages added; audit reported 0 vulnerabilities).

| Stage | Command | Actual result |
| --- | --- | --- |
| RED | `npm test -- --silent` | 1 suite and 1 test failed. `GET /api/health` returned 404; the test expected 200. |
| GREEN | `npm test -- --silent` | 1 suite and 1 test passed after the minimum route was added to `app.js`. |
| REFACTOR | `npm test -- --silent` | 1 suite and 1 test passed after extracting the route into `src/routes/health.js`. |

`npm run test:coverage -- --silent` passed (1 suite, 1 test). Jest reported 100% statements, branches, functions, and lines for the current `app.js` and `routes/health.js`; this is a single-endpoint baseline, not coverage of the planned application. `npm run lint` passed. Frontend dependencies installed with `npm install` (67 packages added; audit reported 0 vulnerabilities), and `npm run build` passed. No integration database or frontend tests exist in Phase 1.

## Phase 2: PostgreSQL and Prisma (2026-10-24)

PostgreSQL 18.4; Prisma CLI and Client 6.19.0. The development and testing databases were previously created and verified separately. The same versioned migration `20261024121359_init` was applied with `npm run db:migrate:dev` and `npm run db:migrate:test`; both succeeded. `npm run db:status:test` reported the test schema up to date. `npm run db:validate` passed.

### Actual TDD sequence

| Stage | Command | Actual result |
| --- | --- | --- |
| RED: database tables | `npm test -- --silent tests/database.test.js` | 4 failed, 8 passed. User/Vehicle creation failed because the tables did not exist. The eight passes included rejection cases that could be false positives at this point. |
| GREEN: migration | `npm test -- --silent tests/database.test.js` | 12 passed after applying the migration to both databases. |
| Constraint assertion correction | `npm test -- --silent tests/database.test.js` | 6 failed, 6 passed after expecting Prisma code `P2004`; this Prisma version surfaced PostgreSQL CHECK errors as unknown request errors. |
| REFACTOR: constraint assertions | `npm test -- --silent tests/database.test.js` | 12 passed after asserting the actual named CHECK constraints. |
| RED: database safety guard | `npm test -- --silent tests/database-safety.test.js` | Suite failed to load because `database-safety.js` did not exist. |
| GREEN: database safety guard | `npm test -- --silent tests/database-safety.test.js` | 6 passed after implementing the guard. |
| REFACTOR: shared guard | `npm run test:coverage -- --silent` | 3 suites and 19 tests passed after using the same guard in test setup and Prisma configuration. |

Final coverage: 100% statements, 90.9% branches, 100% functions, 100% lines for included backend `src` files. `npm run lint`, `npm run format:check`, and frontend `npm run build` passed. `npm run db:seed` created 5 development vehicles on first run and 0 on second run. No admin was created; admin provisioning requires private credentials. The test suite cleans its own records and disconnects clients.

Dependency audit note: `npm audit --omit=dev --audit-level=high` reported 4 high advisories through Prisma 6's CLI/config dependency chain (`deepmerge-ts` and `effect`); npm suggests a breaking upgrade to Prisma 7. No forced upgrade was applied in Phase 2. The audit is unresolved and should be revisited before deployment.
