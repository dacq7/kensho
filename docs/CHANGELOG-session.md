# Session changelog — rebrand Budokan → Kensho

Append-only. One entry per implementation step, per the documentation contract in
`CLAUDE.md`. Newest last.

---

## 2026-07-15 — Correct the `budokan_token` count in CLAUDE.md and three audit reports

**Closes**: MAP-01 (codebase-map.md) — `budokan_token` has 6 occurrences, not the 5
CLAUDE.md stated.

### What changed

`CLAUDE.md` claimed `budokan_token` had 5 occurrences and enumerated them. The real
count is 6. The missing one is `frontend/src/store/authStore.js:52`, the `removeItem`
inside the `catch` block of `initAuth`.

This is the failure mode CLAUDE.md's own rebrand category 4 warns about, caused by
CLAUDE.md itself: an engineer renaming exactly the five sites it named would leave
`:52` writing to a dead key. Login would write `kensho_token`, the `initAuth` error
path would clear `budokan_token`, and the stale key would survive. Auth breaks
silently and a 3-minute smoke test does not catch it.

Corrected to 6 with all six paths listed explicitly, in CLAUDE.md and in every audit
report that had copied the wrong number.

### How the error propagated

Worth recording, because the propagation path matters more than the count:

1. **Origin** — `CLAUDE.md:131` stated 5 occurrences. Unverified; source unknown.
2. **Propagation** — three of the four Phase 1 audit agents read CLAUDE.md as
   authoritative and repeated the number without checking it:
   - `architecture.md:152` — repeated it and explicitly endorsed it as "matching
     CLAUDE.md's count"
   - `security.md:187` — said 5, while `security.md:84` in the same report said 6.
     The report contradicted itself and neither the agent nor a reader caught it
   - `product.md:100` — said 5, copied from CLAUDE.md
3. **Detection** — `engineering-codebase-onboarding-engineer` was tasked to prove the
   set complete rather than confirm the known ones. It ran
   `rg -no "(get|set|remove)Item\(['\"][^'\"]+['\"]"` across the repo, got 9 hits
   (6 × `budokan_token`, 3 × `'theme'` in an unrelated markdown doc), and found `:52`.
   Grep over the code, not the count in the file.

The one agent that verified found the error; the three that trusted the file
reproduced it. CLAUDE.md carries an instruction to treat itself as fallible
(`"Contradicting CLAUDE.md is allowed and expected"`). That instruction alone did not
work — three agents read it and still deferred. What worked was a task framed as
"prove the set is complete," which makes deference impossible to satisfy.

The same session found CLAUDE.md's `User.password` finding to be false by the same
route: two agents independently traced the queries instead of accepting the claim.

### Files touched

| File | Change |
|---|---|
| `CLAUDE.md` | Category 4 rewritten: 6 occurrences, all paths listed, old list's failure mode recorded. Committed `cccb364` |
| `docs/audit/architecture.md:152` | ADR-C note: 5 → 6, `:52` added, correction noted |
| `docs/audit/security.md:187` | ADR note: 5 → 6, paths added, self-contradiction with `:84` noted |
| `docs/audit/product.md:100` | 5 → 6, paths added |
| `docs/CHANGELOG-session.md` | This file, created |

`product.md` was not in the original correction request — it was found by grepping
`docs/` for surviving instances of the wrong count rather than going only to the two
known lines.

### What was verified, and how

- All six paths confirmed by `rg -n 'budokan_token'` over the repo excluding
  `node_modules` and `.git`: `frontend/src/lib/api.js:8`, `:22`;
  `frontend/src/store/authStore.js:11`, `:21`, `:30`, `:52`. No other file contains
  the key.
- The set is the complete set of functional brand identifiers:
  `rg -no "(get|set|remove)Item\(['\"][^'\"]+['\"]"` returns only `budokan_token` and
  an unrelated `'theme'`. No `sessionStorage`, no `document.cookie`, no indexedDB, no
  Cache API usage.
- `rg -i '5 occurrences|exactly 5|five sites'` over `docs/` after the edits returns
  only `codebase-map.md:106` and `:365`, which describe CLAUDE.md's error rather than
  repeating it. Correct as written.

### What was deliberately NOT done, and why

- **No `budokan_token` rename.** The key still reads `budokan_token` at all six sites.
  Renaming is category 4 — all six together, with a smoke test, in its own commit.
  This entry corrects the *count*, so that the rename can be done safely later.
- **`codebase-map.md:106` and `:365` left as-is.** They reference "CLAUDE.md's list of
  5" as the historical state at baseline `28e02a2`. That is accurate as a record of
  what the audit found. Rewriting them would erase the detection.
- **No audit report rewritten.** Only the incorrect lines changed. The reports are
  dated artifacts against a stated baseline, not living documents.
