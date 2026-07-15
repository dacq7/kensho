# Codebase Map — Audit Report

**Agent**: engineering-codebase-onboarding-engineer
**Date**: 2026-07-15
**Baseline commit**: 28e02a2
**Branch**: feat/kensho-rebrand
**Scope**: Whole repository excluding `node_modules/` and `.git/`. Complete enumeration and
classification of every case-insensitive `budokan` occurrence; repository structure; declared
stack (CLAUDE.md, `package.json`) versus installed stack (`node_modules/<pkg>/package.json`).
Read-only. No source file, no `schema.prisma`, no git command was touched or run.

**Method** — files read in full or in part:
`CLAUDE.md`, `README.md` (partial, via rg), `backend/prisma/schema.prisma`,
`backend/package.json`, `frontend/package.json`, `backend/src/index.js`,
`backend/src/lib/prisma.js`, `backend/src/controllers/auth.controller.js` (1-35),
`backend/src/controllers/karateca.controller.js` (126-240 + rg context),
`backend/src/controllers/dashboard.controller.js` (173-215 via sed),
`backend/src/controllers/mensualidad.controller.js` (115-135 via sed),
`backend/src/utils/seed.js`, `backend/src/utils/seedKarateca.js`,
`frontend/src/lib/api.js`, `frontend/src/store/authStore.js`, `frontend/index.html`,
`frontend/tailwind.config.js`, `frontend/README.md` (head), `frontend/vercel.json`,
`backend/nixpacks.toml`, `backend/Procfile`, `backend/jest.config.js`,
`.gitignore`, `backend/.gitignore`, `frontend/.gitignore`,
`frontend/.env.production`, `frontend/.env` (keys only, values redacted),
`backend/.env` (keys only, values redacted),
`backend/src/generated/prisma/client.ts` (head), `backend/src/generated/prisma/internal/class.ts` (line 23).

**Commands run** (verbatim):

```
rg -in --hidden -g '!node_modules' -g '!.git' budokan
rg -in --hidden -g '!node_modules' -g '!.git' budokan --no-filename | wc -l
rg -ino --hidden -g '!node_modules' -g '!.git' budokan --no-filename | wc -l
rg -ic --hidden -g '!node_modules' -g '!.git' budokan
rg --files --hidden -g '!node_modules' -g '!.git' | rg -i budokan
rg -in --hidden -g '!node_modules' -g '!.git' 'localStorage|sessionStorage|document\.cookie|indexedDB|caches\.|cookieName|res\.cookie|req\.cookies|cookie-parser'
rg -no --hidden -g '!node_modules' -g '!.git' "(get|set|remove)Item\(['\"][^'\"]+['\"]"
rg -n --hidden -g '!node_modules' -g '!.git' 'budokan_token'
rg -in --hidden -g '!node_modules' -g '!.git' 'budo'        # minus budokan → zero hits
rg -in --hidden -g '!node_modules' -g '!.git' 'skif' -l
rg -in --hidden -g '!node_modules' -g '!.git' 'issuer|audience|jwt\.sign|jwt\.verify|cors\(|origin' -g '*.js' -g '*.json' -g '*.toml'
rg -n 'prisma\.user\.|prisma\.karateca\.' backend/src
rg -n -A8 'prisma\.user\.(findMany|findUnique|findFirst)' backend/src
rg -n 'password' backend/src/controllers
rg -n 'adapter-pg|PrismaPg|src/generated|generated/prisma' backend/src --glob '!src/generated/**'
node -p "require('./backend/node_modules/<pkg>/package.json').version"   # per package
cat -A backend/nixpacks.toml | head -20
head -c 40 backend/nixpacks.toml | od -c
stat -c '%y  %n' backend/coverage backend/coverage/lcov-report
```

## Summary

- **66 `budokan` occurrences across 64 matching lines in 15 files. Zero filename matches.**
  Excluding `CLAUDE.md`'s own instructional text: 48 occurrences on 46 lines.
- **`budokan_token` has SIX occurrences, not five. CLAUDE.md is wrong** (`CLAUDE.md:131`).
  The sixth is `frontend/src/store/authStore.js:52` — `initAuth`'s `catch` block. A rename
  that follows CLAUDE.md's list literally leaves this one behind. See MAP-01.
- **CLAUDE.md's flagged "one bug that would actually embarrass the portfolio launch"
  (`User.password` leaking) does NOT exist.** All 12 `User` read paths are guarded by an
  explicit `select` or a destructure. Evidence in MAP-02. This is a refutation, not a fix.
- **The highest-portfolio-impact defect contains no `budokan` at all**: the browser tab reads
  `frontend` (`frontend/index.html:7`, Vite default). A 90-second evaluator sees it before
  any content. ~2 minutes to fix.
- **`backend/nixpacks.toml:1` is invalid TOML** — it literally begins `toml[phases.setup]`,
  a leftover markdown fence tag. Verified byte-by-byte. See MAP-04.

## Findings

