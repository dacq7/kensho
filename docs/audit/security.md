# Security — Audit Report

**Agent**: engineering-security-engineer
**Date**: 2026-07-15
**Baseline commit**: 28e02a2
**Branch**: feat/kensho-rebrand
**Scope**: Backend authentication and authorization (`backend/src/`), every Prisma query touching the `User` model, route-level guards on all 34 registered routes, request-body validation in all 8 controllers, secrets handling (`.gitignore`, `.env*` files, seed scripts), and the frontend token lifecycle (`frontend/src/lib/api.js`, `frontend/src/store/authStore.js`).

**Method** — files read in full:
`backend/src/index.js`, `backend/src/lib/prisma.js`, `backend/src/utils/jwt.js`, `backend/src/middlewares/auth.middleware.js`, `backend/src/middlewares/role.middleware.js`, `backend/src/controllers/auth.controller.js`, `backend/src/controllers/karateca.controller.js`, `backend/src/controllers/config.controller.js`, `backend/src/utils/seed.js`, `backend/src/utils/seedKarateca.js`, `backend/src/lib/prisma.js`, all 8 files in `backend/src/routes/`, `backend/prisma/schema.prisma`, `backend/package.json`, `frontend/src/lib/api.js`, the root, `frontend/` and `backend/` `.gitignore` files.

Files read in part (line ranges cited at each finding): `backend/src/controllers/dashboard.controller.js`, `backend/src/controllers/asistencia.controller.js`, `backend/src/controllers/mensualidad.controller.js`, `backend/src/controllers/poliza.controller.js`, `backend/src/controllers/inventario.controller.js`, `README.md`.

Commands run, verbatim:

```
rg -n 'user\.(findMany|findUnique|findFirst|findUniqueOrThrow|findFirstOrThrow|create|update|upsert|delete)' backend/src
rg -n 'prisma\.[a-zA-Z]+\.' backend/src
rg -n -A6 'include:' backend/src
rg -n 'userSelectPublic|userNombreSelect|userKaratecaDashboardSelect' backend/src
rg -n 'req\.user' backend/src/controllers
rg -n 'budokan_token|localStorage' frontend/src
rg -ni "secret\s*=|apikey|api_key|password\s*=\s*['\"]|JWT_SECRET" backend/src frontend/src -g '!*generated*'
find . -name '.env*' -not -path '*/node_modules/*'
find . -name '.gitignore' -not -path '*/node_modules/*'
sed -E 's/=.*/=<redacted>/' backend/.env
```

No git commands were run. No file outside `docs/audit/security.md` was written.

---

## Summary

- **`User.password` is NOT exposed in any API response. CLAUDE.md's hypothesis is disproven.** All 13 `User` queries in application code were traced to their response. Every one either uses an explicit `select`, strips `password` by destructuring, or never reaches a response body. Evidence per query in the section below. This is not a finding and requires no work.
- **Every write route is guarded.** All 20 mutating routes carry `authMiddleware + requireRole('SENSEI')`. There is no unguarded write anywhere in the API. Full matrix below.
- **The real authorization gap is on reads, not writes.** Nine read routes are guarded by authentication only, with no ownership check. A token with role `KARATECA` — obtainable with the demo credentials published in `README.md:240` — can read every student's national ID number, email, phone, date of birth and payment history (SEC-01). Note this is documented behaviour, not an accident: `README.md:248` states "both roles for reads". It is a design decision worth revisiting, not a regression.
- **No hardcoded JWT secret fallback exists.** `backend/src/utils/jwt.js:3` reads `process.env.JWT_SECRET` with no `||` default. Two seed scripts do carry hardcoded/fallback passwords (SEC-07, SEC-08).
- **Nothing here is Critical or High.** The data is fictional, the demo credentials are deliberately public, and the highest-value fixes are three small ones: strip `err.message` from 500 responses, add `helmet()`, and rate-limit login. Roughly 40 minutes total, all today, no migration.

---

## Priority 1 verdict — every `User` query traced

Prisma 5.22 has no stable `omit`, so a `User` query without an explicit `select` does return the bcrypt hash into the JS object. The question is whether any such object reaches a response body. It does not. Enumerated exhaustively:

