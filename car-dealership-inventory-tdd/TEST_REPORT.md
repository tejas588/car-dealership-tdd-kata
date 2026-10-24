# Test Report

## Phase 1: health check (2026-10-24)

Environment: Node.js v22.14.0; npm 11.4.2. Backend dependencies installed with `npm install` (472 packages added; audit reported 0 vulnerabilities).

| Stage | Command | Actual result |
| --- | --- | --- |
| RED | `npm test -- --silent` | 1 suite and 1 test failed. `GET /api/health` returned 404; the test expected 200. |
| GREEN | `npm test -- --silent` | 1 suite and 1 test passed after the minimum route was added to `app.js`. |
| REFACTOR | `npm test -- --silent` | 1 suite and 1 test passed after extracting the route into `src/routes/health.js`. |

`npm run test:coverage -- --silent` passed (1 suite, 1 test). Jest reported 100% statements, branches, functions, and lines for the current `app.js` and `routes/health.js`; this is a single-endpoint baseline, not coverage of the planned application. `npm run lint` passed. Frontend dependencies installed with `npm install` (67 packages added; audit reported 0 vulnerabilities), and `npm run build` passed. No integration database or frontend tests exist in Phase 1.
