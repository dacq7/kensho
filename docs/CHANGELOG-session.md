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