| # | Path:line | Query | `select`? | Reaches response? | Verdict |
|---|-----------|-------|-----------|-------------------|---------|
| 1 | `backend/src/controllers/auth.controller.js:13` | `user.findUnique` (login) | No — returns hash | **No** — `auth.controller.js:24` destructures `const { password: _pw, ...userSafe } = user` and line 28 returns `userSafe` | Safe |
| 2 | `backend/src/controllers/auth.controller.js:37` | `user.findUnique` (`me`) | Yes — lines 39–48, no `password` | Yes, line 55 | Safe |
| 3 | `backend/src/controllers/auth.controller.js:71` | `user.findUnique` (changePassword) | Yes — `{ id: true, password: true }` | **No** — hash used only at line 80 for `bcrypt.compare`; response is line 91 `{ message }` | Safe |
| 4 | `backend/src/controllers/auth.controller.js:86` | `user.update` | No | **No** — result discarded, response is line 91 | Safe |
| 5 | `backend/src/controllers/auth.controller.js:109` | `user.findUnique` (resetPassword) | Yes — `{ id: true }` | No | Safe |
| 6 | `backend/src/controllers/auth.controller.js:115` | `user.update` | No | **No** — result discarded, response is line 120 | Safe |
| 7 | `backend/src/controllers/karateca.controller.js:117` | `user.findUnique` (duplicate check) | No — returns hash | **No** — used only as a boolean at line 118; response is line 119 `{ message }` | Safe |
| 8 | `backend/src/controllers/karateca.controller.js:130` | `tx.user.create` | No — returns hash | **No** — only `user.id` is read, at line 144. The transaction returns `k` (line 151), not `user` | Safe |
| 9 | `backend/src/controllers/karateca.controller.js:195` | `user.findFirst` (uniqueness check) | No — returns hash | **No** — used only as a boolean at line 198 | Safe |
| 10 | `backend/src/controllers/karateca.controller.js:203` | `user.update` | Yes — line 214 spreads `...userSelectPublic` | Yes, line 228 — but `userSelectPublic` (lines 4–17) does not include `password` | Safe |
| 11 | `backend/src/controllers/karateca.controller.js:353` | `tx.user.delete` | No | **No** — result discarded; response is line 356 `204` | Safe |
| 12 | `backend/src/utils/seed.js:15` | `user.upsert` | No | N/A — CLI script, no HTTP surface | Safe |
| 13 | `backend/src/utils/seedKarateca.js:10`, `:22` | `user.findUnique`, `tx.user.create` | No | N/A — CLI script | Safe |

Every `include: { user: ... }` on another model uses a `select` object, not a bare `true`. There are eight such sites, all pointing at one of three constants, none of which lists `password`:

- `userSelectPublic` — defined five times, once per controller: `karateca.controller.js:4`, `poliza.controller.js:3`, `asistencia.controller.js:3`, `mensualidad.controller.js:6`, `dashboard.controller.js` (n/a). Fields: `id, nombre, email, rol, tipoDocumento, numeroDocumento, telefono, fechaNacimiento, fechaIngreso, createdAt`.
- `userNombreSelect` — `dashboard.controller.js:3`, `select: { nombre: true }`.
- `userKaratecaDashboardSelect` — `dashboard.controller.js:173`, fields `nombre, email, telefono, fechaNacimiento, fechaIngreso`.

The two `registradoPor` includes (`karateca.controller.js:51-53`, `asistencia.controller.js:201-203`) also use an explicit `select: { id, nombre, email }`.

**Conclusion**: the bug CLAUDE.md describes as "the one bug that would actually embarrass the portfolio launch" is not present at commit 28e02a2. The codebase defends against it by convention (explicit `select` on every relation include) plus one destructure at the single login path. That convention is undocumented and unenforced — see SEC-09.

---

## Findings

