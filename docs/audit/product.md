# Product & Documentation — Audit Report
**Agent**: product-manager
**Date**: 2026-07-15
**Baseline commit**: 28e02a2
**Branch**: feat/kensho-rebrand
**Scope**: The repo and the demo evaluated as an agency portfolio case study for a potential client who spends 90 seconds. README structure and accuracy, the login entry path for a visitor, whether the `Poliza` and document-number narrative assets are surfaced or buried, and what is superfluous / missing / confusing. Not a product-growth review.
**Method**: Files read in full unless noted.
- `/home/dac/Escritorio/kensho/CLAUDE.md`
- `/home/dac/Escritorio/kensho/README.md`
- `/home/dac/Escritorio/kensho/frontend/index.html`
- `/home/dac/Escritorio/kensho/frontend/src/App.jsx`
- `/home/dac/Escritorio/kensho/frontend/src/pages/Login.jsx`
- `/home/dac/Escritorio/kensho/frontend/src/pages/karateca/Poliza.jsx`
- `/home/dac/Escritorio/kensho/frontend/src/components/ui/Input.jsx`
- `/home/dac/Escritorio/kensho/frontend/package.json`
- `/home/dac/Escritorio/kensho/backend/src/utils/seedDemo.js`
- `/home/dac/Escritorio/kensho/backend/docs/API.md` (first 40 lines only)
- `/home/dac/Escritorio/kensho/.github/screenshots/screenshot-login.png` (viewed)
- `/home/dac/Escritorio/kensho/.github/screenshots/screenshot-sensei-dashboard.png` (viewed)

## Summary

- **The demo has a closed front door.** `Login.jsx` renders a document-number field whose only hint is the placeholder `"Solo números"` (`Login.jsx:137`). Nothing on the screen tells a visitor *which* numbers. The credentials exist only in the README at line 237 — roughly 230 lines below the "Live Demo" badge at line 5 that sends the visitor to the app in the first place. A visitor who clicks the badge first, which is the most likely path, cannot get in.
- **The repo does not say Kensho.** `README.md:1` reads `# Budokan SKIF — Dojo Management System`. The browser tab of the live demo reads `frontend` (`index.html:7`). A visitor arriving at a repo called `kensho` sees a third and fourth name in the first ten seconds.
- **The two narrative assets are present in the product but absent from the pitch.** `Poliza` is fully built (`frontend/src/pages/karateca/Poliza.jsx`, 226 lines, expiry countdown and history) and document-login is the real auth path — but the README presents both as neutral feature bullets. It never states *why* they exist. The strongest evidence that this is production work is in the repo and unexplained.
- **The README is honest about scope and should not be touched on scope.** It is inaccurate on two verifiable facts (Vite version, `README.md:90` vs `package.json:36`; a TypeScript claim at `README.md:170` in a JavaScript codebase) and `backend/docs/API.md:3` points at a host that CLAUDE.md states does not exist.
- **Highest-leverage work today is roughly 2 hours** and is entirely copy, one `index.html` title, and one login-screen block. No migration, no schema, no infra.

## Findings

