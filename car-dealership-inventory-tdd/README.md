# Car Dealership Inventory System

Phases 1–3 establish the JavaScript monorepo, PostgreSQL/Prisma database, and user authentication for the Incubyte TDD kata. Vehicle and inventory APIs and the full frontend are planned for later phases.

## Structure

- `backend/src/app.js` configures Express without opening a port, so Supertest can exercise it.
- `backend/src/server.js` loads environment variables and starts the HTTP server.
- `backend/src/routes/` contains health and authentication routes. Controllers, services, and repositories separate HTTP handling, rules, and data access. Middleware handles JWT authorization and errors. `src/config/prisma.js` exports a reusable Prisma Client.
- `backend/tests/` contains Jest/Supertest and PostgreSQL integration tests; `backend/prisma/` contains the versioned schema and migration.
- `frontend/src/` contains a minimal React entry point. `components/`, `pages/`, `services/`, `hooks/`, and `context/` are reserved for later phases.
- `REQUIREMENTS.md`, `TEST_PLAN.md`, `TEST_REPORT.md`, and `PROMPTS.md` track the contract, planned tests, actual results, and AI conversation records.

## Setup and commands

Requires Node.js 22 or later, npm, and a running PostgreSQL server. Create separate local databases named `car_dealership` and `car_dealership_test`. From `backend/`:

```sh
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:test
npm run db:seed
npm run dev
```

Edit `.env` locally with working `DATABASE_URL` and `TEST_DATABASE_URL` connection strings and a long random `JWT_SECRET`. Do not commit or share it. `TEST_DATABASE_URL` must target `car_dealership_test`; the test and test-migration scripts reject unexpected targets. On Windows PowerShell, `Copy-Item .env.example .env` copies the template. The backend listens on port 3000 by default. `GET http://localhost:3000/api/health` returns `{"status":"ok"}`.

Backend commands: `npm start` (production), `npm test`, `npm run test:coverage`, `npm run lint`, and `npm run format:check`. Database commands: `npm run db:validate`, `npm run db:generate`, `npm run db:migrate:dev`, `npm run db:migrate:test`, `npm run db:status:test`, and `npm run db:seed`. Migrations use versioned SQL; do not replace them with `prisma db push`.

`npm run db:seed` adds five sample vehicles only to `car_dealership` and skips matching records on rerun. To create an admin for development, set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` privately in the current shell and run `npm run db:create-admin`. The script hashes the password with bcrypt and refuses an existing email. Do not type the password directly into a command argument or commit it to a file. For example, PowerShell can prompt privately with `Read-Host -AsSecureString`; clear the temporary environment variable after provisioning. No admin account is created automatically.

The database currently has `User` (UUID, name, unique email, password hash, role defaulting to USER, creation timestamp) and `Vehicle` (UUID, make, model, category, decimal price, quantity, creation and update timestamps). The initial migration adds PostgreSQL checks for positive price, nonnegative quantity, and nonempty vehicle text fields. The purchase audit model is deferred to a later phase.

For the frontend scaffold, run `npm install` then `npm run dev` from `frontend/`. It currently displays a heading only.

## Technology and architecture

The backend uses Express, dotenv, Prisma, bcrypt, JWT, Jest, Supertest, ESLint, and Prettier. The frontend scaffold uses React and Vite. Backend features follow routes → controllers → services → repositories → PostgreSQL via Prisma. Future phases will add Tailwind CSS, Axios, React Router, and the required pages.

## API

| Method | Path | Response |
| --- | --- | --- |
| GET | `/api/health` | `200 {"status":"ok"}` |
| POST | `/api/auth/register` | `201` with safe user details |
| POST | `/api/auth/login` | `200` with a JWT and safe user details |

Register with JSON `{ "name": "Your Name", "email": "you@example.com", "password": "at-least-8-characters" }`. Login with `email` and `password`. Registration always creates a USER; sending a role is rejected. JWTs expire after one hour. Future protected routes will require `Authorization: Bearer <token>`; middleware verifies the token and reads the current role from PostgreSQL. The remaining planned API is specified in `REQUIREMENTS.md`.

## Testing and results

Run `npm run db:migrate:test` followed by `npm test` from `backend/`. Database tests connect to the real test database, clean their records, and close clients. Actual results are recorded in `TEST_REPORT.md`. Screenshots will be added when the user interface is implemented.

## My AI Usage

Codex assisted with Phase 0 requirements, the Phase 1 scaffold, Phase 2 database integration, and Phase 3 authentication tests, code, and documentation. AI helped structure tests and implement the layers quickly; actual failures, passing results, and database effects were checked before reporting them. The raw prompt and response record belongs in `PROMPTS.md`; it must not be replaced with a generated summary. If ChatGPT was used separately, its actual prompts and responses must be added by the user. Future commits involving AI assistance must disclose that assistance in the body and use the required co-author trailer.
