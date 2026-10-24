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

## Phase 3: user authentication and JWT authorization (2026-10-24)

The authentication tests use the dedicated PostgreSQL test database and clean created users. No development users or admin accounts were created by tests.

| Stage | Command | Actual result |
| --- | --- | --- |
| RED: registration and login | `npm test -- --silent tests/auth.test.js` | 10 failed, 0 passed; both routes returned 404 before implementation. The failing tests were committed as `7d17aca`. |
| GREEN: registration and login | `npm test -- --silent tests/auth.test.js` | 10 passed after adding the layered routes, validation, bcrypt hashing, and JWT issuance. |
| RED: authorization middleware | `npm test -- --silent tests/authorization.test.js` | Suite failed to load because `authorization.js` did not yet exist. |
| GREEN: authorization middleware | `npm test -- --silent tests/authorization.test.js` | 8 passed after implementing token checks and database-backed role checks. |
| REFACTOR and regression | `npm run test:coverage -- --silent` | 5 suites and 40 tests passed after validation simplification and expanded regression cases; final coverage is recorded below. |

Final Phase 3 coverage: 94.44% statements, 86.76% branches, 100% functions, and 94.38% lines for included backend `src` files. `npm run lint`, `npm run format:check`, and frontend `npm run build` passed after correcting an unused Express error-handler parameter lint rule and formatting. The previous Prisma 6 audit advisory remains unresolved.

## Phase 4: vehicle listing, search, and admin CRUD (2026-10-24)

The vehicle integration tests use the separate PostgreSQL test database and clean their fixtures.

| Stage | Actual result |
| --- | --- |
| RED | `npm test -- --silent tests/vehicles.test.js`: 12 failed because routes were missing; one apparent 404 pass was not meaningful. Failing tests committed as `a1ca1f7`. |
| GREEN | Same command: 13 passed after implementing vehicle routes and layers. |
| Additional RED/GREEN | Oversized pagination offset returned 200 instead of 400 (1 failed, 17 passed); guard added, then 18 passed. |
| REFACTOR | Test fixtures made less dependent on order; vehicle suite passed 18/18. |

Final full-suite result: 6 suites and 58 tests passed, 0 failed. Coverage: 95.85% statements, 88.96% branches, 100% functions, 96.64% lines. Backend lint, formatting, and frontend build passed. Purchasing and restocking were not implemented. The Prisma 6 audit advisory remains unresolved.

## Inventory and frontend end-to-end phase (2026-10-24)

RED: `npm test -- --silent tests/inventory.test.js` returned 4 failures and one misleading 404 pass before purchase/restock routes existed. GREEN: after the `Purchase` migration was applied to both databases and atomic inventory logic was added, all 5 focused tests passed. A later test for deleting a purchased vehicle failed with 500 instead of 409; purchase-history protection fixed it, and 7/7 focused tests passed. The implementation was formatted and the full suites rerun.

Final backend: 7 suites, 65 tests passed, 0 failed; coverage 96.05% statements, 89.88% branches, 100% functions, 96.71% lines. Prisma validation, backend lint, and formatting passed. Frontend: 3 Vitest/React Testing Library tests passed; Vite production build passed. A temporary HTTP smoke test through Vite's `/api` proxy passed registration, login, listing, admin create, purchase, and restock; it removed its temporary records. The app and API returned HTTP 200 at `http://localhost:5173/` and its proxied `/api/health` endpoint. A screenshot was not captured because the local headless browser failed to write one. The earlier Prisma 6 audit advisory remains unresolved.
