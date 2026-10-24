# Car Dealership Inventory System — Requirements (Phase 0)

> Phase 2 implementation update: The approved Phase 2 brief supersedes the initial database proposal below. Database IDs are UUIDs; `User` adds required `name`; vehicle stock is stored as `quantity` (the future API may map this to `quantityInStock`); the database currently has only `User` and `Vehicle`. The proposed `Purchase` model and associated deletion rule require a later phase and are not implemented yet. All API endpoint descriptions below remain proposals for later phases and must be reconciled with this schema before implementation.

This document defines the proposed contract for the Incubyte TDD kata. Phase 0 contains analysis only. No application code, database, or Git repository has been created.

## 1. Functional requirements

- A visitor can register as a `USER` and log in.
- An authenticated user can list vehicles, search and filter vehicles, and purchase one vehicle per request.
- An authenticated `ADMIN` can also create, update, delete, and restock vehicles.
- Each vehicle has a server-generated unique ID, make, model, category, price, and quantity in stock.
- Vehicle lists support combined filters and pagination. Stock changes must remain correct under concurrent requests.
- The frontend provides login, registration, vehicle dashboard, and admin dashboard pages. It shows loading, success, error, and empty states and disables purchase when displayed stock is zero. The server remains authoritative if stock changes after rendering.

## 2. Non-functional requirements

- Use JavaScript throughout: React, Vite, Tailwind CSS, Axios, React Router; Node.js, Express, PostgreSQL, Prisma; Jest/Supertest for backend and Vitest/React Testing Library for frontend.
- Keep routes, controllers, services, repositories, and database responsibilities separate without needless abstraction. Use centralized error handling and environment-based configuration.
- API JSON responses and errors must be consistent; never expose password hashes, JWT secrets, or raw database errors.
- Backend integration tests use a separate PostgreSQL test database. Target at least 85% meaningful backend coverage, with correctness of critical paths taking priority over the percentage.
- Follow and record Red–Green–Refactor for each backend feature. Preserve actual test results and accurate AI usage records. Before commits, present changes for review; never push without approval.
- The UI must be responsive and usable with keyboard controls and clear text feedback.

## 3. Roles and permissions

| Action | Visitor | USER | ADMIN |
| --- | --- | --- | --- |
| Register, log in | Yes | Yes | Yes |
| List and search vehicles | No | Yes | Yes |
| Purchase vehicle | No | Yes | Yes |
| Create, update, delete vehicle | No | No | Yes |
| Restock vehicle | No | No | Yes |

Registration always creates a `USER`. A supplied `role` field is rejected. Initial/admin account provisioning is an operational task using a controlled seed or script with credentials from the environment; no public admin registration endpoint exists.

## 4. REST API contract

All endpoints use JSON. Protected requests send `Authorization: Bearer <JWT>`. IDs are positive integer database IDs. Successful vehicle responses include `{ id, make, model, category, price, quantityInStock }`; `price` is a decimal string with two places to avoid floating-point ambiguity. The server never accepts an ID in vehicle creation. Error responses use `{ error: { code, message } }`; field errors may include `details` keyed by field. Passwords and hashes are never returned.

| Method and path | Access | Request | Success |
| --- | --- | --- | --- |
| `POST /api/auth/register` | Public | `{ email, password }` | `201` with `{ user: { id, email, role: "USER" } }` |
| `POST /api/auth/login` | Public | `{ email, password }` | `200` with `{ token, user: { id, email, role } }` |
| `POST /api/vehicles` | ADMIN | `{ make, model, category, price, quantityInStock }` | `201` with vehicle |
| `GET /api/vehicles` | USER, ADMIN | Optional `page`, `limit` | `200` with `{ data: [vehicle], pagination: { page, limit, total } }` |
| `GET /api/vehicles/search` | USER, ADMIN | Optional `make`, `model`, `category`, `minPrice`, `maxPrice`, `inStock`, `page`, `limit` | `200` with same list shape |
| `PUT /api/vehicles/:id` | ADMIN | Full replacement: `{ make, model, category, price, quantityInStock }` | `200` with updated vehicle |
| `DELETE /api/vehicles/:id` | ADMIN | No body | `204` with no body |
| `POST /api/vehicles/:id/purchase` | USER, ADMIN | No body; purchases exactly one unit | `200` with updated vehicle |
| `POST /api/vehicles/:id/restock` | ADMIN | `{ quantity }`, a positive integer | `200` with updated vehicle |

Search filters combine with AND. Text filters are case-insensitive exact matches after trimming. Omitted filters do not restrict results. Results are ordered by ascending ID for stable pagination. `inStock=true` means quantity greater than zero; `false` means zero. `minPrice` and `maxPrice` are inclusive. Empty results return `200` with `data: []`. Defaults: `page=1`, `limit=20`; maximum `limit=100`. The listing and search routes share the same pagination behavior.

## 5. Database entities and relationships

- `User`: `id` (primary key), `email` (unique, stored lowercase), `passwordHash`, `role` (`USER` or `ADMIN`), `createdAt`, `updatedAt`.
- `Vehicle`: `id` (primary key), `make`, `model`, `category`, `price` (`DECIMAL(12,2)`), `quantityInStock` (nonnegative integer), `createdAt`, `updatedAt`.
- `Purchase`: `id` (primary key), `userId` (foreign key to User), `vehicleId` (foreign key to Vehicle), `unitPrice` (`DECIMAL(12,2)` snapshot), `createdAt`. Each purchase records one unit. A user and vehicle can each have many purchases.
- Deleting a vehicle with purchase history is rejected with `409` to preserve the audit record. Deleting an unpurchased vehicle succeeds. Users with purchases are not deleted through this API.

