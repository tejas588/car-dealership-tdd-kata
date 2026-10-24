# Car Dealership Inventory System — Test Plan (Phase 0)

> Phase 2 update: Database integration tests now cover the UUID `User` and `Vehicle` schema in `backend/tests/database.test.js`. Purchase history and its proposed model remain future work. `TEST_REPORT.md` contains actual Phase 2 execution results.

> Phase 3 update: `backend/tests/auth.test.js` and `backend/tests/authorization.test.js` cover registration, login, JWT checks, and role enforcement against the dedicated PostgreSQL test database. Vehicle and inventory API scenarios remain planned.

This is a plan, not a test execution report. No tests have been written or run. Backend tests will use Jest, Supertest, and a separate PostgreSQL test database. Frontend tests will use Vitest and React Testing Library.

## TDD workflow for each backend slice

1. Add focused tests for the next behavior and run them. Record the command, failing assertion, and why failure is expected (RED).
2. Implement the minimum production change, run focused tests, and record results (GREEN).
3. Improve structure without changing behavior; rerun focused and relevant regression tests and record results (REFACTOR).
4. Report real outcomes in `TEST_REPORT.md` when that phase is implemented. Do not claim coverage until measured.

Create fixtures per test, reset data between tests, and isolate the test database from development data. Assert status, response shape, and persisted state. For rejected writes, assert that no database change occurred. Use known secrets only in test configuration. Run concurrency tests with separate requests/connections so the test exercises a real race.

## Backend scenarios

| Feature | Success and boundary tests | Failure and security tests |
| --- | --- | --- |
| Registration | New email creates USER; email normalization; password stored as bcrypt hash and omitted from response | Duplicate email including case variation returns 409; concurrent duplicate requests create one user; missing/invalid email or password; role/unknown field rejected |
| Login | Correct credentials return signed, expiring JWT and safe user data; normalized email works | Unknown email and wrong password both return same 401; missing fields; hash/password never returned |
| Auth middleware | Valid token reaches protected route; ADMIN and USER identity loaded | No header, wrong scheme, malformed token, bad signature, expired token, missing user each return 401; no data leaked |
| Authorization | ADMIN reaches admin endpoints; USER can purchase and read | USER receives 403 for create/update/delete/restock, including nonexistent ID; unauthenticated gets 401 before resource lookup |
| Create vehicle | All fields persist; stock zero accepted; price normalized to two places | Missing/blank/oversize text; zero/negative/overprecision/oversize/nonnumeric price; negative/fractional/string/overflow stock; unknown field and supplied ID rejected |
| List vehicles | Empty list; multiple vehicles in stable ID order; default and explicit pagination; total count | Missing/invalid JWT; invalid page/limit, over-limit, unknown query parameter |
| Search | Single text, price, or stock filter; multiple filters intersect; inclusive price boundaries; case-insensitive trimmed text; empty match; stable pagination | Invalid price range; bad bounds, boolean, page, or limit; unknown filter; missing/invalid JWT |
| Update vehicle | Full replacement succeeds; stock zero accepted; price remains decimal; unchanged purchase history | Missing vehicle 404; malformed ID 400; omitted field or invalid values 400; USER 403; rejected request leaves row unchanged |
| Delete vehicle | Existing unpurchased vehicle yields 204 and is absent afterward | Missing vehicle 404; malformed ID 400; USER 403; purchased vehicle 409 and records preserved |
| Purchase | One unit decremented; purchase row records buyer and price snapshot; stock 1 becomes 0 | Zero stock 409 with no purchase; missing vehicle 404; malformed ID 400; unauthenticated 401; database failure rolls transaction back |
| Concurrent purchase | Two simultaneous requests for one remaining unit yield one 200 and one 409; final stock 0 and one purchase | Repeat race enough to detect unsafe read-then-write; no negative inventory or duplicate successful sale |
| Restock | Positive amount adds to current stock; zero-stock vehicle becomes available; concurrent increments do not lose updates | Zero/negative/fraction/string/overflow quantity 400; missing vehicle 404; USER 403; rejected request leaves stock unchanged |
| Concurrent inventory operations | Purchase with restock and purchase with full update finish in a valid serialized state | No lost updates, negative stock, or purchase record without corresponding decrement |
| Error handling | Standard error envelope and stable codes | Malformed JSON 400; unexpected database error 500 without stack trace, SQL, or credentials |

## Frontend scenarios

- Registration and login: valid submission, validation feedback, server error, loading state, token use, navigation, and logout.
- Vehicle dashboard: loading, empty, populated, and error states; combined filters; pagination; purchase success updates visible stock; out-of-stock button disabled; server-side stock conflict shown if another user buys first.
- Admin dashboard: role-based access; create/edit/delete/restock forms; validation feedback; success and error messages; inventory refresh after mutations.
- Routing: visitors redirected to login for protected pages; USER cannot open admin pages; ADMIN can use ordinary vehicle pages.
- Accessibility basics: labels, keyboard operation, focus management after form errors, and readable status messages.

## Coverage and execution gates

- Run focused tests for each Red–Green–Refactor step, then the relevant backend regression suite.
- Run backend integration tests against a dedicated PostgreSQL database, not development or production.
- Measure backend statement/branch coverage; target at least 85% meaningful coverage. Review uncovered security and inventory paths even if the percentage target is met.
- Run frontend tests and lint/format checks once those tools exist. Record exact commands, counts, failures, and coverage in `TEST_REPORT.md` during implementation.
- Never invent a RED/GREEN/REFACTOR result or mark a planned case as passing before execution.