| ID | Finding | Severity | Evidence | Today/Backlog | Effort |
|----|---------|----------|----------|---------------|--------|
| SEC-01 | Nine read routes have no ownership check. A `KARATECA` token reads all students' PII and payment records | Medium | `karateca.routes.js:8,9`; `asistencia.routes.js:8,9,10`; `mensualidad.routes.js:8,11`; `poliza.routes.js:8,9`; controllers filter only on `req.params.id`, never `req.user` — `mensualidad.controller.js:202-208`, `poliza.controller.js:78-90`, `asistencia.controller.js:197-205`. `rg -n 'req\.user' backend/src/controllers` returns 4 hits, none in these paths | Backlog + ADR | 3–4 h |
| SEC-02 | 500 responses leak `err.message` to the client | Low | `karateca.controller.js:33` and `:328` — `res.status(500).json({ message: 'Error del servidor', detail: err.message })` | **Today** | 5 min |
| SEC-03 | No rate limiting on `POST /api/auth/login` | Medium | `auth.routes.js:8` has no limiter; `backend/package.json` dependencies list contains no rate-limit package | **Today** | 20 min |
| SEC-04 | No security headers. `x-powered-by: Express` is sent | Low | `backend/src/index.js` — no `helmet()`, no `app.disable('x-powered-by')`; middleware stack is `cors()` (line 18) then `express.json()` (line 19). `helmet` absent from `backend/package.json` | **Today** | 15 min |
| SEC-05 | `access-control-allow-origin: *` on the API | Low | `backend/src/index.js:18` — `app.use(cors())` with no options. See Detail: CLAUDE.md overstates this | Backlog + ADR | 30 min |
| SEC-06 | JWT stored in `localStorage`, readable by any script on the origin | Low | `frontend/src/store/authStore.js:11` writes; `frontend/src/lib/api.js:8` reads. 6 occurrences of key `budokan_token` | Backlog + ADR | 4–6 h |
| SEC-07 | `seedKarateca.js` hardcodes a password and prints it to stdout | Low | `backend/src/utils/seedKarateca.js:7` (`PASSWORD` constant), `:6` (`EMAIL`), `:39` (`console.log` echoing both) | **Today** | 10 min |
| SEC-08 | `seed.js` falls back to a hardcoded sensei password when `SENSEI_PASSWORD` is unset | Low | `backend/src/utils/seed.js:9` — `process.env.SENSEI_PASSWORD || '<literal>'`; same pattern lines 6, 8, 10 | **Today** | 10 min |
| SEC-09 | The `select`-on-every-`User`-include convention that prevents hash exposure is undocumented and untested | Low | No test asserts absence of `password` in any response — `backend/src/tests/auth.test.js`, `backend/src/tests/karateca.test.js`. The convention holds today only by repetition across 5 files | **Today** (test only) | 30 min |
| SEC-10 | `.gitignore` pattern `.env` does not match `.env.production` / `.env.staging` variants | Low | Root `.gitignore:5` is `.env` (matches basename only). `frontend/.env.production` matches no pattern in root, `frontend/` or `backend/` `.gitignore`. It contains no secret — only an API URL, and a malformed variable name (`envVITE_API_URL`) | **Today** | 10 min |
| SEC-11 | JWT: 7-day expiry, no `issuer`/`audience`, algorithms not pinned on verify, no revocation on password change | Low | `backend/src/utils/jwt.js:4` (`EXPIRES_IN = '7d'`), `:7` (`jwt.sign` with no `issuer`/`audience`), `:11` (`jwt.verify(token, SECRET)` with no `algorithms` option). `auth.controller.js:86` changes the password without invalidating outstanding tokens | Backlog | 2 h |

---

## Detail

No finding in this audit rates Critical or High. The two below are the highest-value items and are detailed because they drive the ADRs, not because they are severe.

### SEC-01 — Read routes enforce authentication but not ownership

**What it is.** Nine routes require a valid token and nothing else. The controllers behind them filter exclusively on `req.params.id`; `req.user` is never consulted. Confirmed by `rg -n 'req\.user' backend/src/controllers`, which returns exactly four hits — `dashboard.controller.js:185`, `auth.controller.js:38`, `auth.controller.js:72`, `asistencia.controller.js:141` — none of them in the nine routes.