| ID | Finding | Severity | Evidence | Today/Backlog | Effort |
|----|---------|----------|----------|---------------|--------|
| MAP-01 | `budokan_token` has 6 occurrences, not the 5 CLAUDE.md lists. Missing: `initAuth` catch block. Partial rename breaks auth silently | Critical | `frontend/src/store/authStore.js:52` vs `CLAUDE.md:131` | Today (all 6) or Backlog (none) | 10 min + smoke |
| MAP-02 | `User.password` is NOT exposed on any read path. CLAUDE.md's Critical is refuted | Critical (as claim) | `auth.controller.js:24`, `:39-45`, `:73`, `:109`; `karateca.controller.js:214`; all `include: { user: userSelectPublic }` | No action | 0 — already correct |
| MAP-03 | `<title>frontend</title>` — Vite scaffold default in production | High | `frontend/index.html:7` | Today | 2 min |
| MAP-04 | `nixpacks.toml` line 1 is `toml[phases.setup]` → invalid TOML. Railway build config likely never applied; `prisma migrate deploy` may not run on deploy | High | `backend/nixpacks.toml:1`, `od -c` output | Today (1-char class fix), verify on next deploy | 5 min + deploy log |
| MAP-05 | `coverage/` is not gitignored. 41 generated files sitting untracked in `backend/coverage/`, 10 of them containing `budokan` | High | `rg -n 'coverage' .gitignore backend/.gitignore frontend/.gitignore` → zero hits; `find backend/coverage -type f \| wc -l` → 41 | Today | 3 min |
| MAP-06 | `frontend/.env.production:1` — `envVITE_API_URL`; Vite will never expose it. Confirms CLAUDE.md. Also not covered by any `.gitignore` | High | `frontend/.env.production:1`; root `.gitignore` pattern `.env` does not match `.env.production` | Today | 5 min |
| MAP-07 | `@prisma/adapter-pg@7.5.0` installed alongside `@prisma/client@5.22.0` — major mismatch. Nothing imports it | Medium | `backend/package.json:12`; `node -p` → 7.5.0 / 5.22.0; adapter grep → zero non-generated hits | Backlog | 10 min |
| MAP-08 | `backend/src/generated/prisma/*.ts` — 8 TypeScript files from a Prisma 7 `prisma-client` generator against a *different* schema (no datasource url). Untracked, unused, contradicts the JS-only rule on sight | Medium | `internal/class.ts:23` inlineSchema; `schema.prisma:1-3` says `prisma-client-js` | Backlog | 5 min |
| MAP-09 | `backend/docs/API.md:3` documents `budokan-backend.up.railway.app` — host does not exist | Medium | `backend/docs/API.md:3` vs `CLAUDE.md:104` | Today | 2 min |
| MAP-10 | `frontend/README.md` is the unmodified Vite template ("# React + Vite") | Medium | `frontend/README.md:1` | Today | 5 min |
| MAP-11 | `seedKarateca.js` creates a KARATECA with no `numeroDocumento` → permanently unable to log in (login keys on `numeroDocumento`) | Medium | `seedKarateca.js:22-29` vs `auth.controller.js:13` | Backlog | 5 min |
| MAP-12 | Inter is already the shipped font. CLAUDE.md:298 lists Inter as a "generic AI pattern" to avoid — the codebase already violates its own rule | Low | `frontend/src/main.jsx:1-4`; `tailwind.config.js:16-17`; `index.css:9` | ADR | — |
| MAP-13 | No JWT issuer/audience claim exists; CORS is bare `cors()`. CLAUDE.md category 2 lists "JWT issuer" and "CORS origins" as budokan-bearing identifiers — neither exists | Low | `backend/src/utils/jwt.js:7`; `backend/src/index.js:18`; zero `issuer` hits | Backlog | — |
| MAP-14 | Working tree changed mid-audit: `backend/coverage/` appeared at 15:27:26 (hit count 54 → 64). Not created by this agent | Low | `stat -c '%y' backend/coverage`; two identical rg runs | Note only | — |

## Budokan occurrence map

**Total: 66 occurrences / 64 matching lines / 15 files / 0 filename matches.**

Category legend, per `CLAUDE.md:118-142`:
**1 Brand** (user-facing → change today) · **2 Infra** (identifier → DO NOT TOUCH TODAY) ·
**3 History** (leave, client approved) · **4 Functional** (all together or none, never `sed`)
· **M Meta** (CLAUDE.md's own instructions about the rebrand — renaming these destroys the
instructions) · **G Generated** (regenerates; fix the source, not the artifact)

### Category 4 — FUNCTIONAL. All six or none. (6 occurrences, 2 files)

| # | Path:line | Matched text | Call site | Cat |
|---|-----------|--------------|-----------|-----|
| 1 | `frontend/src/lib/api.js:8` | `localStorage.getItem('budokan_token')` | request interceptor | 4 |
| 2 | `frontend/src/lib/api.js:22` | `localStorage.removeItem('budokan_token')` | 401 response handler | 4 |
| 3 | `frontend/src/store/authStore.js:11` | `localStorage.setItem('budokan_token', token)` | `login` | 4 |
| 4 | `frontend/src/store/authStore.js:21` | `localStorage.removeItem('budokan_token')` | `logout` | 4 |
| 5 | `frontend/src/store/authStore.js:30` | `localStorage.getItem('budokan_token')` | `initAuth` (read) | 4 |
| 6 | **`frontend/src/store/authStore.js:52`** | `localStorage.removeItem('budokan_token')` | **`initAuth` catch block — NOT in CLAUDE.md's list of 5** | 4 |

**Exhaustive proof that these six are the complete set of functional brand identifiers:**

```
rg -no "(get|set|remove)Item\(['\"][^'\"]+['\"]"   → 9 hits total, repo-wide:
    6 × budokan_token  (above)
    3 × 'theme'        (.claude/agents/design-ux-architect.md:229,235,238 — agent doc, not app code)
rg -in 'localStorage|sessionStorage|document\.cookie|indexedDB|caches\.|res\.cookie|req\.cookies|cookie-parser'
    → no sessionStorage anywhere; no document.cookie; no indexedDB; no Cache API;
      no res.cookie / req.cookies; no cookie-parser dependency.
      set-cookie-parser appears only as a transitive dep in frontend/package-lock.json:3435.
rg -in 'budo' minus 'budokan'  → zero hits (no truncated brand variants).
```

