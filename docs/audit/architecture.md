# Architecture — Audit Report

**Agent**: engineering-software-architect
**Date**: 2026-07-15
**Baseline commit**: 28e02a2
**Branch**: feat/kensho-rebrand
**Scope**: Backend layering and authorization topology (`backend/src/**`), frontend layering and state/HTTP boundary (`frontend/src/**`), `schema.prisma` diagnosis (read-only, no edits), and the Jest + Supertest suite. No source file, schema file, or git state was modified. This report is the only file written.
**Method**: Read in full — `CLAUDE.md`; `backend/prisma/schema.prisma`; `backend/src/index.js`; all 8 controllers (`auth`, `karateca`, `asistencia`, `mensualidad`, `poliza`, `dashboard`, `config`); all 8 route files; `auth.middleware.js`; `role.middleware.js`; `lib/prisma.js`; `utils/jwt.js`; `jest.config.js`; `backend/package.json`; both test files (`src/tests/auth.test.js`, `src/tests/karateca.test.js`); `frontend/src/App.jsx`, `lib/api.js`, `store/authStore.js`, `routes/ProtectedRoute.jsx`, `tailwind.config.js`, `pages/sensei/Mensualidades.jsx`, `pages/karateca/Dashboard.jsx` (partial: lines 105–134, 265–282). Commands run verbatim: `npm test` (in `backend/`); `npx jest --coverage --runInBand --collectCoverageFrom='src/**/*.js'`; greps for `prisma.user.` call sites, duplicate helper definitions, `CREATE INDEX|CREATE UNIQUE INDEX` and `DECIMAL` across `prisma/migrations/`, arbitrary-hex vs `dojo-*` token usage in `frontend/src`, and `api.(get|post|put|patch|delete)` call sites per page. No git command was run. No network calls were made.

## Summary

- **The layering is conventional and consistent**: `routes → middleware → controller → Prisma`. There is no service layer; business logic lives in the controllers, and a meaningful amount of domain logic also lives in the frontend pages. For a single-dojo app of this size that is a defensible decision, not a defect — see ADR candidates.
- **One Critical finding**: `GET /api/karatecas` is gated by authentication only, not by role (`karateca.routes.js:8`). Any logged-in student can list every other student, and that payload includes `numeroDocumento` (`karateca.controller.js:4-17`) — which is the login identifier (`auth.controller.js:13`). This is a credential-enumeration path, not just a data leak. The list endpoint is called only by the sensei UI, so gating it is ~10 minutes.
- **CLAUDE.md is wrong on two points, with evidence.** (1) The `User.password` hash is **not** exposed by any endpoint — all 7 `User` query sites were audited and every one either selects explicitly or strips the field. (2) The frontend palette **is** tokenized: `tailwind.config.js:6-14` defines `dojo.*` and the codebase has 305 token usages against 19 arbitrary hex values confined to 2 files.
- **All 7 schema issues listed in CLAUDE.md are confirmed against the file and the migration SQL**, including `DECIMAL(65,30)` for money (`migrations/20260321143821_init/migration.sql:53`). One issue is missing from CLAUDE.md's list and is added below (ARCH-09). Diagnosis only — the schema was not touched.
- **The 26 tests pass in 1.2s with no DB and no network** (Prisma is mocked), but they cover **15.72% of statements** and — decisively — `karateca.test.js:39-44` mocks the auth and role middleware out entirely. The suite is structurally incapable of detecting ARCH-01 or ARCH-02.

## Findings