| ID | Finding | Severity | Evidence | Today/Backlog | Effort |
|----|---------|----------|----------|---------------|--------|
| PM-01 | Login screen shows no demo credentials and no explanation of what a "número de documento" is. Placeholder is only `"Solo números"`. Visitor cannot enter the demo without leaving it and scrolling the README. | Critical | `frontend/src/pages/Login.jsx:137` (`placeholder="Solo números"`); whole form block `Login.jsx:130-171` contains no hint/demo text; confirmed visually in `.github/screenshots/screenshot-login.png` | Today | 30–40 min |
| PM-02 | Demo credentials sit at `README.md:237-241`, ~230 lines below the "Live Demo" badge at `README.md:5`, under a `### Demo Seed` heading nested in "Getting Started" (a self-hosting section). Not discoverable at the point of need. | Critical | `README.md:5` (badge), `README.md:229-241` (`### Demo Seed` → seed command → live-demo link → credentials table) | Today | 15 min |
| PM-03 | Live demo browser tab title is `frontend`. No meta description. `<html lang="en">` while the entire UI is Spanish. | High | `frontend/index.html:7` (`<title>frontend</title>`), `index.html:2` (`lang="en"`), no `<meta name="description">` in `index.html:3-8` | Today | 10 min |
| PM-04 | README H1 and all user-facing copy still say "Budokan SKIF" on a branch named `feat/kensho-rebrand` in a repo named `kensho`. | High | `README.md:1`, `README.md:48`; UI: `Login.jsx:104` (`BUDOKAN SKIF`), `Login.jsx:119`, `Login.jsx:97` (emblem letter `B`); `backend/docs/API.md:1` | Today (brand category 1 per CLAUDE.md) | 45 min |
| PM-05 | `Poliza` narrative is buried. README lists "insurance policies" as a feature (`README.md:3`, `README.md:64`) but never states that Colombian dojos legally require per-student insurance. The domain justification — the thing a template cannot fake — is never written down. | High | `README.md:3`, `README.md:64` (feature bullet, no rationale); `README.md:147` mentions computed `estado` as a "notable pattern" with no domain context; contrast `CLAUDE.md:41-46` which names it a narrative asset | Today | 20 min |
| PM-06 | Document-number login narrative is buried. README surfaces it only as a `Document` column header in the credentials table (`README.md:237`). The reason (sensei holds each student's national ID; students may not have email) appears nowhere in the README. | High | `README.md:237-241`; no mention in Overview (`README.md:46-48`) or Key Engineering Decisions (`README.md:167-175`); contrast `CLAUDE.md:43-46` | Today | 20 min |
| PM-07 | README states "React 19 + Vite 6"; the manifest pins Vite 8. A reviewer who opens `package.json` finds the README wrong on a checkable fact in under 30 seconds. | Medium | `README.md:90` (`Frontend \| React 19 + Vite 6`) vs `frontend/package.json:36` (`"vite": "^8.0.1"`) | Today | 5 min |
| PM-08 | `backend/docs/API.md` production base URL points at `budokan-backend.up.railway.app`. CLAUDE.md states that host does not exist. | Medium | `backend/docs/API.md:3`; `CLAUDE.md:180-182` | Today | 5 min |
| PM-09 | README claims Prisma gives "generated TypeScript types reduce runtime errors" as an engineering decision in a codebase that is JavaScript by explicit decision. Reads as copied boilerplate. | Medium | `README.md:170` vs `CLAUDE.md:68` / `CLAUDE.md:265` | Today | 5 min |
| PM-10 | Six screenshots (`README.md:9-42`) occupy the entire first screen. "Overview" — the only text answering "what is this" — starts at `README.md:46`, below the fold on most displays. | Medium | `README.md:9-42` (screenshot table) precedes `README.md:46` (`## Overview`) | Today | 15 min |
| PM-11 | Login left panel prints `Dojo · El Carmen de Viboral` alongside `BUDOKAN SKIF`. CLAUDE.md states the client dojo's name is confidential by agreement. Whether the pair identifies the real dojo is a decision the owner must make; I am not asserting a leak. | Medium | `Login.jsx:104-105`; `README.md:269` (same locality in the author footer); `CLAUDE.md:50-52` | Today (decide) | 10 min to decide |
| PM-12 | Tests badge is hand-written static text "26 passing" linking to the old repo URL. It cannot rot visibly, which is worse than a badge that goes red. | Low | `README.md:5` (`Tests-26%20passing` → `github.com/dacq7/budokan-app`) | Backlog (real badge needs CI, `CLAUDE.md:82`) | 20 min + CI |
| PM-13 | Login page has ~40% vertical dead space on desktop; the form sits in a 380px column in an otherwise empty right panel. It is the first screen of the demo and the first screenshot in the README. | Low | `.github/screenshots/screenshot-login.png` (viewed); `Login.jsx:115-116` | Backlog | — |

## The 90-second walkthrough

**Path A — visitor opens the GitHub repo (most likely for a technical evaluator).**

- **0:00–0:08** — Repo is named `kensho`. The H1 says `Budokan SKIF — Dojo Management System` (`README.md:1`). First unresolved question: is this the right repo? Nothing on the page contains the word Kensho.
- **0:08–0:25** — A wall of six screenshots (`README.md:9-42`). They are good screenshots; the sensei dashboard reads as a real product. But they answer "what does it look like" before "what is it", and they push Overview below the fold.
- **0:25–0:45** — Overview (`README.md:46-48`) lands the message: built for a real dojo, actively used, two roles. This is the strongest paragraph in the document and it is the fourth thing on the page.
- **0:45–1:10** — Features table. Dense, credible, specific ("mora detection after day 5", `README.md:64`). A reader who gets here is convinced. Most will not read all of it.
- **1:10–1:30** — Skim of Tech Stack. If they cross-check `package.json`, the README is wrong about Vite (PM-07) and claims TypeScript benefits in a JS repo (PM-09). Credibility cost is out of proportion to the size of the errors.
- **Stall point**: they never reach `README.md:237`. Demo credentials are below Getting Started, API Documentation is below that. The single most valuable link for a non-self-hosting visitor is buried under instructions for self-hosting.

**Path B — visitor clicks the "Live Demo" badge first (`README.md:5`).**

- **0:00–0:05** — Browser tab reads `frontend` (`index.html:7`).
- **0:05–0:20** — Login screen loads. It looks intentional: kanji watermark, gold-on-black, a diamond emblem. Good first impression.
- **0:20–0:60** — **Hard stall.** Field label: "Número de documento". Placeholder: "Solo números" (`Login.jsx:137`). The visitor is not Colombian, has no national ID in this system, and has no idea what to type. There is no demo hint, no "use 11111111", no autofill button, no link back to the README. Guessing produces "Credenciales incorrectas" (`Login.jsx:58`).
- **0:60–0:90** — Two outcomes. Either they go back to the README and scroll 230 lines to find the table (few will), or they close the tab. **The demo's conversion depends on a table the visitor never sees.**

The irony worth stating plainly: the login method is one of the two best pieces of evidence that this is real production software, and it is currently the thing that ejects visitors from the demo.

## Detail

### PM-01 / PM-02 — The demo has no way in (Critical)

**What it is.** `Login.jsx:130-171` renders exactly two inputs and a button. The document field carries `label="Número de documento"` and `placeholder="Solo números"` (`Login.jsx:134-137`). There is no helper text, no demo-credential block, no prefill. `Input.jsx:1-23` accepts only `id`, `label`, `error` and passthrough props — it has no `hint` slot, so a helper line needs either a new prop or markup placed outside the component. The credentials that work (`11111111` / `demo2025`, `22222222` / `demo2025`) are confirmed real at `seedDemo.js:302-303` and match `README.md:237-241`.

**Why it matters.** For a portfolio, the demo is the product. Every visitor who clicks "Live Demo" before reading the README hits an authentication wall with no key. This is not a UX nitpick; it is the difference between a case study that demonstrates work and a login screen that demonstrates nothing.

**What it costs to fix.** 30–40 minutes for a demo block under the form: a short line naming the two roles and their document numbers, plus optional click-to-fill buttons calling `setValue` from the already-imported `useForm` (`Login.jsx:25-33`). Plus 15 minutes to lift the credentials table to just under the badges at `README.md:5`, keeping a copy where it is.

**What breaks if fixed wrong.**
- Hardcoding credentials unconditionally ships demo hints into an app CLAUDE.md states is *in production with a real sensei and students* (`CLAUDE.md:89-90`, `README.md:48`). The block must be gated — an env flag such as `VITE_DEMO_MODE` read at build time. Vercel and Railway hold their own env values (`CLAUDE.md:184-186`), so this needs a deliberate dashboard change, not a repo change alone.
- Do not add a new `VITE_` variable by copying `frontend/.env.production`. CLAUDE.md flags that file as containing `envVITE_API_URL=` — a name that Vite never exposes (`CLAUDE.md:183-186`). I did not open that file; see "not verified".
- Do not prefill the password field by default. Autofilled password inputs interact badly with browser password managers and it reads as careless.

### PM-03 — The live demo's tab says `frontend` (High)

**What it is.** `index.html:7` is `<title>frontend</title>` — the Vite scaffold default, never changed. `Login.jsx:35-37` sets `document.title = 'Iniciar sesión — Budokan'` on mount, so the tab self-corrects after React hydrates, but the initial paint, the bookmark, and any share-card preview use `frontend`. There is no `<meta name="description">` (`index.html:3-8`), so a link pasted into Slack or LinkedIn previews with no description. `lang="en"` (`index.html:2`) is wrong for a fully Spanish UI and affects screen-reader pronunciation.

**Why it matters.** It is the first pixel of the demo and it says the project was never finished. Cost to fix is minutes; cost of leaving it is a first impression.

**What it costs to fix.** 10 minutes: title, `lang="es"`, one meta description.

**What breaks if fixed wrong.** Nothing structural. Note the title must not be set to "Budokan" — the rebrand is in progress (`CLAUDE.md:93-96`) and this is brand category 1, "change today" (`CLAUDE.md:122-124`). Also verify `/favicon.svg` (referenced `index.html:5`) is not a Vite default before shipping; I did not open it.

### PM-04 — The repo does not say Kensho (High)

**What it is.** `README.md:1` and `README.md:48` say "Budokan SKIF". `Login.jsx:104`, `Login.jsx:119` and the emblem letter `B` (`Login.jsx:97`) say Budokan. `backend/docs/API.md:1` says Budokan.

**Why it matters.** A potential client landing on `github.com/dacq7/kensho` sees Budokan in the H1 and `frontend` in the demo tab. Three names, none matching the URL they clicked. That is not "in progress" to an outsider — it reads as abandoned.

**What it costs to fix.** ~45 minutes for user-facing strings only.

**What breaks if fixed wrong.** This is the sharpest trap in the repo. CLAUDE.md defines four rebrand categories (`CLAUDE.md:118-142`) and a global `sed` breaks production. Specifically: `budokan_token` is a functional localStorage key with 6 occurrences (`frontend/src/lib/api.js:8`, `:22`; `frontend/src/store/authStore.js:11`, `:21`, `:30`, `:52`) and must move all-at-once or not at all (corrected 2026-07-15: this said 5, copied from CLAUDE.md's then-incorrect count); the Vercel hostname `budokan-app.vercel.app` is simultaneously the README's first link and the deployed project name, and renaming it kills the URL rather than redirecting (`CLAUDE.md:137-142`). Brand strings in JSX and Markdown are safe. The `B` emblem at `Login.jsx:97` is a design decision, not a string swap — a `K` in a diamond built for a `B` may not sit right, and CLAUDE.md notes black-and-gold is Budokan's identity, not necessarily Kensho's (`CLAUDE.md:194-196`).

### PM-05 / PM-06 — The narrative assets are built but unpitched (High)

**What it is.** `frontend/src/pages/karateca/Poliza.jsx` is 226 lines implementing per-student insurance: current policy card with insurer and policy number (`Poliza.jsx:117-123`), a three-state computed badge (`Poliza.jsx:29-33`), a day-accurate countdown that handles the expired case separately (`Poliza.jsx:136-158`), an explicit "Sin póliza registrada → Contacta al Sensei" empty state (`Poliza.jsx:107-114`), and a historical policies table with a separate mobile card layout (`Poliza.jsx:173-223`). The seed carries three policies in three deliberate states — active, near-expiry, expired (`seedDemo.js:262-286`). Somebody who had not lived this problem would not build it, and would certainly not seed all three states.

The README's total commentary on this is the word "insurance policies" in a sentence at `README.md:3` and two feature bullets (`README.md:64`, `README.md:76`). It never says: *Colombian dojos are required to carry insurance per student; the sensei was tracking expiry dates on paper and students were training uninsured.*

Same pattern for login. `README.md:237` has a column header reading `Document`. The Overview (`README.md:46-48`) and Key Engineering Decisions (`README.md:167-175`) — which has room for a bullet on Vercel rewrite rules — never mention that auth is by national ID because the sensei has every student's ID and students may not have email.

**Why it matters.** The agency is selling judgment, not React. Every portfolio repo has CRUD, a dashboard and JWT. Almost none has `Poliza`. The differentiator is sitting in the codebase with no caption. `README.md:173` already proves the author can write this kind of note — the timezone-safe date parsing bullet explains a real constraint (UTC-5 Colombia) and it is the most persuasive line in the document. `Poliza` and document-login deserve the same treatment and are bigger.

**What it costs to fix.** 40 minutes total: two bullets in Key Engineering Decisions, one sentence in Overview. Optionally one line of Spanish UI copy on the Poliza page explaining why the dojo tracks it.

**What breaks if fixed wrong.** Two live wires. First, the client dojo's identity is confidential (`CLAUDE.md:50-52`) — the story must be told about "a Colombian dojo", never named, and must not describe the client's specific operational failures in a way that identifies them. Second, this narrative must not become a scope claim. "Insurance tracking because Colombian dojos require it" is a fact about one dojo's requirements. It must not drift toward implying the product serves Colombian dojos generally — that is the positioning CLAUDE.md bans (`CLAUDE.md:17-35`). Describe the origin, not a market.

## ADR candidates

**1. Login by `numeroDocumento` instead of email.**
The critique is real and belongs in the ADR: CLAUDE.md verifies `numeroDocumento` is `String?` nullable while being the login key, and `email` is required and unused for auth (`CLAUDE.md:166-169`) — a student created without a document is locked out with no recovery. **The argument in favour is stronger than it first looks.** The sensei enrols students in person and physically holds every student's ID document. A meaningful share of the roster are minors (`seedDemo.js:107` seeds a student born 2010) who have no email. Email-based auth would have created a field the sensei must invent, students cannot receive, and password reset cannot use — a reset link to an address nobody reads is worse than no reset. Document-number auth matches the real enrolment flow exactly: the sensei creates the account from the ID in their hand. It is the right call for this dojo, and it is evidence of domain contact. The nullable column is a schema bug to fix later (frozen today, `CLAUDE.md:256-258`); the auth *decision* is sound and should be defended in writing, not apologised for.

**2. Demo credentials visible on the login screen of a production app.**
The argument in favour of the status quo: this app has real users, and printing working credentials on the login screen of a live system is normally indefensible. The counter-argument is that the "production" system and the portfolio demo are the same deployment serving fictional data (`CLAUDE.md:54-56`), and a demo nobody can enter has zero portfolio value. The resolution is not "add the hint" or "don't" — it is an env-gated demo mode, which is itself the ADR: what distinguishes a demo deploy from a dojo deploy, and who owns that flag.

**3. Screenshots before prose in the README.**
In favour: the screenshots are genuinely strong, they prove the thing exists and is finished, and for a design-conscious reader an image beats a paragraph. Against: they delay the sentence that establishes this is real production work for a real dojo. A defensible middle is one hero screenshot plus the Overview paragraph, with the remaining five in a collapsed `<details>` block — but "images first" is a legitimate choice and should be recorded as one rather than silently reversed.

**4. Spanish UI with English documentation.**
Already decided and recorded (`CLAUDE.md:37-39`) as DDD ubiquitous language. Worth noting here only because it produces a visible artifact: `index.html:2` declares `lang="en"` on a Spanish UI. Fixing the `lang` attribute is a bug fix, not a reversal of the decision.

## Out of scope / not verified

- **The live deployed app.** Explicitly out of scope per instructions. All statements about the demo's behaviour are inferred from source I read (`index.html`, `Login.jsx`, `App.jsx`) and the two committed screenshots I viewed. I did not confirm what production currently serves; CLAUDE.md states the last deploy was April 12 2026 (`CLAUDE.md:91-92`), so production may not match this branch's source.
- **Screenshots I did not open**: `screenshot-login-mobile.png`, `screenshot-karateca-dashboard.png`, `screenshot-sensei-karatecas.png`, `screenshot-sensei-mensualidades.png`. I make no claim about mobile rendering or those screens. Note that the two screenshots I did view show Budokan branding — the full set is presumably affected by the rebrand, but I did not verify the other four.
- **The `docs/` directory contents.** I did not enumerate it. I make no claim about whether ADRs, a changelog, or other audit reports exist. My "ADR candidates" section proposes decisions worth recording; it does not assert that none are recorded.
- **`frontend/.env.production`.** Not opened. CLAUDE.md's claim about `envVITE_API_URL=` (`CLAUDE.md:183-186`) is repeated as CLAUDE.md's claim, not verified by me. It matters to PM-01's fix path and should be checked before adding any `VITE_` variable.
- **`favicon.svg`.** Referenced at `index.html:5`; not opened. Whether it is the Vite default or a real mark is unverified, and it is part of the tab-level first impression alongside PM-03.
- **All source under `pages/sensei/`, `pages/karateca/` except `Poliza.jsx`, all layouts, `store/`, `lib/`, `routes/ProtectedRoute.jsx`, all `components/ui/` except `Input.jsx`.** I did not read them and describe no screen I did not read. In particular I make no claim about the dashboards beyond what the one screenshot shows.
- **`backend/docs/API.md` beyond line 40.** Only the header and table of contents were read. PM-08 concerns line 3 only; I make no claim about the accuracy of the endpoint documentation itself.
- **All backend source and `schema.prisma`.** Out of scope for this agent. The `User.password` exposure risk CLAUDE.md flags as the one launch-embarrassing bug (`CLAUDE.md:156-160`) is not assessed here and belongs to `engineering-security-engineer`. It outranks everything in this report if confirmed.
- **Test suite.** Not run. The "26 passing" figure is repeated from `README.md:259` and `CLAUDE.md:75`, not verified.
- **Accessibility, performance, visual design quality.** Other agents. PM-13 is a layout observation from a screenshot, not an audit finding.
- **I did not contradict CLAUDE.md anywhere in this report.** Every CLAUDE.md claim I relied on is attributed to it rather than asserted as my own verification, except where I opened the file myself (`seedDemo.js` credentials, `API.md:3` base URL, `package.json` Vite version — all three confirmed as CLAUDE.md described).