Concretely, a holder of a `KARATECA` token can issue `GET /api/karatecas/3` and receive that student's `numeroDocumento`, `email`, `telefono` and `fechaNacimiento` (the `userSelectPublic` field list, `karateca.controller.js:4-17`), plus their full `mensualidades` and `polizas` arrays (`karateca.controller.js:56-57`). `GET /api/karatecas/` returns the same for the entire roster. `GET /api/mensualidades/mes?mes=YYYY-MM` returns the whole dojo's billing state for a month.

**Why it matters.** For this deployment: little. The database holds fictional data (`backend/src/utils/seedDemo.js`), and the `KARATECA` demo credentials are published deliberately at `README.md:240`. Nothing real is at risk. The reason to fix it is different: an evaluator who logs in with the published student account and calls `/api/karatecas/` sees the whole roster. In an app whose domain is minors' national ID numbers, that reads as an authorization model that was not thought through — which is the opposite of what the artifact is meant to demonstrate.

**Counter-argument, which is real.** `README.md:248` documents this exact behaviour: "Role enforcement: SENSEI for write operations, both roles for reads." This is not drift between code and docs — the code does what the README says. In a single-tenant dojo where the sensei knows every student personally and the roster is pinned to the wall, "any member can see the roster" is a defensible product decision. Treating it as a vulnerability without saying so would misrepresent it.

**Cost to fix.** 3–4 hours. Each of the nine routes needs a branch: if `req.user.rol === 'SENSEI'`, proceed; otherwise resolve `req.user.userId` to its `Karateca.id` and compare against `req.params.id`, returning 403 on mismatch. The `Karateca` lookup by `userId` is already proven at `dashboard.controller.js:190-195`.

**What breaks if fixed wrong.** Two things. First, the roster-wide reads (`GET /api/karatecas/`, `GET /api/mensualidades/mes`, `GET /api/asistencias/fecha`, `GET /api/asistencias/fechas`, `GET /api/polizas/`) have no per-student equivalent — an ownership check makes no sense there; they need `requireRole('SENSEI')` instead. Before adding that, confirm the student-facing UI does not call them, or the student dashboard 403s on load. I did not verify which endpoints the `KARATECA` frontend consumes — see Out of scope. Second, a naive check that compares `req.user.userId` against `req.params.id` is wrong: those are `User.id` and `Karateca.id`, two different sequences (`schema.prisma`, `Karateca.userId` is a distinct field from `Karateca.id`). Comparing them directly would grant and deny access essentially at random.

### SEC-05 — CORS `*`, and a correction to CLAUDE.md

**What it is.** `backend/src/index.js:18` calls `app.use(cors())` with no configuration, which emits `access-control-allow-origin: *` and does not emit `access-control-allow-credentials`.

**Correction.** CLAUDE.md's "Known issues" states: *"`access-control-allow-origin: *` on the API. Any origin can call it with a stolen token"* and *"Combined with open CORS this is worse than either alone."* The first clause is true but load-bearing on "stolen"; the second overstates the interaction. The token lives in `localStorage` and is attached manually by an Axios request interceptor (`frontend/src/lib/api.js:7-13`) — it is not a cookie. Browsers do not attach `localStorage` values to cross-origin requests, and `access-control-allow-origin: *` is incompatible with credentialed requests by specification. So an arbitrary origin cannot read authenticated responses on a victim's behalf: it would first need the token, and if it has the token it does not need CORS. The two findings are largely independent, not multiplicative. The `*` is still worth closing — it removes a free reconnaissance surface and costs 30 minutes — but it is Low, not a compounding risk.

**What breaks if fixed wrong.** An allowlist that omits the live frontend origin breaks the deployed app completely and silently from the backend's side — every browser request fails at the preflight while `curl` continues to work. The origin is currently `https://budokan-app.vercel.app`, which per CLAUDE.md's rebrand category 2 is an infrastructure identifier and must not be changed today. Any allowlist must include the existing hostname, plus `http://localhost:5173` for local work.

---

## Route-by-route guard matrix

All 34 registered routes. `auth` = `authMiddleware` (`backend/src/middlewares/auth.middleware.js`). `SENSEI` / `KARATECA` = `requireRole(...)` (`backend/src/middlewares/role.middleware.js`).