- **`architecture.md:152` and `security.md:187` corrections are surgical.** The
  surrounding ADR arguments were not re-examined and are unchanged; only the count and
  paths were wrong.

### Open, not closed by this entry

`security.md:187` said 5 while `security.md:84` said 6 — the report shipped
self-contradictory. Both are now 6. No process change was made to catch a report that
contradicts itself; a second reader or a cross-check pass would have caught it and
neither exists today. Backlog.

---

## 2026-07-15 — Rebrand user-facing brand strings to "Kensho"

**Closes**: MAP category 1 (brand, user-facing) for the frontend and `seed.js:6`.
Implements the brand-string decision recorded in CLAUDE.md Positioning (`905d13f`).

### What changed

Every user-facing brand string is now "KENSHO", one word. "BUDOKAN SKIF" appeared at
6 sites; "Budokan" alone at 2 more. All 8 are done.

"El Carmen de Viboral" removed from all 4 frontend sites: a fictional dojo does not
claim a real location.

The diamond emblem letter changed `B` → `K` at 4 sites. The emblem is a square rotated
45° with the letter centred in its own `<span>` — the geometry assumes nothing about
the glyph, so `K` sits in it the same way `B` did. No forcing was needed.

### Files touched

| File | Change |
|---|---|
| `frontend/src/pages/Login.jsx` | `:36` title; `:97` emblem `B`→`K`; `:103` brand; `:105` location `<p>` deleted; `:119` breadcrumb |
| `frontend/src/components/layout/KaratecaLayout.jsx` | `:83`, `:203` emblem; `:86`, `:175`, `:206` brand; `:87`, `:207` location `<p>` deleted; 2 wrapper `<div>`s removed |
| `frontend/src/components/layout/SenseiLayout.jsx` | `:51` page-title fallback; `:82` emblem; `:88` brand; `:91` location `<p>` deleted; 1 wrapper `<div>` removed |
| `backend/src/utils/seed.js` | `:6` `'Sensei Budokan'` → `'Sensei Kensho'` |

### Structural change beyond the string swap

At 3 sites the location `<p>` sat inside a `<div>` with no `className`, whose only job
was to stack two `<p>`s as one flex item (`KaratecaLayout.jsx:85`, `:205`;
`SenseiLayout.jsx:86`). With the location gone the wrapper held a single `<p>`. A bare
`<div>` and a `<p>` behave identically as a flex item in these containers
(`flex items-center gap-3`), so the wrapper was removed and the `<p>` promoted.

`Login.jsx:101` was left intact — that wrapper carries `flex flex-col items-center
gap-3` and still has 3 children.

### What was verified, and how

- `npm run build` in `frontend/` — passes, built in 1.18s, no errors or new warnings.
- `rg -i 'skif|budokan' frontend/src backend/src/utils/seed.js` — returns only
  `seed.js:9` and `:10`, both deliberately out of scope (below).
- `rg -i 'carmen|viboral' frontend/src` — no hits.
- No `B` remains in any emblem `<span>`.
- **Not verified: rendered appearance.** The build compiling is not evidence that the
  headers look right. Nobody has loaded a page. `tracking-[0.2em]` over a 6-character
  word instead of a 12-character one is a real visual change at 4 sites, and the
  emblem `K` has not been seen at any of its three sizes (80px, 40px, 32px). This
  needs a browser before it is called done.

### What was deliberately NOT done, and why

- **`seed.js:9`** — `process.env.SENSEI_PASSWORD || 'budokan2025'`. Backlog by
  decision; it is a credential default, not a brand string.
- **`seed.js:10`** — `process.env.SENSEI_EMAIL || 'sensei@budokan.com'`. Not in the
  request, and it should not be. `User.email` is `@unique` and this seed has already
  run against production. Changing the default would not rename the existing sensei —
  it would attempt to create a second one, or fail on the unique constraint. This is a
  functional identifier wearing a brand string, the same shape as `budokan_token`.
  Backlog, and it needs the same all-at-once treatment.
- **`README.md:269`** — "Built by Diego Correa — Veridis Dev · El Carmen de Viboral,
  Antioquia, Colombia". This is the 5th "El Carmen de Viboral" in the repo and it was
  left. The stated reason for the removal is that a fictional dojo cannot claim a real
  location; this line is the real author's real location, so the reason does not reach
  it. Removing it is a separate call.
- **No `tracking` adjustment.** The brand is left-aligned in a flex row at 4 of 5
  sites, so a shorter word simply occupies less width — nothing is broken. `Login.jsx:102`
  is centred and `tracking-[0.3em]` adds trailing space after the last letter, which
  shifts the word ~0.15em left of true centre — but that was equally true of
  "BUDOKAN SKIF" and is not a regression. Revisit only with the rendered page.