**Conclusion: `budokan_token` is the only functional brand identifier in the codebase, and it
has 6 occurrences, not 5.** There are no cookie names, cache keys, sessionStorage keys, or
analytics event names carrying the brand. `CLAUDE.md:131-133` also lists "analytics events" as
a category-4 risk — no analytics code exists (consistent with `CLAUDE.md:26`).

### Category 1 — BRAND (user-facing). Change today. (17 occurrences, 6 files)

| # | Path:line | Matched text | Cat |
|---|-----------|--------------|-----|
| 7 | `README.md:1` | `# Budokan SKIF — Dojo Management System` | 1 |
| 8 | `README.md:5` | badge label `Live%20Demo-budokan--app.vercel.app` | 1+2 |
| 9 | `README.md:48` | `Budokan SKIF is a production-ready management system built for a real karate dojo…` | 1 |
| 10 | `README.md:113` | `budokan-app/` (directory tree heading) | 1 |
| 11 | `README.md:191` | `cd budokan-app` | 1 |
| 12 | `backend/docs/API.md:1` | `# Budokan SKIF — API Reference` | 1 |
| 13 | `backend/docs/API.md:67` | `"email": "yamada@budokan.com"` (example payload) | 1 |
| 14 | `backend/docs/API.md:1127` | `*Generated for Budokan SKIF — Sistema de Gestión de Dojo.*` | 1 |
| 15 | `frontend/src/components/layout/SenseiLayout.jsx:51` | `)?.label ?? 'Budokan';` (page-title fallback) | 1 |
| 16 | `frontend/src/components/layout/SenseiLayout.jsx:88` | `BUDOKAN SKIF` | 1 |
| 17 | `frontend/src/components/layout/KaratecaLayout.jsx:86` | `<p className="…">BUDOKAN SKIF</p>` | 1 |
| 18 | `frontend/src/components/layout/KaratecaLayout.jsx:175` | `<span className="…">BUDOKAN SKIF</span>` | 1 |
| 19 | `frontend/src/components/layout/KaratecaLayout.jsx:206` | `<p className="…">BUDOKAN SKIF</p>` | 1 |
| 20 | `frontend/src/pages/Login.jsx:36` | `document.title = 'Iniciar sesión — Budokan';` | 1 |
| 21 | `frontend/src/pages/Login.jsx:103` | `BUDOKAN SKIF` | 1 |
| 22 | `frontend/src/pages/Login.jsx:119` | `BUDOKAN SKIF` | 1 |
| 23 | `backend/docs/API.md:3` | `budokan-backend.up.railway.app` — **host does not exist** (MAP-09) | 1 (fossil) |

Note on "SKIF": `skif` appears in `README.md`, `backend/docs/API.md`,
`SenseiLayout.jsx`, `KaratecaLayout.jsx`, `Login.jsx`
(`rg -in 'skif' -l`). Every user-facing brand string is `BUDOKAN SKIF`, not `BUDOKAN`.
Renaming only `Budokan` leaves `KENSHO SKIF`. SKIF is a real karate federation affiliation
(Shotokan Karate-Do International Federation), so whether it survives the rebrand is a
decision, not a find-and-replace. Flagged as an ADR candidate, not actioned here.

### Category 2 — INFRASTRUCTURE. DO NOT TOUCH TODAY. (4 occurrences, 3 files)

| # | Path:line | Matched text | Cat |
|---|-----------|--------------|-----|
| 24 | `README.md:5` | href `https://budokan-app.vercel.app` (Live Demo badge target) | 2+1 special case |
| 25 | `README.md:235` | `**[→ Open Live Demo](https://budokan-app.vercel.app)**` | 2+1 special case |
| 26 | `frontend/.env.production:1` | `envVITE_API_URL=https://budokan-app-production.up.railway.app/api` | 2 (+ MAP-06) |
| 27 | `CLAUDE.md:103-104` | prod URLs (counted under Meta below) | 2 |

Per `CLAUDE.md:138-142`: renaming the Vercel project does **not** redirect — the old hostname
dies and becomes claimable. The prescribed move is a custom domain on the same project. Not
today's work; not this agent's call.

### Category 3 — HISTORY. Leave. Client approved. (3 occurrences, 1 file)

| # | Path:line | Matched text | Cat |
|---|-----------|--------------|-----|
| 28 | `README.md:5` | Tests badge href `https://github.com/dacq7/budokan-app` | 3 |
| 29 | `README.md:190` | `git clone https://github.com/dacq7/budokan-app.git` | 3 |
| 30 | — | migration folder names under `backend/prisma/migrations/` | 3 |

Verified: **no migration folder name contains `budokan`** (`rg --files | rg -i budokan` → zero).
The six migration directories are `20260321143821_init`, `20260323145639_add_activo_karateca`,
`20260324000000_add_config`, `20260325000000_add_mes_inicio_mensualidades`,
`20260329120000_user_documento`, `20260329140000_karateca_mes_inicio_mensualidades`.
CLAUDE.md:128-129 lists "migration folder names" as a history category — **that category is
empty**. Contradiction with CLAUDE.md, evidence above.

The GitHub redirect from `dacq7/budokan-app` is active per `CLAUDE.md:285`, so #28 and #29 keep
working. Whether the README should still instruct a reader to clone the *old* name when the
canonical repo is `dacq7/kensho` is a judgement call: leaving it is defensible (history), and
updating it is defensible (accuracy). Not decided here.

### Category 4-adjacent — SEED DATA. Read the note. (10 occurrences, 3 files)

