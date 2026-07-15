# Kensho — Management app for a karate dojo

## What is this project

Kensho is a full-stack web application that runs a karate dojo end-to-end:
students, attendance, monthly fees, insurance policies and equipment inventory.

**Meaning of the name**: Kensho (見性) is a Japanese Zen term meaning "seeing one's
true nature" or "clear vision". The app gives the dojo owner clear visibility into
every aspect of the operation.

**README.md is the source of truth for positioning.** If this file and the README
ever disagree about what the product is or does, the README wins and this file
gets corrected. Do not "improve" the README's scope claims — they were verified
against the schema on July 15 2026 and they are accurate.

## Positioning (verified July 15 2026 — do not contradict in any artifact)

Kensho is a **single-tenant management app for one karate dojo**, built from the
real operating requirements of a Colombian dojo. It is NOT a SaaS platform and NOT
a generic martial-arts product.

Verified against `schema.prisma`:
- No tenant boundary. No `Dojo` model, no `dojoId`. Single-tenant by design.
- No class scheduling. There is no `Clase`, `Horario` or `Sesion` model.
  `Asistencia` hangs directly off `Karateca` with `fecha` + `presente`.
- No analytics layer. No aggregates, no events.
- The domain is karate specifically: `Karateca`, `kyuActual`, `dan`,
  `Rol { SENSEI, KARATECA }`. A judo or BJJ dojo could not use this as-is.

**Banned words** in README, ADRs, UI copy and commit messages: "SaaS",
"multi-tenant", "class scheduling", "analytics", "platform", "martial arts OS".
Known gaps belong in the README roadmap as conscious Phase-2 decisions, with the
reasoning stated. A documented gap is a credibility asset; an inflated claim that
the schema contradicts is a liability.

**Domain language is Spanish** (`Karateca`, `kyuActual`, `Mensualidad`) —
deliberate, per DDD ubiquitous language: the users and domain experts are
Colombian. API surface and documentation are English. UI is Spanish. See ADR.

**Narrative assets** (real evidence this is production work, not a template):
- `Poliza` — insurance policy per student. Colombian dojos require this. Nobody
  invents that model from a tutorial.
- Login is by `numeroDocumento` (national ID), not email. This comes from the
  real enrolment flow: the sensei has each student's ID; students may not have
  email.

**Brand string: "Kensho", single word.** User-facing brand strings today are
"BUDOKAN SKIF" (two words) at 6 sites, plus "Budokan" alone at 2 more
(`frontend/src/components/layout/SenseiLayout.jsx:51`, `frontend/src/pages/Login.jsx:36`)
— verified 2026-07-15. SKIF is a real karate federation. Kensho is a fictional
dojo and cannot claim affiliation to a real federation — that would be a false
statement about a third party. Decision (2026-07-15): SKIF appears in no
artifact. UI and docs say "Kensho", clean.

Note for implementation: at the 6 "BUDOKAN SKIF" sites this is two words → one
word. Header widths, logo areas and any layout assuming two lines will shift.
Those are not a 1:1 string swap — check the codebase map for the affected
components. The 2 single-word "Budokan" sites are a 1:1 swap.

Evidence that this was real client work does not depend on SKIF. It lives in the
schema: the `Poliza` model (per-student insurance, a Colombian dojo requirement)
and login by `numeroDocumento` (national ID, from the real enrolment flow).

## Historical context

Originally called **Budokan**, built for a specific karate dojo (name kept
confidential by agreement; the client has approved the git history remaining
public). Now rebranded to **Kensho** for the Veridis Dev portfolio launch.

**Real client data is NOT in this project.** This deployment and its database
contain fictional data only. All seeds, examples and screenshots must stay
fictional.

## Tech stack