| ID | Finding | Severity | Evidence | Today/Backlog | Effort |
|----|---------|----------|----------|---------------|--------|
| ARCH-01 | `GET /api/karatecas` requires auth but not `SENSEI`; response includes every student's `numeroDocumento`, which is the login key | Critical | `karateca.routes.js:8`; `karateca.controller.js:4-17,22-29`; `auth.controller.js:13` | Today | 10 min + smoke |
| ARCH-02 | Per-record endpoints take an `:id` from the URL with no ownership check; a student can read any other student's record, attendance, fees, policies | High | `karateca.routes.js:9`; `asistencia.routes.js:10`; `mensualidad.routes.js:11`; `poliza.routes.js:9` | Backlog | 2–3 h |
| ARCH-03 | Karateca dashboard endpoint omits `tipoDocumento`/`numeroDocumento`, forcing the student UI to call the sensei-grade `GET /karatecas/:id` to fill the gap — this coupling is what makes ARCH-02 hard to fix | High | `dashboard.controller.js:173-181`; `pages/karateca/Dashboard.jsx:114-126` | Today | 15 min + smoke |
| ARCH-04 | Sensei-only read endpoints gated by auth only: `/mensualidades/mes`, `/asistencias/fecha`, `/asistencias/fechas`, `/polizas`, `/inventario`, `/config/:clave` | High | `mensualidad.routes.js:8`; `asistencia.routes.js:8-9`; `poliza.routes.js:8`; `inventario.routes.js:8`; `config.routes.js:9` | Today | 20 min + smoke |
| ARCH-05 | Tests mock out `auth.middleware` and `role.middleware`, so zero authorization behaviour is asserted anywhere in the suite | High | `karateca.test.js:39-44` | Today | 45 min |
| ARCH-06 | Statement coverage 15.72%; 5 of 8 controllers at 0% (`asistencia`, `mensualidad`, `poliza`, `dashboard`, `inventario`, `config`) | Medium | `npx jest --coverage` output | Backlog | 4–6 h |
| ARCH-07 | `numeroDocumento` is `String?` nullable yet is the login key; `email` is required and unused for auth (CONFIRMED) | High | `schema.prisma:29,33`; `auth.controller.js:13` | Backlog (migration) | 1 h + migration |
| ARCH-08 | No `@@unique([karatecaId, mes])` on `Mensualidad`; no `@@unique([karatecaId, fecha])` on `Asistencia`; uniqueness enforced only by read-then-write in app code, which races (CONFIRMED) | High | `schema.prisma:67-75,57-65`; `mensualidad.controller.js:143-167`; `asistencia.controller.js:145-169` | Backlog (migration) | 1–2 h + migration |
| ARCH-09 | **Not in CLAUDE.md**: no `onDelete` referential actions on any relation; deletion is hand-rolled in a transaction that must delete in the right order, and it deletes attendance rows *registered by* the user | Medium | `schema.prisma:45,60,64,69,80`; `karateca.controller.js:339-354` | Backlog (migration) | 1 h + migration |
| ARCH-10 | No indexes beyond the 4 unique keys Prisma generated; `Asistencia` is queried by `karatecaId` + `fecha` range and grows 1 row/student/day (CONFIRMED) | Medium | `grep 'CREATE INDEX' migrations/` → zero hits; only 4 `CREATE UNIQUE INDEX`; `asistencia.controller.js:194` | Backlog (migration) | 30 min + migration |
| ARCH-11 | `monto Decimal` without `@db.Decimal(10,2)` → Postgres created `DECIMAL(65,30)` for money (CONFIRMED at the SQL level) | Medium | `schema.prisma:72`; `migrations/20260321143821_init/migration.sql:53` | Backlog (migration) | 30 min + migration |
| ARCH-12 | `mes String` format unvalidated at the DB; enforced by 3 separately-declared regexes in app code | Medium | `schema.prisma:71`; `mensualidad.controller.js:4`; `karateca.controller.js:73`; `asistencia.controller.js:25` | Backlog | 1 h |
| ARCH-13 | `updatedAt` present only on `Inventario` and `Config`; absent on the other 5 models — no audit trail on money or attendance (CONFIRMED) | Medium | `schema.prisma:94,101` vs `26-40,42-55,57-65,67-75,77-85` | Backlog (migration) | 30 min + migration |
| ARCH-14 | `estadoPoliza` duplicated verbatim in 2 controllers; `userSelectPublic` declared 4 times with **divergent** field sets; `mesActualString` twice; `ymdLocal`/`fechaKeyLocal` are the same function under 2 names | Medium | `dashboard.controller.js:17` & `poliza.controller.js:16`; `userSelectPublic` at `karateca:4`, `asistencia:3`, `poliza:3`, `mensualidad:6`; `dashboard.controller.js:7` & `asistencia.controller.js:37` | Today | 45 min |
| ARCH-15 | `GET /dashboard/resumen` loads the full `Asistencia` and `Mensualidad` tables into Node and aggregates in JS; no date bound, no `groupBy` | Medium | `dashboard.controller.js:69-74,98-138` | Backlog | 2 h |
| ARCH-16 | `getResumenKarateca` fetches **every** attendance row in the DB to compute one student's percentage | Medium | `dashboard.controller.js:202-204,215-223` | Backlog | 30 min |
| ARCH-17 | No centralized Express error handler; every controller repeats try/catch → `500 {message:'Error del servidor'}`, and 2 handlers leak `err.message` to the client | Medium | `karateca.controller.js:33,328`; `index.js:16-32` (no `app.use((err,...))`) | Backlog | 1 h |
| ARCH-18 | `app.use(cors())` with no origin allowlist → `access-control-allow-origin: *` (CONFIRMED at source); no `helmet()` | Medium | `index.js:18` | Backlog (infra) | 30 min |
| ARCH-19 | `docs/API.md` documents a base URL host that does not exist (`budokan-backend.up.railway.app`) | Low | `backend/docs/API.md:3` | Today | 2 min |
| ARCH-20 | `frontend/.env.production` contains `envVITE_API_URL=` — malformed name, Vite can never expose it (CONFIRMED) | Low | `frontend/.env.production:1` | Today | 5 min |
| ARCH-21 | **CLAUDE.md is wrong**: no endpoint exposes the bcrypt hash. All 7 `User` query sites audited | Low (correction) | `auth.controller.js:13→24`, `:37-49`, `:71-74`, `:109`; `karateca.controller.js:117-118`, `:195-198`, `:130-143` | Today (correct the doc) | 5 min |
| ARCH-22 | **CLAUDE.md is wrong**: the palette is already tokenized — 305 `dojo-*` usages vs 19 arbitrary hex in 2 files | Low (correction) | `tailwind.config.js:6-14`; grep counts; hex confined to `pages/sensei/Inventario.jsx`, `routes/ProtectedRoute.jsx:9` | Today (correct the doc) | 20 min to finish |