| # | Path:line | Matched text | Cat | Note |
|---|-----------|--------------|-----|------|
| 31 | `backend/src/utils/seed.js:6` | `process.env.SENSEI_NOMBRE \|\| 'Sensei Budokan'` | 1 | display name, safe |
| 32 | `backend/src/utils/seed.js:9` | `process.env.SENSEI_PASSWORD \|\| 'budokan2025'` | 1 | default password |
| 33 | `backend/src/utils/seed.js:10` | `process.env.SENSEI_EMAIL \|\| 'sensei@budokan.com'` | 1 | safe — see below |
| 34 | `backend/src/utils/seedKarateca.js:6` | `const EMAIL = 'karateca@budokan.com';` | **4** | **idempotency key — see below** |
| 35 | `backend/src/utils/seedKarateca.js:39` | `console.log('Karateca de prueba creado: karateca@budokan.com / karate2025')` | 1 | log string |
| 36 | `backend/src/utils/seedDemo.js:23` | `email: 'sensei@budokan.com',` | 1 | safe — `deleteMany` first |
| 37 | `backend/src/utils/seedDemo.js:36` | `email: 'andres@budokan.com',` | 1 | safe |
| 38 | `backend/src/utils/seedDemo.js:58` | `email: 'laura@budokan.com',` | 1 | safe |
| 39 | `backend/src/utils/seedDemo.js:80` | `email: 'miguel@budokan.com',` | 1 | safe |
| 40 | `backend/src/utils/seedDemo.js:102` | `email: 'sofia@budokan.com',` | 1 | safe |

Why these are not uniformly category 1:

- **#33 is safe.** `seed.js:15-16` upserts on `where: { numeroDocumento }`, and `email` sits in
  the `update` block (`seed.js:19`). Renaming the email default updates the existing sensei row.
  No duplicate.
- **#34 is category 4.** `seedKarateca.js:10-12` does `findUnique({ where: { email: EMAIL } })`
  as its "already exists" guard. `EMAIL` *is* the idempotency key. Rename it against a database
  that already holds `karateca@budokan.com` and the guard misses, `tx.user.create` runs, and the
  `email @unique` constraint (`schema.prisma`, `User.email`) throws P2002. It fails loudly rather
  than corrupting data — so this is lower risk than `budokan_token`, but it is still a functional
  identifier wearing brand clothing, and it is not on CLAUDE.md's category-4 list.
- **#36-40 are safe.** `seedDemo.js:12-13` runs `karateca.deleteMany()` then `user.deleteMany()`
  before creating. Full reset, no key collision.

### Category G — GENERATED. Do not edit. (10 occurrences, 3 files)

| # | Path:line | Matched text | Cat |
|---|-----------|--------------|-----|
| 41 | `backend/coverage/lcov-report/src/utils/seedKarateca.js.html:169` | `'karateca@budokan.com';` | G |
| 42 | `backend/coverage/lcov-report/src/utils/seedKarateca.js.html:202` | `'Karateca de prueba creado: karateca@budokan.com / karate2025'` | G |
| 43 | `backend/coverage/lcov-report/src/utils/seed.js.html:155` | `'Sensei Budokan';` | G |
| 44 | `backend/coverage/lcov-report/src/utils/seed.js.html:158` | `'budokan2025';` | G |
| 45 | `backend/coverage/lcov-report/src/utils/seed.js.html:159` | `'sensei@budokan.com';` | G |
| 46 | `backend/coverage/lcov-report/src/utils/seedDemo.js.html:716` | `email: 'sensei@budokan.com',` | G |
| 47 | `backend/coverage/lcov-report/src/utils/seedDemo.js.html:729` | `email: 'andres@budokan.com',` | G |
| 48 | `backend/coverage/lcov-report/src/utils/seedDemo.js.html:751` | `email: 'laura@budokan.com',` | G |
| 49 | `backend/coverage/lcov-report/src/utils/seedDemo.js.html:773` | `email: 'miguel@budokan.com',` | G |
| 50 | `backend/coverage/lcov-report/src/utils/seedDemo.js.html:795` | `email: 'sofia@budokan.com',` | G |

HTML mirrors of #31-40, produced by a Jest coverage run at **15:27:26 today, during this audit**
(`stat -c '%y' backend/coverage`). These regenerate. They are listed for completeness only — the
rename target is the source file, never the report. See MAP-05: `coverage/` is not gitignored.

### Category M — META (CLAUDE.md's own rebrand instructions). Leave. (18 lines, 1 file)

`CLAUDE.md` lines **50, 93, 94, 95, 103, 104, 120, 124, 125, 126, 129, 131, 138, 180, 181, 195,
274, 285**. Every one is CLAUDE.md describing the rebrand, the four categories, the prod
hostnames, or the historical name. Renaming `Budokan` here would delete the instructions that
govern the rename. Excluded from any Phase 3 `sed` scope. Two lines (`131`, `129`) are
*factually wrong* and should be corrected as part of this audit's follow-up: `131` says five
`budokan_token` occurrences (there are six), `129` claims migration folder names carry the brand
(none do).

### Reconciliation

| Bucket | Occurrences |
|--------|-------------|
| Category 4 — functional | 6 |
| Category 1 — brand | 17 |
| Category 2 — infra | 3 (+1 counted under Meta) |
| Category 3 — history | 2 (migration-name category is empty) |
| Seed data (1 + one cat-4) | 10 |
| Category G — generated | 10 |
| Category M — CLAUDE.md meta | 18 |
| **Total** | **66** |

`README.md:5` carries three occurrences on one line (badge label, Vercel href, GitHub href) —
this is why 66 occurrences span only 64 lines. `CLAUDE.md:103-104` and `:180-181` likewise
pack URLs; the Meta bucket is counted by line (18), matching `rg -ic CLAUDE.md` → 18.

## Project structure & stack (declared vs installed)

### Structure