### Frontend (`/frontend`)
- **React 19.2** with Vite 8
- **Tailwind CSS 3.4** (NOT v4 — see constraints)
- **React Router 7** for navigation
- **Zustand 5** for state management
- **React Hook Form + Zod** for forms
- **Axios** for HTTP requests
- **Lucide React** for icons
- **JavaScript** (NOT TypeScript — don't migrate)
- **Deployed on Vercel**

### Backend (`/backend`)
- **Node.js + Express 5**
- **Prisma 5.22 ORM** with PostgreSQL
- **JWT + bcryptjs** for authentication
- **Jest 30 + Supertest** — 26 tests passing
- **JavaScript** (NOT TypeScript)
- **Deployed on Railway** (Nixpacks config)
- Demo seed: `backend/src/utils/seedDemo.js` (NOT in `prisma/`)

### Infrastructure
- Frontend on Vercel, backend + PostgreSQL on Railway
- **There is NO CI. `.github/` contains only `screenshots/`, no workflows.**
  Push to `main` deploys straight to Vercel and Railway with no gate. Nothing
  runs the test suite automatically. Do not assume CI will catch anything —
  run `npm run build && npm test` locally before every push.

## Current state (July 15 2026)

- Deployed and functional in production. Verified live on July 15 2026:
  frontend 200, backend 200, PostgreSQL responding, auth working.
- Last application deploy: April 12 2026 (~3 months). The build pipeline has not
  run since. Treat the first push as a risk in itself.
- **Rebrand Budokan → Kensho: IN PROGRESS, started July 15 2026.**
  Strings have NOT been migrated. Any "Budokan" reference is pending work, not a
  leftover to ignore. Note that two web edits on July 15 *added* new Budokan
  references to the README (Tests badge URL, Live Demo link).
- **Ready for**: documentation, visual improvements, seed enrichment, tests, CI.
- **NOT ready for**: architecture changes, TypeScript migration, schema renames,
  multi-tenancy, major refactors.

## Production verification (mandatory before any push to main)

- Frontend: https://budokan-app.vercel.app
- Backend health: https://budokan-app-production.up.railway.app/api/health
- **Baseline commit at session start: `28e02a2`** (this is what production runs)
- Rollback: `git revert -m 1 HEAD && git push`. Safety tag: `pre-rebrand` → `28e02a2`

Smoke checklist — all five must pass before and after any push:
1. Frontend loads, no console errors
2. Login with demo credentials succeeds (**by `numeroDocumento`, not email**)
3. Student list renders
4. One write operation persists (attendance or monthly fee)
5. `POST /api/auth/login` with a bad document returns **401**, not 500
   (401 proves PostgreSQL is being queried; 400 only proves validation ran)

"It should still work" is not verification. Run the five.

## Rebrand scope — four categories, not two

Classify every "budokan" hit before touching it. A global `sed` breaks production.

1. **Brand (user-facing)** — titles, copy, `<title>`, README, meta tags, footer.
   → Change today.
2. **Infrastructure (identifiers)** — DB name (`budokan`), Railway project
   (`budokan-app-production`), Vercel project (`budokan-app`), `.env` values.
   → **DO NOT TOUCH TODAY.** Changing these breaks prod. Backlog.
   No CORS origin list and no JWT issuer exist — verified 2026-07-15:
   `backend/src/index.js:18` is a bare `cors()`, `backend/src/utils/jwt.js:3` is a
   bare `process.env.JWT_SECRET`. Both were previously listed here in error.
3. **History** — git log, migration folder names, the GitHub redirect from
   `dacq7/budokan-app`.
   → Leave. Client approved. Part of the case-study narrative.
4. **Functional strings that look like brand** — `budokan_token`, the localStorage
   key. **6 occurrences, not 5** — verified 2026-07-15 by grep over the whole repo:
   - `frontend/src/lib/api.js:8` — request interceptor (read)
   - `frontend/src/lib/api.js:22` — 401 response handler (remove)
   - `frontend/src/store/authStore.js:11` — `login` (write)
   - `frontend/src/store/authStore.js:21` — `logout` (remove)
   - `frontend/src/store/authStore.js:30` — `initAuth` (read)
   - `frontend/src/store/authStore.js:52` — **`initAuth` catch block (remove) —
     this one was missing from the list of 5 previously stated here.**

   No cookie names, cache keys or sessionStorage keys carry the brand — none exist.
   `budokan_token` is the only functional brand identifier in the codebase.
   → **All 6 together or none. Never by global `sed`.** A partial rename breaks
   auth silently: login writes one key, the interceptor reads another. A 3-minute
   smoke test will not catch it. Note the failure mode of the old list: renaming
   exactly the 5 sites it named leaves `:52` writing to a dead key.

Special case: `budokan-app.vercel.app` is **both** brand (first thing in the
README) and infra (the hostname is the Vercel project name). Renaming the project
does NOT redirect — the old hostname dies and becomes claimable by anyone.
Correct move: add a custom domain (`kensho.veridisdev.com`) to the same project.
Zero downtime, nothing breaks, and the case study lives on the agency's own domain.

## Known issues (verified July 15 2026)

Findings from the Phase 0 audit. Most are backlog — they are ADR material, not
today's work.

**Security**
- `access-control-allow-origin: *` on the API. Any origin can call it with a
  stolen token. Infra — backlog.
- JWT stored in `localStorage` — XSS-exposed. Combined with open CORS this is
  worse than either alone. Migrating to httpOnly cookies touches backend + CORS.
  Backlog + ADR.
- `x-powered-by: Express` leaks the stack. `helmet()` fixes it. Backlog.
- `User.password` is correctly excluded from all API responses — verified
  2026-07-15 across 13 queries. Previously listed here as a finding in error.
- `backend/src/utils/seed.js:9` — `process.env.SENSEI_PASSWORD || 'budokan2025'`.
  Hardcoded fallback password. **Do NOT touch today** — see backlog.
- Good: login returns a generic "Credenciales incorrectas" — no user enumeration.
  Keep it that way.

**Schema** (all require migrations → backlog, all are good ADR material)
- `numeroDocumento` is `String?` **nullable** but it is the login key.
  `email` is required and unused for auth. This is backwards. A `Karateca`
  created without a document is permanently locked out with no recovery path.
- No `@@unique([karatecaId, mes])` on `Mensualidad` → the same student can be
  billed twice for the same month.
- No `@@unique([karatecaId, fecha])` on `Asistencia` → a student can be marked
  present twice on one day, corrupting every attendance count.
- No indexes anywhere. `Asistencia` grows one row per student per day and the
  obvious query is `karatecaId` + `fecha` range. Needs `@@index([karatecaId, fecha])`.
- `monto Decimal` without `@db.Decimal(10,2)` → Postgres creates `Decimal(65,30)`
  for money.
- `mes String` unvalidated format; same for `mesInicioMensualidades`.
- `updatedAt` only on `Inventario` and `Config`, missing on the other five models.

**Docs**
- `backend/docs/API.md` states the base URL as `budokan-backend.up.railway.app`.
  That host does not exist. The real one is `budokan-app-production.up.railway.app`.
  Fossil — fix today, free.
- `frontend/.env.production` contains `envVITE_API_URL=...` — the variable name
  starts with `env`, so Vite would never expose it as `VITE_API_URL`. Production
  works because the real value lives in the Vercel dashboard. This file is a
  fossil and is misleading. Verify, then fix or delete.
- The README's Tests badge is hand-written static text ("26 passing"). It will rot.
  A real GitHub Actions workflow + real badge is ~20 min and closes the gap
  between what this file promises and what exists.

**Frontend**
- Brand colors are inline arbitrary values (`bg-[#111111]`, `text-[#C9A84C]`)
  scattered across components, not tokens in `theme.extend`. Any visual rebrand
  requires tokenizing first.
- Black and gold is *Budokan's* identity. Kensho means clear vision. The palette
  may need to move too — that is a design decision, not a find-and-replace.
- No frontend test framework configured. Zero frontend tests.

## Agentic workflow

Agents live in `.claude/agents/`.

### Agent invocation policy
Agents are invoked **explicitly by name, never auto-selected**. Full names carry
the category prefix: `engineering-software-architect`, not `software-architect`.

**Read-only agents**: during audit phases, agents write ONLY to
`docs/audit/<agent-name>.md`. No source file writes. No git operations. No
schema changes.

**Parallelism**: agents may run in parallel for READ-ONLY analysis. Implementation
is serial — parallel agents writing to the same files corrupt each other's work.

**Constraints do not reliably reach subagents through this file.** Repeat the hard
constraints verbatim in every subagent prompt.

### Engineering agents (8)
- `engineering-codebase-onboarding-engineer` — first-pass analysis of unfamiliar code
- `engineering-software-architect` — evaluate architecture decisions
- `engineering-senior-developer` — implement features and improvements
- `engineering-frontend-developer` — frontend work (React + Tailwind)
- `engineering-code-reviewer` — review before merging
- `engineering-technical-writer` — documentation, README, ADRs
- `engineering-git-workflow-master` — branching, commits, PR strategy
- `engineering-security-engineer` — auth, data handling, secrets

### Design agents (3)
- `design-ui-designer` — visual UI improvements
- `design-ux-architect` — user flows, interaction design
- `design-brand-guardian` — visual consistency

### Product agents (1)
- `product-manager` — the dojo owner's perspective

### Testing agents (4)
- `testing-test-results-analyzer` — coverage and quality
- `testing-accessibility-auditor` — WCAG compliance
- `testing-performance-benchmarker` — performance
- `testing-api-tester` — endpoint validation

## Global skills available

Installed in `~/.claude/skills/`:

- **`frontend-design`** — distinctive, non-generic UI decisions.
  **Warning: emits Tailwind v4 idioms by default. Reject them. See constraints.**
- **`brand-guidelines`** — coherence across visual artifacts
- **`test-driven-development`** — RED-GREEN-REFACTOR discipline
- **`webapp-testing`** — Playwright. **Not in scope today** — setting up browsers,
  fixtures and CI is a ~90 minute hole with near-zero portfolio return.
- **`taste-skill`** — aesthetic reference

## Coding principles

1. **JavaScript first** — no TypeScript migration.
2. **Tailwind 3.4 only** — see constraints.
3. **Prisma migrations** — never modify the schema without a migration.
   **The schema is FROZEN today.**
4. **Test before merging** — `npm run build && npm test` locally. There is no CI.
5. **Small commits** — one logical change per commit, one commit per scope.
6. **Minimal dependencies** — justify before adding.

## Constraints for AI agents

- **Do not migrate to TypeScript.** Explicitly rejected decision.
- **Do not upgrade Tailwind to 4.x.** Explicitly rejected. The `frontend-design`
  skill emits v4 idioms by default — reject them. Banned tokens, treat as build
  errors: `@theme`, `@import "tailwindcss"`, `@config`, `@utility`, `oklch()`,
  `tailwind.config.ts`. Config stays `tailwind.config.js` with `content`,
  `theme.extend`, `plugins`. Verify: `npx tailwindcss --version` must be 3.4.x.
- **Do not touch `schema.prisma` today.** Renames require migrations against
  live data.
- **Do not touch infrastructure identifiers today.** See rebrand category 2.
- **Do not run a global `sed` for budokan → kensho.** See rebrand category 4.
- **Do not touch `nixpacks.toml` today.** It does not parse: line 1 is literally
  `toml[phases.setup]` — a pasted markdown fence tag, verified with `od -c` on
  2026-07-15. Repairing it would make the next deploy run `prisma migrate deploy`
  against the production database for the first time. Backlog + ADR.
- **Do not commit secrets.** Check `.gitignore` before committing anything from
  `.env`.
- **Do not include real dojo data.** All example data fictional.
- **Do not take screenshots from the deployed app for the README.** Screenshots
  come from a local run against the demo seed.
- **Do not break production.** Run the five-step smoke checklist.

## References

- **Parent agency**: Veridis Dev (https://veridisdev.com)
- **Repo**: https://github.com/dacq7/kensho (renamed from `dacq7/budokan-app`;
  GitHub redirect active)
- **Related projects**: additional Veridis Dev portfolio work, under NDA

## Common tasks and where to start

### Understand the codebase
`engineering-codebase-onboarding-engineer`. Read `/frontend/package.json`,
`/backend/package.json`, and `schema.prisma` first.

### Improve visuals
`design-ui-designer` + `frontend-design` skill. Focus: consistency, professional
aesthetics, mobile responsiveness. Tokenize the palette before rebranding it. Do
NOT introduce generic AI patterns (Inter font, purple gradients, generic cards).

### Add tests
`test-driven-development` + `testing-test-results-analyzer`. Backend is Jest +
Supertest, 26 tests passing. Frontend has no framework — leave it today.

### Document
`engineering-technical-writer`. The README is already accurate on scope — align
other artifacts to it, do not inflate it. ADRs go in `/docs/`.

### Fix bugs or add features
`engineering-senior-developer`. Understand context first, write tests, small
commits, verify against the smoke checklist before merge.

## Documentation contract (mandatory — every agent, every phase)

No agent finishes without leaving a written trace. Undocumented work does not
count as done.

**Audit agents** → `docs/audit/<name>.md`. Full report structure, evidence
(`path:line` or command output) for every claim, and an explicit
"Out of scope / not verified" section.

**Implementation agents** → append an entry to `docs/CHANGELOG-session.md`:
- What changed, and which finding ID it closes (SEC-01, MAP-03…)
- Files touched
- What was verified after the change, and how
- What was deliberately NOT done, and why

**Any agent that makes a decision** (not a fix) → an ADR in `docs/adr/`, format
`NNN-short-title.md`: Context / Decision / Consequences / Alternatives rejected.
The argument FOR the current decision must be present, not only the critique.

Rules for all written output:
- A claim without evidence is not written. Uncertain → "not verified".
- No marketing adjectives: no "robust", "scalable", "best practice".
- Estimates in real time (minutes/hours), never "quick" or "simple".
- English. (Docs English, UI Spanish — see Positioning.)
- Contradicting CLAUDE.md is allowed and expected. Say so explicitly and show
  the evidence. This file has been wrong before.