## Detail

### ARCH-01 — `GET /api/karatecas` leaks every student's login identifier (Critical)

**What it is.** `karateca.routes.js:8` reads `router.get('/', authMiddleware, karatecaController.getAll);`. Compare line 10: `router.post('/', authMiddleware, requireRole('SENSEI'), ...)`. The write path is role-gated; the list path is not. `getAll` (`karateca.controller.js:22-29`) includes `user: userSelectPublic`, and that projection — uniquely among the four copies of `userSelectPublic` in this codebase — includes `numeroDocumento` (`karateca.controller.js:4-17`).

**Why it matters.** `numeroDocumento` is not incidental PII here; it is the username. `auth.controller.js:13` authenticates with `prisma.user.findUnique({ where: { numeroDocumento: doc } })`. So any student who logs in can retrieve the login identifier of every other student and the sensei in one request. That reduces the account-takeover problem to guessing a password with no rate limiting present. It is also Colombian national-ID data for what may be a roster of minors (`TIPOS_DOC_KARATECA` at `karateca.controller.js:72` includes `TI`, the minors' document type).

**What it costs to fix.** ~10 minutes. I verified via grep that `GET /karatecas` (the collection) is called from exactly one place in the frontend: `pages/sensei/Karatecas.jsx:50` (`/karatecas?incluirInactivos=true`). No karateca page calls it. Adding `requireRole('SENSEI')` to `karateca.routes.js:8` does not break the student UI.

**What breaks if fixed wrong.** Do **not** apply the same one-line fix to line 9 (`GET /:id`). The student dashboard calls that endpoint for its own record (`pages/karateca/Dashboard.jsx:115`); adding `requireRole('SENSEI')` there returns 403 and breaks the student dashboard for every user. Line 9 needs ARCH-02's ownership check, not a role gate. This distinction is the whole reason ARCH-01 is Today and ARCH-02 is Backlog.

### ARCH-02 — No object-level ownership check on per-record endpoints (High)

**What it is.** Four routes accept an `:id` and scope the query solely by that path parameter, with the caller's identity never consulted:
- `karateca.routes.js:9` → `getById` (`karateca.controller.js:44-59`) — returns the record plus `asistencias`, `mensualidades`, `polizas`, and `numeroDocumento`.
- `asistencia.routes.js:10` → `getByKarateca` (`asistencia.controller.js:197-205`).
- `mensualidad.routes.js:11` → `getByKarateca` (`mensualidad.controller.js:207-210`).
- `poliza.routes.js:9` → `getByKarateca` (`poliza.controller.js:85-88`).

The auth middleware puts `{ userId, rol }` on `req.user` (`auth.middleware.js:12`), and `requireRole` only ever compares `req.user.rol` (`role.middleware.js:3`). Nothing in the stack can express "this row belongs to this caller". A student changing the `:id` in the URL reads another student's fee history and policy.

**Why it matters.** This is the classic broken-object-level-authorization pattern. It is invisible in the UI — the frontend always passes the user's own id — which is exactly why it survives to production.

**What it costs to fix.** 2–3 hours, because it is a missing abstraction rather than a missing line. The shape: resolve `req.user.userId` → the caller's `karatecaId` once, then in each handler require `rol === 'SENSEI' || karatecaId === id`. All four routes are called by *both* roles' UIs (`pages/karateca/*` for the student's own id; `pages/sensei/Polizas.jsx:77` for the sensei), so a role gate is not available as a shortcut.

**What breaks if fixed wrong.** Two traps. First, resolving ownership by comparing `req.user.userId` to the `:id` parameter is wrong — those are different key spaces (`User.id` vs `Karateca.id`), and `schema.prisma:44-45` shows they are distinct autoincrement sequences that will coincide for early rows and silently diverge later. Any test written against seed data where `userId === karatecaId` will pass while the logic is wrong. Second, gate ARCH-03 first: while the student dashboard still needs `GET /karatecas/:id` to obtain its own document number, an ownership check there must permit self-access, so the two changes must be sequenced.

### ARCH-03 — A data gap in the student dashboard forces the student UI onto a sensei-grade endpoint (High)

**What it is.** `getResumenKarateca` projects the user through `userKaratecaDashboardSelect` (`dashboard.controller.js:173-181`), which selects `nombre`, `email`, `telefono`, `fechaNacimiento`, `fechaIngreso` — but not `tipoDocumento` or `numeroDocumento`. The student dashboard needs those two fields, so it issues a second request to fill the hole (`pages/karateca/Dashboard.jsx:114-126`), reading `full.user?.tipoDocumento` and `full.user?.numeroDocumento` from `GET /karatecas/${d.karateca.id}`.

**Why it matters.** This is the architectural root of ARCH-02's difficulty. `/dashboard/karateca` is the one endpoint that is already correctly scoped — it derives the record from `req.user.userId` and never trusts a path parameter (`dashboard.controller.js:184-195`). It is the right pattern. But because it is missing two fields, the student UI is pushed onto an id-addressed endpoint that cannot be role-gated as long as that dependency exists. A missing field in a projection is propping open a hole four routes wide.

**What it costs to fix.** ~15 minutes: add `tipoDocumento: true, numeroDocumento: true` to `userKaratecaDashboardSelect`, then delete the second request at `pages/karateca/Dashboard.jsx:115` and the merge block at `:116-126`. This is a strictly additive change to a self-scoped endpoint.

**What breaks if fixed wrong.** The merge at `:122-123` uses `full.user?.X ?? d.karateca.user?.X`, so once the dashboard payload carries the fields the fallback is dead code — but leaving the second request in place while adding the fields means the UI still hits `/karatecas/:id` and the coupling survives. Remove both halves or the fix buys nothing. After this lands, `GET /karatecas/:id` has no student caller, which changes ARCH-02's cost materially.

### ARCH-04 — Sensei-only read endpoints gated by authentication only (High)

**What it is.** Six read endpoints require a token but no role: `/mensualidades/mes` (`mensualidad.routes.js:8`), `/asistencias/fecha` and `/asistencias/fechas` (`asistencia.routes.js:8-9`), `/polizas` (`poliza.routes.js:8`), `/inventario` (`inventario.routes.js:8`), `/config/:clave` (`config.routes.js:9`). `GET /mensualidades/mes` returns every active student's payment status and arrears flag for a month (`mensualidad.controller.js:63-92`); `/polizas` returns the whole roster with policy status (`poliza.controller.js:45-71`).

**Why it matters.** The dashboard routes show the intended pattern is understood — `dashboard.routes.js:8-9` gates both sides explicitly (`requireRole('SENSEI')` and `requireRole('KARATECA')`). The gap is inconsistency in application, not absence of the mechanism.

**What it costs to fix.** ~20 minutes total. I verified by grep that none of these six are called from `pages/karateca/*`: `/mensualidades/mes` only at `pages/sensei/Mensualidades.jsx:82`; `/asistencias/fecha` and `/asistencias/fechas` only at `pages/sensei/Asistencia.jsx:70,90`; `/polizas` only at `pages/sensei/Polizas.jsx:54`; `/inventario` only at `pages/sensei/Inventario.jsx:79`; `/config/:clave` only at `pages/sensei/Mensualidades.jsx:69`. Adding `requireRole('SENSEI')` to these six is safe.

**What breaks if fixed wrong.** `/polizas` (collection, sensei-only) and `/polizas/karateca/:id` (both roles) are adjacent lines in the same file (`poliza.routes.js:8-9`). Gating line 9 breaks `pages/karateca/Poliza.jsx:55`. Gate the collection, leave the per-record route to ARCH-02.

### ARCH-05 — The test suite mocks away the authorization it should be proving (High)

**What it is.** `karateca.test.js:39-44`:

```js
jest.mock('../middlewares/auth.middleware', () => (req, res, next) => {
  req.user = { userId: 1, rol: 'SENSEI' };
  next();
});

jest.mock('../middlewares/role.middleware', () => () => (req, res, next) => next());
```

The role middleware is replaced by a pass-through factory that ignores its argument entirely. Every request in the file runs as a hard-coded SENSEI.

**Why it matters.** This is why ARCH-01 and ARCH-04 are in production with a green suite. The tests exercise `karateca.routes.js` — the file containing the Critical finding — at 100% line coverage (per the coverage run) while asserting nothing about who may call what. Coverage of the routing table is not coverage of the authorization policy. The comment at `karateca.test.js:38` ("Inject a SENSEI user so all protected karateca routes pass auth + role checks") states the intent honestly; the cost is that the suite cannot regress-test the fix for ARCH-01.

**What it costs to fix.** ~45 minutes for a small suite that mounts the real `role.middleware` and asserts 403 for a KARATECA token on each sensei-only route. `role.middleware.js` is a 10-line pure function with no Prisma dependency, so it needs no DB. Its current branch coverage is 0% (per the coverage run) despite being the only authorization primitive in the system.

**What breaks if fixed wrong.** If the new tests keep the module-level `jest.mock` of `auth.middleware`, they will re-mock the thing under test and pass vacuously. The authorization tests need their own file, or `jest.requireActual`, so that `clearMocks: true` (`jest.config.js:4`) is not mistaken for module-registry isolation — it resets mock state, not module mocks.

## Test coverage — what the 26 tests cover and what they don't

**Run verbatim**: `cd /home/dac/Escritorio/kensho/backend && npm test` → `Test Suites: 2 passed, 2 total / Tests: 26 passed, 26 total / Time: 1.213 s`. CLAUDE.md's claim of 26 passing tests is accurate.

The suite needs **no live DB and no network**. `lib/prisma.js` is `jest.mock`ed in both files (`auth.test.js:8-31`, `karateca.test.js:8-31`), `bcryptjs` is mocked, and both files build their own Express app via a local `buildApp()` factory (`auth.test.js:52-57`, `karateca.test.js:54-59`) rather than importing `index.js` — which correctly avoids `app.listen` (`index.js:34`). The dead `backend/__mocks__/prisma.js` exists but neither test file references it.

**Measured coverage** (`npx jest --coverage --runInBand --collectCoverageFrom='src/**/*.js'`): **15.72% statements, 14.76% branches, 15.11% functions, 16.33% lines.**

**What the 26 tests actually cover:**
- `POST /api/auth/login` (5 tests): missing document → 400; missing password → 400; unknown user → 401; wrong password → 401; success → 200 with token and `res.body.user.password` undefined (`auth.test.js:113-137`).
- `GET /api/auth/me` (2): no Authorization header → 401; valid token → 200 without password.
- `PATCH /api/auth/change-password` (4): missing field → 400; password under 6 chars → 400; wrong current password → 401; success → 200.
- `GET /api/karatecas` (2): returns array; `incluirInactivos=true` drops the `activo` filter — asserted by inspecting the Prisma call argument (`karateca.test.js:94-95`).
- `POST /api/karatecas` (6): missing `nombre`/`email` → 400; non-digit document → 400; invalid `tipoDocumento` → 400; duplicate document → 400; success → 201.
- `PATCH /:id/kyu` (3), `PATCH /:id/pre-examen` (2), `DELETE /:id` (2): validation, `P2025` → 404, happy path.

The distribution is: **input validation and status-code mapping on 2 of 8 controllers.** Within that scope the tests are well-built — the P2002/P2025 error-code mapping tests (`karateca.test.js:211-221`) and the argument-shape assertion are genuinely useful.

**What they do not cover:**
- **Authorization — entirely.** See ARCH-05. `role.middleware.js` sits at 40% statements / **0% branches**; its 403 path (`role.middleware.js:3-6`) is never executed. No test asserts that a KARATECA cannot reach a SENSEI route. This is the gap that lets ARCH-01 ship green.
- **5 controllers at 0%**: `asistencia` (1-214), `mensualidad` (1-219), `poliza` (1-229), `dashboard` (1-283), `inventario` (1-117), `config` (1-44). This means **money and attendance are completely untested** — `registrarPago` (`mensualidad.controller.js:99`), `anularPago` (`:176`), and `registrar` (`asistencia.controller.js:122`) have no test at all. The three highest-consequence writes in a dojo app are the three with zero coverage.
- **The domain logic**, which is where the real bugs would be: `computeEnMora` (`mensualidad.controller.js:40-46`, the day-5 arrears rule), `estadoPoliza` (both copies), the `mesInicioMensualidades` billing-window filter (`mensualidad.controller.js:74-78`), and the attendance-percentage computation (`dashboard.controller.js:140-151`). These are pure functions with no I/O — the cheapest possible things to test and the most likely to be wrong.
- **`auth.controller.js` lines 93-122** — `resetPassword` is uncovered.
- **`utils/jwt.js` at 0%** — `generateToken`/`verifyToken` are mocked in `auth.test.js:38-41`, so real token signing and expiry are never exercised. `SECRET` is read at module load (`jwt.js:3`); if `JWT_SECRET` were unset in an environment, `jwt.sign` would throw at runtime and no test would catch it.
- **The `$transaction` semantics.** `karateca.test.js:159` uses `prisma.$transaction.mockImplementation((cb) => cb(prisma))`, which runs the callback against the same flat mock. Rollback is therefore never tested — the transaction in `remove` (`karateca.controller.js:339-354`) is asserted only for call sequence, not atomicity.
- **The frontend**: no test framework configured; zero tests. Consistent with CLAUDE.md.

## ADR candidates

These are decisions, not bugs. Each has a real argument for the status quo.

**ADR-A — No service layer: business logic lives in controllers.**
*For the current design*: 8 controllers, one consumer (this frontend), one dojo, one developer. A service layer would add a file hop per call with no second caller to justify it, and the controllers are readable top-to-bottom. `mensualidad.controller.js` cleanly separates pure helpers (`computeEnMora`, `serializeMensualidad`) from the handler, which is most of the benefit of a service layer at none of the cost. *Against*: the pure domain rules are unreachable from a test without going through Supertest, which is a direct cause of the 0% coverage on money logic — the domain is testable in principle but not in practice. *Suggested*: extract only the pure functions in ARCH-14 to `src/domain/`; leave the I/O in the controllers. This is a middle path that buys testability without the ceremony.

**ADR-B — Spanish domain language, English API and docs.**
*For*: this is a deliberate DDD ubiquitous-language decision, documented in CLAUDE.md, and the code applies it consistently — `Karateca`, `kyuActual`, `mesInicioMensualidades`, `enMora`. The users and the domain expert are Colombian; `enMora` is the term the sensei actually uses. Renaming would sever the code from the domain it models. *Against*: mixed-language identifiers appear at the seams (`registradoPorId`, `karatecaId`). This is minor and the decision should stand. It deserves an ADR precisely because it looks like an accident to an outside reader and is not one.

**ADR-C — JWT in `localStorage` vs httpOnly cookies.**
*For*: `localStorage` keeps the frontend deployable as a static Vercel bundle against a Railway API on a different origin, with no cookie-domain or SameSite coordination and no CSRF token to manage. That is a real operational saving for a two-service deploy. *Against*: XSS-readable, and combined with `access-control-allow-origin: *` (`index.js:18`) the token is usable from any origin once stolen. *Note*: the localStorage key is `budokan_token` and appears at 6 sites — `lib/api.js:8` (request interceptor), `lib/api.js:22` (401 handler), `authStore.js:11` (login), `:21` (logout), `:30` (initAuth read), `:52` (initAuth catch block). Per rebrand category 4 these move together or not at all. Corrected 2026-07-15: this note previously said 5 sites, omitting `authStore.js:52`, on the authority of CLAUDE.md's then-incorrect count rather than a grep. CLAUDE.md is now fixed.

**ADR-D — Uniqueness enforced in application code rather than by DB constraints (ARCH-08).**
*For*: the read-then-write in `mensualidad.controller.js:143-167` and `asistencia.controller.js:145-169` produces friendlier errors than a P2002, and with one sensei operating the app single-threaded the race is close to unobservable in practice. Not a fantasy defence — the concurrency profile of a one-dojo app genuinely is one writer. *Against*: the invariant is not written down where it is enforced; a double-submit or a retry can still double-bill, and every future reader must infer the rule from control flow. The `@@unique` is the cheapest possible documentation of a domain invariant. *This is the strongest ADR in the set* — it is a genuine trade-off with a defensible answer either way, which is exactly what makes it worth writing down rather than silently "fixing".

**ADR-E — In-memory aggregation instead of SQL aggregates (ARCH-15, ARCH-16).**
*For*: `dashboard.controller.js` computes distinct class days as a `Set` of local-timezone date keys (`:98-109`). That is not expressible as a naive `COUNT(DISTINCT fecha)` because `fecha` is a timestamp and the "day" boundary is the dojo's local day, not UTC — the JS approach is correct where the obvious SQL would be subtly wrong. At ~30 students × ~250 days ≈ 7.5k rows, it is also fast enough. *Against*: it is unbounded — it loads the full table on every dashboard load and will degrade linearly forever. *Suggested*: bound the query by date range first (cheap, preserves the timezone logic); do not reach for `groupBy` without solving the timezone question.

**ADR-F — Single-tenant, no `Dojo` model.**
*For*: confirmed against the file — there is no `dojoId` anywhere in `schema.prisma`, and the domain is karate-specific by construction (`Rol { SENSEI, KARATECA }` at `:10-13`, `kyuActual`/`dan` at `:46-47`). The app models one dojo's real operating requirements, and the absence of a tenant boundary is what keeps every query in this codebase free of a filter that could be forgotten. That is a genuine correctness benefit, not just less work. Worth stating explicitly so the absence reads as a decision.

## Out of scope / not verified

- **`schema.prisma` was read, never edited.** No migration was written, generated, or run. No `prisma` CLI command was executed. The schema is frozen per CLAUDE.md; ARCH-07 through ARCH-13 are diagnosis only.
- **No git command was run**, per the constraint. I did not verify that the working tree matches `28e02a2`; the baseline commit and branch in the header are taken from the task prompt, not confirmed.
- **Production was not contacted.** No claim here is verified against the live deploy. The `access-control-allow-origin: *` finding (ARCH-18) is asserted from source (`index.js:18` calls `cors()` with no options) — I did not curl the API to confirm the response header, so CLAUDE.md's production observation and my source reading agree but are independent.
- **Files not opened**: `inventario.controller.js` (read only via coverage output and route file — I assert nothing about its contents beyond 0% coverage), `seed.js`, `seedDemo.js`, `seedKarateca.js`, `__mocks__/prisma.js` (existence noted from the file listing; contents not read), `vite.config.js`, `eslint.config.js`, `vercel.json`, `nixpacks.toml`, `Procfile`, `backend/src/generated/prisma/**`, all `frontend/src/components/ui/*`, both layout components, `lib/dateUtils.js`, `lib/kyuUtils.js`, `pages/Login.jsx`, and the `.env` files other than `frontend/.env.production`.
- **Partially read**: `pages/karateca/Dashboard.jsx` (lines 105–134 and 265–282 only). ARCH-03 rests on those lines. The remaining student pages (`Asistencia`, `Mensualidades`, `Poliza`, `Tecnico`) were mapped by grepping their `api.*` call sites, not by reading them — the endpoint-to-page mapping used to size ARCH-01 and ARCH-04 is grep-derived and is the basis for the "safe to gate" claims. Before applying those gates, re-confirm with a real login as each role and the five-step smoke checklist.
- **Not assessed**: rate limiting on login (I saw none in `auth.routes.js:8`, but absence of a route-level limiter does not rule out a platform-level one on Railway, which I did not check); token expiry behaviour in the running app; the frontend build; bundle size; accessibility; visual/brand work; the `Budokan → Kensho` rebrand itself beyond noting the 5 `budokan_token` sites.
- **The 4 divergent `userSelectPublic` copies (ARCH-14)**: I confirmed that `karateca.controller.js:4-17` includes `tipoDocumento`/`numeroDocumento` and that the other three (`asistencia:3`, `poliza:3`, `mensualidad:6`) do not. I did not trace whether any consumer depends on that divergence, so consolidating them is not a mechanical merge — merging naively would widen three endpoints to expose document numbers, which is the opposite of ARCH-01's fix.