```
kensho/
├── CLAUDE.md                  agent instructions (18 budokan refs, all meta)
├── README.md                  positioning, source of truth per CLAUDE.md:12
├── .github/screenshots/       6 PNGs. NO workflows — confirms CLAUDE.md:82, there is no CI
├── .claude/agents/            16 agent definitions
├── backend/                   Express 5 + Prisma, CommonJS
│   ├── prisma/
│   │   ├── schema.prisma      7 models, 3 enums. generator = prisma-client-js
│   │   └── migrations/        6 migrations, none brand-named
│   ├── docs/API.md            1127 lines
│   ├── nixpacks.toml          Railway build config — INVALID TOML (MAP-04)
│   ├── Procfile               web: node src/index.js
│   ├── jest.config.js         testMatch **/tests/**/*.test.js
│   ├── __mocks__/prisma.js    tests mock Prisma; no DB in the test path
│   ├── coverage/              41 generated files, NOT gitignored (MAP-05)
│   └── src/
│       ├── index.js           entry: cors() → express.json() → 8 routers → /api/health
│       ├── lib/prisma.js      new PrismaClient(), no adapter
│       ├── routes/            8 routers
│       ├── controllers/       8 controllers
│       ├── middlewares/       auth.middleware.js, role.middleware.js
│       ├── utils/             jwt.js, seed.js, seedDemo.js, seedKarateca.js
│       ├── tests/             auth.test.js, karateca.test.js
│       └── generated/prisma/  8 .ts files — Prisma 7 fossil, untracked, unused (MAP-08)
└── frontend/                  React 19 + Vite 8, ESM
    ├── index.html             <title>frontend</title> (MAP-03)
    ├── tailwind.config.js     v3 shape: content/theme.extend/plugins. dojo palette tokenized
    ├── vercel.json            SPA rewrite → /index.html
    ├── .env.production        envVITE_API_URL typo, not gitignored (MAP-06)
    ├── README.md              unmodified Vite template (MAP-10)
    └── src/
        ├── main.jsx           imports @fontsource/inter 400/500/600/700
        ├── App.jsx, index.css
        ├── lib/api.js         axios instance + 2 interceptors (budokan_token ×2)
        ├── store/authStore.js zustand (budokan_token ×4)
        ├── routes/ProtectedRoute.jsx
        ├── components/{layout,ui,karatecas}/
        └── pages/{Login,sensei/*,karateca/*}   6 sensei + 5 karateca pages
```

Entry points, in reading order for a newcomer: `backend/src/index.js` →
`backend/src/routes/auth.routes.js` → `backend/src/controllers/auth.controller.js` →
`frontend/src/lib/api.js` → `frontend/src/store/authStore.js`.

### Backend: declared vs installed

| Package | package.json | Installed | Match |
|---------|--------------|-----------|-------|
| `@prisma/client` | `^5.22.0` | 5.22.0 | yes |
| `prisma` | `^5.22.0` | 5.22.0 | yes |
| `@prisma/adapter-pg` | `^7.5.0` | **7.5.0** | **MAJOR MISMATCH vs client 5.22 — MAP-07** |
| `express` | `^5.2.1` | 5.2.1 | yes |
| `jest` | `^30.3.0` | 30.3.0 | yes |
| `supertest` | `^7.2.2` | 7.2.2 | yes |
| `jsonwebtoken` | `^9.0.3` | 9.0.3 | yes |
| `bcryptjs` | `^3.0.3` | 3.0.3 | yes |
| `cors` | `^2.8.6` | 2.8.6 | yes |
| `pg` | `^8.20.0` | 8.20.0 | yes |
| `dotenv` | `^17.3.1` | 17.3.1 | yes |

### Frontend: declared vs installed

| Package | package.json | Installed | Match |
|---------|--------------|-----------|-------|
| `react` / `react-dom` | `^19.2.4` | 19.2.4 | yes |
| `vite` | `^8.0.1` | 8.0.1 | yes |
| `tailwindcss` | `^3.4.19` | **3.4.19** | yes — v3, constraint held |
| `react-router-dom` | `^7.13.1` | 7.13.1 | yes |
| `zustand` | `^5.0.12` | 5.0.12 | yes |
| `axios` | `^1.13.6` | 1.13.6 | yes |
| `zod` | `^4.3.6` | 4.3.6 | yes |
| `react-hook-form` | `^7.71.2` | 7.71.2 | yes |
| `lucide-react` | `^0.577.0` | 0.577.0 | yes |
| `@fontsource/inter` | `^5.2.8` | 5.2.8 | yes — but see MAP-12 |

### Declared-stack mismatches against CLAUDE.md

| CLAUDE.md says | Reality | Evidence |
|----------------|---------|----------|
| `CLAUDE.md:75` "Jest 30 + Supertest — 26 tests passing" | Not verified. I did not run the suite (read-only). Two test files exist | `backend/src/tests/` |
| `CLAUDE.md:131` `budokan_token` ×5 | ×6 | `authStore.js:52` |
| `CLAUDE.md:129` migration folder names are history-category budokan refs | Zero migration names contain budokan | `rg --files \| rg -i budokan` → empty |
| `CLAUDE.md:124-125` "CORS origins, JWT issuer" are budokan-bearing infra identifiers | Neither exists. `cors()` takes no options; no issuer/audience claim | `index.js:18`, `utils/jwt.js:7` |
| `CLAUDE.md:157-160` `User.password` likely exposed, "fix today" | Not exposed on any path | See MAP-02 |
| `CLAUDE.md:298` avoid "Inter font" as a generic AI pattern | Inter is the shipped font already | `main.jsx:1-4` |
| `CLAUDE.md:62` "Tailwind CSS 3.4" | Confirmed, 3.4.19 installed, config is v3 shape | `tailwind.config.js` |
| `CLAUDE.md:82` "There is NO CI" | Confirmed. `.github/` holds only `screenshots/` | `find .github -type f` |
| `CLAUDE.md:24-28` no tenant/scheduling/analytics models; karate-specific | Confirmed against schema | `schema.prisma` |