| Method | Path | Guards | Defined at | Note |
|--------|------|--------|------------|------|
| POST | `/api/auth/login` | **none** | `auth.routes.js:8` | Intentional. No rate limit — SEC-03 |
| GET | `/api/auth/me` | auth | `auth.routes.js:9` | Scoped to `req.user.userId` |
| PATCH | `/api/auth/change-password` | auth | `auth.routes.js:10` | Verifies current password, `auth.controller.js:80` |
| PATCH | `/api/auth/reset-password/:userId` | auth + SENSEI | `auth.routes.js:11-16` | |
| GET | `/api/karatecas/` | auth | `karateca.routes.js:8` | **SEC-01** — full roster to any role |
| GET | `/api/karatecas/:id` | auth | `karateca.routes.js:9` | **SEC-01** — no ownership check |
| POST | `/api/karatecas/` | auth + SENSEI | `karateca.routes.js:10` | |
| PUT | `/api/karatecas/:id` | auth + SENSEI | `karateca.routes.js:11` | |
| PATCH | `/api/karatecas/:id/kyu` | auth + SENSEI | `karateca.routes.js:12` | |
| PATCH | `/api/karatecas/:id/pre-examen` | auth + SENSEI | `karateca.routes.js:13-18` | |
| PATCH | `/api/karatecas/:id/activo` | auth + SENSEI | `karateca.routes.js:19` | |
| DELETE | `/api/karatecas/:id` | auth + SENSEI | `karateca.routes.js:20` | |
| GET | `/api/asistencias/fechas` | auth | `asistencia.routes.js:8` | **SEC-01** — dojo-wide |
| GET | `/api/asistencias/fecha` | auth | `asistencia.routes.js:9` | **SEC-01** — dojo-wide |
| GET | `/api/asistencias/karateca/:id` | auth | `asistencia.routes.js:10` | **SEC-01** — no ownership check |
| POST | `/api/asistencias/` | auth + SENSEI | `asistencia.routes.js:11` | Actor from `req.user.userId`, `asistencia.controller.js:141` |
| GET | `/api/mensualidades/mes` | auth | `mensualidad.routes.js:8` | **SEC-01** — dojo-wide billing |
| POST | `/api/mensualidades/pago` | auth + SENSEI | `mensualidad.routes.js:9` | |
| PATCH | `/api/mensualidades/:id/anular` | auth + SENSEI | `mensualidad.routes.js:10` | |
| GET | `/api/mensualidades/karateca/:id` | auth | `mensualidad.routes.js:11` | **SEC-01** — no ownership check |
| POST | `/api/config/` | auth + SENSEI | `config.routes.js:8` | |
| GET | `/api/config/:clave` | auth | `config.routes.js:9` | Arbitrary key read by any role. Low — see Out of scope |
| GET | `/api/polizas/` | auth | `poliza.routes.js:8` | **SEC-01** — dojo-wide |
| GET | `/api/polizas/karateca/:id` | auth | `poliza.routes.js:9` | **SEC-01** — no ownership check |
| POST | `/api/polizas/` | auth + SENSEI | `poliza.routes.js:10` | |
| DELETE | `/api/polizas/karateca/:id` | auth + SENSEI | `poliza.routes.js:11` | |
| PUT | `/api/polizas/:id` | auth + SENSEI | `poliza.routes.js:12` | |
| DELETE | `/api/polizas/:id` | auth + SENSEI | `poliza.routes.js:13` | |
| GET | `/api/inventario/` | auth | `inventario.routes.js:8` | Non-personal data |
| POST | `/api/inventario/` | auth + SENSEI | `inventario.routes.js:9` | |
| PUT | `/api/inventario/:id` | auth + SENSEI | `inventario.routes.js:10` | |
| DELETE | `/api/inventario/:id` | auth + SENSEI | `inventario.routes.js:11` | |
| GET | `/api/dashboard/resumen` | auth + SENSEI | `dashboard.routes.js:8` | |
| GET | `/api/dashboard/karateca` | auth + KARATECA | `dashboard.routes.js:9` | Scoped to `req.user.userId`, `dashboard.controller.js:185-191` |
| GET | `/api/health` | **none** | `index.js:30` | Returns `{ status: 'ok' }` only |

