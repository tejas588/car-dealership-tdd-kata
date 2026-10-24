# Car Dealership Inventory System

Phase 1 initializes a JavaScript monorepo for the Incubyte TDD kata. The backend currently exposes only a health check; authentication, vehicle APIs, database integration, and the full frontend are planned for later phases.

## Structure

- `backend/src/app.js` configures Express without opening a port, so Supertest can exercise it.
- `backend/src/server.js` loads environment variables and starts the HTTP server.
- `backend/src/routes/` contains the health route. `controllers/`, `services/`, `repositories/`, `middleware/`, `utils/`, and `config/` are reserved for later layers.
- `backend/tests/` contains Jest/Supertest tests; `backend/prisma/` is reserved for the future schema and migrations.
- `frontend/src/` contains a minimal React entry point. `components/`, `pages/`, `services/`, `hooks/`, and `context/` are reserved for later phases.
- `REQUIREMENTS.md`, `TEST_PLAN.md`, `TEST_REPORT.md`, and `PROMPTS.md` track the contract, planned tests, actual results, and AI conversation records.

## Setup and commands

Requires Node.js 22 or later and npm. From `backend/`:

```sh
npm install
cp .env.example .env
npm run dev
```

The backend listens on port 3000 by default. `GET http://localhost:3000/api/health` returns `{"status":"ok"}`. On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if preferred. The environment file is ignored by Git.

Backend commands: `npm start` (production), `npm test`, `npm run test:coverage`, `npm run lint`, and `npm run format:check`.

For the frontend scaffold, run `npm install` then `npm run dev` from `frontend/`. It currently displays a heading only.

## Technology and architecture

The backend uses Express, dotenv, Jest, Supertest, ESLint, and Prettier. The frontend scaffold uses React and Vite. Future backend features will follow routes → controllers → services → repositories → PostgreSQL via Prisma. Future phases will add Tailwind CSS, Axios, React Router, JWT, bcrypt, and the required pages.

## API

| Method | Path | Response |
| --- | --- | --- |
| GET | `/api/health` | `200 {"status":"ok"}` |

The planned API is specified in `REQUIREMENTS.md`.

## Testing and results

Run `npm test` from `backend/`. The Phase 1 RED, GREEN, and REFACTOR results are recorded in `TEST_REPORT.md`. Screenshots will be added when the user interface is implemented.

## My AI Usage

Codex assisted with Phase 0 requirements and the Phase 1 scaffold, test, and documentation. The raw prompt and response record belongs in `PROMPTS.md`; it must not be replaced with a generated summary. Future commits involving AI assistance must disclose that assistance in the body and use the required co-author trailer.