`npx tailwindcss --version` (CLAUDE.md:270's prescribed check) does **not** work on v3 — it
errors with `Specified input file --version does not exist`. The installed-version read via
`node -p` is the reliable check. CLAUDE.md:270's instruction is unusable as written.

## Detail

### MAP-01 — `budokan_token` has six occurrences (Critical)

`CLAUDE.md:131-133` enumerates five sites: request interceptor, `login`, `logout`, 401 handler,
`initAuth`. The sixth is `frontend/src/store/authStore.js:52`, the `catch` inside `initAuth`:

```js
    } catch {
      localStorage.removeItem('budokan_token');
```

**Why it matters.** The five named sites map to `api.js:8`, `authStore.js:11`, `:21`,
`api.js:22`, `authStore.js:30`. An engineer working the list literally renames those five and
leaves `:52` writing to the old key. `initAuth` reads the *new* key at `:30`, calls
`GET /auth/me`, and on any failure tries to clear the *old* key at `:52` — which no longer
exists. The stale-token cleanup silently stops working: a user with an expired token gets
`/auth/me` 401 → `api.js:22` (renamed) clears the new key → but if the failure is a network
error rather than a 401, `:52` is the only cleanup, and it misses. State desyncs.

This is precisely the failure mode CLAUDE.md:134-136 warns about, and CLAUDE.md's own list is
what causes it.

**Cost to fix.** ~10 minutes for all six, plus the five-step smoke checklist (CLAUDE.md:108-115),
which must include a login → hard-reload → still-authenticated cycle. A rename that ships without
that reload step will not surface the bug.

**What breaks if fixed wrong.** Any subset < 6 desyncs read and write paths. Additionally: every
currently-logged-in user is silently logged out on deploy, because their `budokan_token` entry
is orphaned under the old key. That is acceptable and expected — but it should be a decision, not
a surprise. There is no migration shim reading the old key.

### MAP-02 — `User.password` is not exposed (Critical claim, refuted)

CLAUDE.md:157-160 calls this "the one bug that would actually embarrass the portfolio launch"
and instructs an audit of every `User` query. I audited all twelve. **None leaks.**

| Read path | Guard |
|-----------|-------|
| `auth.controller.js:13` login — `findUnique`, no select | `:24` `const { password: _pw, ...userSafe } = user;` → `:28` returns `userSafe` |
| `auth.controller.js:37` `/me` | explicit `select` (`:39-45`), no `password` |
| `auth.controller.js:71` change-password | `select: { id: true, password: true }` — used only at `:80` `bcrypt.compare`, never returned |
| `auth.controller.js:109` admin reset | `select: { id: true }` |
| `karateca.controller.js:117` duplicate check | boolean use only, not returned |
| `karateca.controller.js:195` duplicate check on update | boolean use only, not returned |
| `karateca.controller.js:130` `tx.user.create` | result bound to `user`, used only for `user.id` at `:144`; the returned value is `k` (`:151`), which includes `user: userSelectPublic` |
| `karateca.controller.js:203` `user.update` | `...userSelectPublic` spread at `:214` applies the select |
| `karateca.controller.js:22`, `:44`, `:316` | `include: { user: userSelectPublic }` |
| `dashboard.controller.js:75` | `include: { user: userNombreSelect }` → `select: { nombre: true }` |
| `dashboard.controller.js:190` | `include: { user: userKaratecaDashboardSelect }` → 5 fields, no password |
| `mensualidad/poliza/asistencia` findMany | `include: { user: userSelectPublic }` |

`rg -n 'password' backend/src/controllers` returns 20 hits; every one is a request-body read, a
`bcrypt` call, a write, or the `:24` destructure. **Zero response paths.**

**Why this matters beyond the fix.** CLAUDE.md instructed "fix today — it is a 5-minute `select`".
Acting on that instruction without verifying would mean editing five controllers to add selects
that are already there, on a codebase with no CI (CLAUDE.md:82) and no deploy since April 12
(CLAUDE.md:91). The cheapest possible outcome of a false Critical is wasted time; the realistic
one is a regression introduced into working auth code. The finding is closed by evidence, not by
a commit.

Two caveats I am explicit about: `userSelectPublic` is defined **five separate times**
(`karateca.controller.js:4`, `mensualidad.controller.js:6`, `poliza.controller.js:3`,
`asistencia.controller.js:3`, plus `dashboard`'s two variants). They are not identical —
`karateca`'s includes `tipoDocumento` and `numeroDocumento`; the others do not. Four duplicated
allowlists mean a future field added to `User` is protected only where someone remembers to look.
The protection currently holds; the structure does not make it hold. That is ADR material, below.

### MAP-03 — `<title>frontend</title>` (High)

`frontend/index.html:7`. The production browser tab, the bookmark name, and the link preview
title all read `frontend`. This contains no `budokan`, so every brand-focused search — including
the one this audit was chartered to run — misses it.

Ranked first on portfolio impact deliberately: for a 90-second evaluator, the tab title renders
before any content does, and `frontend` reads as an unfinished scaffold. `Login.jsx:36` sets
`document.title` on the login route only; every other route inherits `frontend`.

**Cost.** ~2 minutes. **What breaks if fixed wrong.** Nothing functional. Note it is a
category-1 brand string that must agree with whatever `Login.jsx:36` is renamed to, or the tab
title will flicker between two names during navigation.

### MAP-04 — `backend/nixpacks.toml` is not valid TOML (High)

Line 1 is literally `toml[phases.setup]` — verified byte-by-byte:

```
head -c 40 backend/nixpacks.toml | od -c
0000000   t   o   m   l   [   p   h   a   s   e   s   .   s   e   t   u
0000020   p   ]  \n   n   i   x   P   k   g   s       =       [   "   n
```

The `toml` prefix is a markdown code-fence language tag that was pasted into the file. Under the
TOML grammar, a bare key `toml` followed by `[` is a parse error, so the **entire file** fails to
parse — not just line 1.

**Why it matters.** The file declares `[phases.build] cmds = ["npx prisma generate"]` and
`[start] cmd = "npx prisma migrate deploy && node src/index.js"`. If Railway cannot parse it, it
falls back to auto-detection plus `Procfile`, which is `web: node src/index.js` — **no
`prisma generate`, no `migrate deploy`**. Production has been up since April 12, which is
consistent with either "the file was always ignored and the fallback worked" or "nixpacks parsed
it leniently". CLAUDE.md:91-92 notes the build pipeline has not run in ~3 months and calls the
first push a risk in itself. This file is a concrete, named instance of that risk.

**Not verified** — and I want to be exact about the boundary here. I verified the bytes and the
TOML grammar violation. I did **not** verify what Railway actually did with the file: that needs
a build log, which requires the Railway dashboard. The claim "migrations never ran automatically"
is an inference and is **not asserted**.

**Cost.** ~5 minutes to delete four characters, plus reading one deploy log to confirm which path
Railway takes. **What breaks if fixed wrong.** This is the sharp end: if the file has been ignored
for four months, *repairing* it changes deploy behavior for the first time in four months — the
next deploy would suddenly start running `prisma migrate deploy` against the live database. On a
repo whose schema has six pending-or-applied migrations and no CI, that is not a cosmetic fix. It
should ship on its own commit, not bundled into the rebrand, and the migration state should be
inspected first. Backlog is defensible; today-with-a-deploy-log-check is defensible. It is not a
drive-by.

### MAP-05 — `coverage/` is not gitignored (High)

`rg -n 'coverage' .gitignore backend/.gitignore frontend/.gitignore` → zero hits.
`find backend/coverage -type f | wc -l` → 41 files, created 15:27:26 today.

Root `.gitignore` covers `node_modules/`, `.env`, `dist/`, `build/`, `src/generated/`, `*.log`.
No `coverage/`. Anyone running `jest --coverage` then `git add -A` commits 41 generated HTML
files, ten of which carry `budokan` strings that will then reappear in exactly the search this
audit just ran — after the rename is supposedly complete.

**Cost.** ~3 minutes. **What breaks if fixed wrong.** Nothing. Note that `.gitignore` alone does
not remove files already staged or tracked; whether any coverage file is currently tracked is
**not verified** — determining that needs `git ls-files`, and git commands are outside this
agent's constraints.

### MAP-06 — `frontend/.env.production` (High)

Line 1, verbatim: `envVITE_API_URL=https://budokan-app-production.up.railway.app/api`

Two independent defects on one line:

1. **The variable name is `envVITE_API_URL`.** Vite exposes only names matching `VITE_*` on
   `import.meta.env`. `frontend/src/lib/api.js:4` reads `import.meta.env.VITE_API_URL` — which
   this file never defines. Production works because the real value is set in the Vercel
   dashboard (per CLAUDE.md:184-186, which I confirm on the file content but **cannot verify on
   the dashboard side**). Confirms CLAUDE.md.
2. **It is not gitignored.** Root `.gitignore` has the pattern `.env`, which matches a file named
   exactly `.env` — it does not match `.env.production`. `frontend/.gitignore` has no `.env`
   pattern at all (it has `*.local`). So `frontend/.env.production` is not ignored by any rule.
   `frontend/.env` *is* ignored, by the root pattern.

The file contains no secret — only a public API hostname — so this is not a credential exposure.
It is a misleading fossil that also happens to be a category-2 infrastructure hostname, which is
why it is listed as infra in the map and must not be *edited* toward `kensho` today.

**Cost.** ~5 minutes. **What breaks if fixed wrong.** Deleting the file: nothing, if and only if
the Vercel dashboard truly holds `VITE_API_URL` — verify in the dashboard before deleting, not
after. "Fixing" the typo to `VITE_API_URL` is the dangerous option: it would *start* overriding
what the dashboard sets, hardcoding the Railway host into the repo and into every future preview
deploy. Delete, or leave it alone. Do not repair it.

## ADR candidates

Decisions, not bugs. The case *for* the current state is stated first in each.

**ADR-A — `budokan_token` stays until it can be renamed atomically.**
*For the status quo*: the key is invisible to users, costs nothing to leave, and carries real
downside to touch — six sites, no CI, no deploy in four months, and a failure mode that a
three-minute smoke test does not catch (CLAUDE.md:134-136). The brand argument for renaming it is
zero: nobody opens devtools to read localStorage keys during a portfolio review. *Against*: it is
the last functional trace of the old brand, and every month it stays, the "is this really
rebranded?" question has a yes-if-you-look-hard answer. Recommendation, weakly held: rename all
six in one commit with a login → hard-reload → write-operation smoke, or defer it to Phase 2
entirely. What is not defensible is renaming five.

**ADR-B — `userSelectPublic` is duplicated across four controllers with two variants.**
*For the status quo*: it works, it is explicit at every call site, a reader of any single
controller can see exactly which fields go out without chasing an import, and the variants are
genuine — `karateca.controller.js:4` deliberately exposes `tipoDocumento`/`numeroDocumento`
because the sensei's roster needs them, while `asistencia`/`poliza`/`mensualidad` deliberately do
not. Centralizing would create pressure to pass flags or export several near-identical constants,
which is not obviously better. *Against*: MAP-02 currently passes on four independent allowlists
staying in agreement. Add a `documentoVerificado` field to `User` next year and the protection
holds in the three files someone remembered. Not today's work; the schema is frozen (CLAUDE.md:258).

**ADR-C — "SKIF" in the brand strings.**
Every user-facing string is `BUDOKAN SKIF`, not `BUDOKAN`. SKIF denotes a real federation
affiliation (Shotokan Karate-Do International Federation) held by the original dojo. *For
keeping it*: it is the single most specific piece of evidence that this was built for a real
organization, which is exactly the credibility CLAUDE.md:41-46 says the narrative assets carry.
*Against*: the dojo's identity is confidential by agreement (CLAUDE.md:50-52), and a federation
affiliation is arguably identifying. Dropping it yields plain `KENSHO`. This is a client-consent
question, not an engineering one, and it blocks the category-1 rename — you cannot write the new
strings until it is answered.

**ADR-D — Inter is already the font.**
CLAUDE.md:298 lists "Inter font" among the generic AI patterns to avoid, but `main.jsx:1-4`,
`tailwind.config.js:16-17` and `index.css:9` already ship it, and have since before this session.
*For the status quo*: Inter is legible, the weights are already subsetted via `@fontsource`, and
it is not what makes a UI look templated — the purple-gradient-and-generic-card vocabulary is.
Changing a typeface is a real design decision with a real regression surface across 11 pages.
*Against*: CLAUDE.md means what it says, and the black-and-gold-plus-Inter combination is the
default portfolio look. Either the constraint should be amended to reflect what shipped, or the
font is a Phase-2 design task. It should not be quietly swapped during a rebrand.

**ADR-E — `@prisma/adapter-pg@7.5.0` alongside `@prisma/client@5.22.0` (MAP-07/MAP-08).**
*For the status quo*: it is inert. `backend/src/lib/prisma.js` is four lines and constructs a bare
`new PrismaClient()`. Nothing imports the adapter. Removing a dependency touches the lockfile and
the Railway install step on a pipeline that has not run in three months — real risk, zero user
benefit. *Against*: a v7 adapter and a v5 client in one `package.json` is the kind of thing a
technical evaluator greps for, and `backend/src/generated/prisma/*.ts` (eight TypeScript files
from a Prisma 7 generator, against a schema with no `datasource url` — see
`internal/class.ts:23`) reads as an abandoned migration attempt in a repo whose CLAUDE.md says
"no TypeScript". Both are gitignored (`backend/.gitignore:4`, root `src/generated/`) so an
evaluator cloning the repo sees neither — which is the strongest argument for leaving both alone
until Phase 2.

## Out of scope / not verified

- **Git history.** No git command was run, per constraints. Every claim about what is *tracked*
  versus merely *present on disk* is therefore unverified. This affects MAP-05 and MAP-06
  specifically: I read the `.gitignore` rules and reasoned from the pattern grammar, but I did
  not run `git ls-files` or `git check-ignore`. `.gitignore` does not untrack an
  already-tracked file, so the ignore rules alone do not settle it.
- **The test suite.** Not run. CLAUDE.md:75 claims 26 passing; I neither confirm nor dispute it.
  Two test files exist (`auth.test.js`, `karateca.test.js`) and `__mocks__/prisma.js` shows the
  suite mocks Prisma, so the tests do not exercise a real database.
- **Production.** Nothing was fetched. The five-step smoke checklist (CLAUDE.md:108-115) was not
  run. The claim at `backend/docs/API.md:3` that `budokan-backend.up.railway.app` does not exist
  is taken from CLAUDE.md:180-181, **not independently verified by me** — no DNS lookup was made.
- **Vercel and Railway dashboards.** Not accessible. The MAP-06 conclusion that the real
  `VITE_API_URL` lives in the Vercel dashboard is CLAUDE.md's claim, not my verification.
  MAP-04's runtime consequence is explicitly not asserted for the same reason.
- **`README.md`** was matched with ripgrep, not read end to end. My statements cover the seven
  matching lines and nothing else. I make no claim about the accuracy of the rest, including the
  roadmap and the architecture section. CLAUDE.md:12-15 designates it the positioning source of
  truth and I did not evaluate that.
- **`backend/docs/API.md`** — 1127 lines, four of which I read. Whether the documented endpoints
  match the eight routers is not verified.
- **The 11 page components** under `frontend/src/pages/` were searched, not read. I make no claim
  about their behavior, only about the brand strings and storage keys inside them.
- **`node_modules` contents** beyond the `version` field of the 23 packages listed. No transitive
  dependency audit, no `npm audit`, no license review.
- **The security findings in CLAUDE.md:149-162** other than `User.password`: open CORS
  (confirmed present as bare `cors()` at `index.js:18`, but the response header was not observed),
  `x-powered-by` (not observed — needs a live request), localStorage JWT exposure (confirmed as a
  design fact, not assessed as a threat). Threat modeling is `engineering-security-engineer`'s
  scope, not mine.
- **The schema findings in CLAUDE.md:164-177** were read against `schema.prisma` and are
  consistent with the file, but I did not audit them independently — that is
  `engineering-software-architect`'s scope. MAP-11 is the one I surfaced because it is a code
  path, not a schema opinion: `seedKarateca.js:22-29` creates a `User` with no `numeroDocumento`,
  and `auth.controller.js:13` keys login on `numeroDocumento`, so that seeded account cannot log
  in. That is CLAUDE.md's nullable-`numeroDocumento` finding with a concrete instance attached.
- **`backend/coverage/` appeared during this audit** (15:27:26), between two identical ripgrep
  runs, changing the count from 54 to 64. I did not create it and I do not know what did — no
  jest invocation came from this agent. The delta is fully accounted for (10 hits, all in
  `lcov-report/`, all HTML mirrors of the three seed files), so the map is complete either way.
  But the working tree was not stable during this audit, and a Phase 3 rename should re-run the
  enumeration rather than trust these line numbers blindly.