**Result: 20 of 20 write routes are guarded by `authMiddleware + requireRole('SENSEI')`. There are zero unguarded writes.** The gap is entirely on reads (SEC-01).

One nuance on `role.middleware.js:3` — `requireRole` tests `req.user.rol !== rol`, an exact-match check against a single role. It cannot express "SENSEI or the owner", which is why SEC-01 cannot be fixed at the router and has to be handled in each controller, or by a new middleware.

### Verified clean

Checks that pass, recorded so they are not re-litigated:

- **No password hash in any response** — 13/13 `User` queries traced above.
- **No user enumeration on login** — `auth.controller.js:15` and `:20` return the identical body `{ message: 'Credenciales incorrectas' }` for unknown document and wrong password. CLAUDE.md is correct. The two paths do differ in timing (line 15 returns before `bcrypt.compare` at line 18), a theoretical oracle; not worth acting on.
- **No hardcoded JWT secret fallback** — `backend/src/utils/jwt.js:3` is `process.env.JWT_SECRET`, no `||`.
- **No secret values in tracked files** — `backend/.env` holds `DATABASE_URL`, `JWT_SECRET`, `PORT` and is matched by root `.gitignore:5`. `frontend/.env` holds `VITE_API_URL`, likewise matched. The Prisma client at `backend/src/generated/prisma/` is matched by `backend/.gitignore:4` (`/src/generated/prisma`) — note the root pattern `src/generated/` would *not* have covered it, since a pattern with a mid-path slash anchors to its own directory.
- **Login input is type-coerced before reaching Prisma** — `auth.controller.js:12`, `String(numeroDocumento).trim()`. A structured payload cannot reach the `where` clause as an operator object.
- **bcrypt cost factor 10** on all three hash sites — `auth.controller.js:85`, `:114`, `karateca.controller.js:127`.
- **`changePassword` requires the current password** — `auth.controller.js:80`; it does not trust the session alone.
- **Write-route body validation is present**, hand-rolled and consistent: type checks and 400s in `karateca.controller.js:101-126` and `:186-201` (including a `TIPOS_DOC_KARATECA` allowlist at line 72 and a `^\d+$` document check at line 113), `asistencia.controller.js:125-140`, `inventario.controller.js:26-33`, `config.controller.js:25-27`, `auth.controller.js:64-69` and `:104-107`. Every `:id` path parameter goes through `Number.parseInt` + `Number.isNaN` before use. No Zod on the backend — Zod is a frontend dependency only. That is a consistency observation, not a finding: the hand-rolled checks do reject the cases I traced.

---

## ADR candidates

Decisions, not bugs. Each needs the case for the status quo on the record.