Database constraints reinforce unique email, valid role, nonnegative stock, and positive price. Purchase creation and stock decrement occur in one transaction. Whether a `Purchase` history is exposed in a future API is outside this phase.

## 6. Input validation

- Email: required string, trimmed and lowercased, valid conventional email shape, maximum 254 characters. Duplicate comparison is case-insensitive through normalized storage and a unique database constraint.
- Password: required string, 8–72 characters; retain original characters (do not trim). Never return it.
- Vehicle `make`, `model`, `category`: required nonempty strings after trimming, maximum 100 characters each.
- Price: required positive decimal amount, at most two fractional digits, at most `9999999999.99`; reject zero, negatives, nonnumeric values, and values outside range. Accept a JSON number or decimal string, then store as decimal. No currency conversion is performed.
- `quantityInStock`: required integer from 0 to 2,147,483,647. Reject negatives, fractions, numeric strings, and overflow.
- Restock `quantity`: required integer from 1 to 2,147,483,647; reject an addition that would overflow the stock maximum.
- Path ID: positive integer within database ID range. Invalid syntax or range returns `400`.
- Search price bounds obey the price format and range; `minPrice <= maxPrice`. `inStock` accepts only literal `true` or `false`. `page` and `limit` are positive integer query strings, with `limit <= 100`. Unknown query filters and unknown body fields are rejected with `400` to catch typos.
- Malformed JSON returns `400`. Missing required fields, nulls, wrong types, and whitespace-only text return `400` with a stable validation error code.

## 7. HTTP status codes and specified edge behavior

| Condition | Status | Error code / behavior |
| --- | --- | --- |
| Successful create, read/update/purchase/restock, delete | `201`, `200`, `204` | As specified above |
| Bad JSON, input, query, or path ID | `400` | `VALIDATION_ERROR` |
| Missing, malformed, invalid, or expired JWT | `401` | `UNAUTHENTICATED` |
| Valid JWT for missing/deactivated user | `401` | `UNAUTHENTICATED` |
| Valid USER token on admin action | `403` | `FORBIDDEN` |
| Duplicate registration email | `409` | `EMAIL_ALREADY_EXISTS`; database uniqueness race maps here too |
| Invalid login email or password | `401` | `INVALID_CREDENTIALS`; same response for either cause |
| Valid ID but missing vehicle for update, delete, purchase, or restock | `404` | `VEHICLE_NOT_FOUND` |
| Purchase when stock is zero | `409` | `OUT_OF_STOCK`; stock and purchase history unchanged |
| Delete vehicle with purchase history | `409` | `VEHICLE_HAS_PURCHASES` |
| Unexpected server/database failure | `500` | `INTERNAL_ERROR`; no internals in response |

Authentication is checked before authorization and resource lookup, so unauthenticated requests receive `401` and unauthorized users receive `403` without revealing resource existence.

## 8. Security requirements

- Hash passwords with bcrypt; never store plaintext or return hashes. Compare hashes on login and use a generic invalid-credentials response.
- Sign JWTs with a secret from the environment, a finite expiry, and an explicit allowed algorithm. Verify signature and expiry on every protected request. Read role from the database after token validation so changed roles take effect.
- Use Prisma parameterized queries; do not concatenate user input into SQL. Enforce authorization on the server, regardless of frontend controls.
- Keep `.env`, secrets, credentials, and test database credentials out of Git. Provide only `.env.example` later.
- Use a controlled process to provision admins. Do not trust user-supplied role, price, stock, or identity fields.
- Handle transaction and uniqueness failures without leaking SQL, stack traces, or sensitive data.

## 9. Inventory business rules

- Initial stock may be zero. Price must be positive. Stock can never become negative.
- A purchase is for exactly one unit and records the buyer, vehicle, timestamp, and price at purchase time.
- Purchase succeeds only if stock is positive. The stock decrement is conditional and atomic. Purchase record creation is in the same transaction; on failure neither change persists.
- When two purchases race for the last unit, exactly one succeeds (`200`) and one receives `409 OUT_OF_STOCK`; final stock is zero and exactly one purchase is recorded.
- Restock adds a strictly positive quantity atomically. Update may replace stock with a nonnegative quantity; concurrent update and purchase must serialize or otherwise prevent lost stock changes. The final stock must match a valid order of those operations.
- Vehicle deletion is blocked when purchases reference it, retaining purchase history.

## 10. TDD process and coverage

`TEST_PLAN.md` maps each feature to tests. For every backend feature, first add a meaningful failing test and record its expected RED result; implement minimum behavior and record GREEN; refactor and rerun relevant tests, recording REFACTOR. Do not fabricate results or alter tests solely to accept incorrect behavior. Use separate test database setup and deterministic fixtures, including independent database connections for concurrency tests. Frontend tests should cover key user interactions and states.

## Decisions to confirm before Phase 1

The proposed contract specifies authenticated browsing, one unit per purchase, full `PUT` replacement, exact-match search filters, a purchase audit record, and deletion protection for vehicles with purchase history. These choices make the API and tests concrete; they can be revised during your Phase 0 review.