**ADR — JWT in `localStorage` vs httpOnly cookies (SEC-06).**
*For the status quo*: the token is never auto-attached by the browser, which makes the API immune to CSRF by construction — there is no CSRF token anywhere in this codebase and none is needed. It also decouples the Vercel frontend from the Railway backend across origins with no cookie-domain or `SameSite` configuration to get wrong, and it keeps the request interceptor (`frontend/src/lib/api.js:7-13`) to six lines. *Against*: any XSS on the origin exfiltrates a 7-day token. *Cost of change*: 4–6 h — backend must set and clear cookies, CORS needs `credentials: true` and a fixed origin (which conflicts with SEC-05's `*`), the frontend loses its interceptor, and CSRF protection becomes newly necessary. *Note*: this also collides with CLAUDE.md's rebrand category 4 — the `budokan_token` key has 6 occurrences (`frontend/src/lib/api.js:8`, `:22`; `frontend/src/store/authStore.js:11`, `:21`, `:30`, `:52`) and moving to cookies retires all of them at once. Corrected 2026-07-15: this note previously said 5, contradicting SEC-06 in this same report, which said 6.

**ADR — Are reads dojo-wide by design? (SEC-01).**
*For the status quo*: single-tenant, one dojo, the sensei knows everyone, the roster is not confidential in the physical world the app models. `README.md:248` already commits to it in writing. *Against*: the read surface includes `numeroDocumento` — national ID numbers, for minors. That specific field is the reason to reconsider, more than the roster itself. A middle position exists and is cheaper than full ownership checks: keep reads open but drop `numeroDocumento` and `fechaNacimiento` from `userSelectPublic` for non-SENSEI callers.

**ADR — CORS `*` vs origin allowlist (SEC-05).**
*For the status quo*: no cookies means no credentialed cross-origin reads, so `*` grants an attacker nothing they cannot already get with `curl`; and an allowlist hardcodes an infrastructure identifier that CLAUDE.md freezes today and that a custom domain will change. *Against*: it is free reconnaissance and it reads as an oversight to anyone checking response headers.

**ADR — Hand-rolled validation vs a schema library on the backend.**
*For the status quo*: it works, it is dependency-free, and CLAUDE.md's principle 6 demands justification before adding libraries. *Against*: the rules are duplicated across 8 controllers with no single source of truth, and `userSelectPublic` is copy-pasted five times — the same duplication that would let SEC-09 regress.

---

## Out of scope / not verified

- **No live traffic was generated.** Every header claim (`access-control-allow-origin: *`, `x-powered-by: Express`) is derived from source — `index.js:18` with no `cors` options, and the absence of `helmet`/`app.disable('x-powered-by')` in the middleware stack — not from a response captured against the deployed API. I did not curl production. The inference is direct, but it is an inference.
- **SEC-01 was not exploited.** I did not log in with the published demo credentials and issue `GET /api/karatecas/` to observe the response. The finding rests on reading routes and controllers. The claim that no ownership check exists is strong (`rg -n 'req\.user' backend/src/controllers` returns 4 hits, all accounted for); the claim about exactly which fields come back is read off `userSelectPublic`.
- **Which endpoints the `KARATECA` frontend actually calls — not verified.** I read `frontend/src/lib/api.js` and `frontend/src/store/authStore.js` only. This directly gates SEC-01's remediation: whether the five roster-wide reads can take `requireRole('SENSEI')` depends on whether the student UI calls them. Determine this before writing the fix.
- **Git history not examined.** Per the hard constraint, no git command was run. I therefore did not check whether a secret was ever committed and later removed, nor whether `frontend/.env.production` is actually tracked. My reading of `.gitignore` semantics says it is not ignored by any of the three `.gitignore` files; the working tree was reported clean at session start, which implies tracked. That is an inference from a status snapshot, not a verified fact. It matters little — the file contains a URL, not a secret.
- **`GET /api/config/:clave` (`config.routes.js:9`)** lets any authenticated role read any config key by name. I did not enumerate what keys exist in the `Config` table in production, so I cannot say whether anything sensitive is reachable. The schema places no constraint on `valor`. Not rated; verify the key set before deciding.
- **Dependency CVE scan not run.** No `npm audit`, no SBOM, no lockfile review. `backend/package.json` was read for the presence of `helmet` and a rate limiter only. Note `@prisma/adapter-pg` is pinned `^7.5.0` against `@prisma/client` `^5.22.0` — a major-version mismatch worth someone's attention, though I did not investigate whether the adapter is wired in at all (`lib/prisma.js:3` constructs a bare `new PrismaClient()`, so it appears unused).
- **Frontend not audited** beyond token handling: no XSS review, no `dangerouslySetInnerHTML` sweep, no CSP assessment. Given SEC-06, an XSS review is the logical next step and was not performed.
- **Infrastructure not audited**: Railway and Vercel project settings, environment-variable scoping, TLS configuration, database network exposure and backup encryption were all out of scope. Whether `JWT_SECRET` in production has adequate entropy is unknown and unknowable from the repo — `backend/.env` is local only.
- **Schema-level findings** (nullable `numeroDocumento` as the login key, missing `@@unique` constraints) are listed in CLAUDE.md and are real, but they are data-integrity issues requiring migrations against live data. The schema is frozen today. Not re-audited here.
