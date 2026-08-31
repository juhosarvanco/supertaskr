---
id: T-142-s1
title: "The `lint:docs` alias runs the DOCS GATE's CENSUS mode, which names no owed suite and exits 0 — so the one command whose name sounds like the general question is the one that cannot answer it"
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
suggested_by: executor claude-opus-5 @T-142
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
builder:
review:
---

**Class parent: `T-142`** (a query ran, produced no error, returned an
answer shaped like the one you wanted, and answered a different
question). **Disposition hint: PROMOTE** — this is the first instance
of that class whose subject is a SHIPPED instrument rather than a
hand-written query, and it is the only one that has cost a red CI run
on main.

## The instance, measured at `1b35e01`

An architect seat set `blocked_by: [T-190]` naming a card that existed
only inside another lane, ran `npm run lint:docs`, read

> `docs-gate: every live task card's frontmatter parses, with a legal status.`

— which is **true** — pushed, and CI reddened in the PARSER suite:
`blocked_by names 'T-190' but no task in the model declares it`
(`lib/parser/test/smoke.test.ts`). Fixed on main at `8df0dcc`.

The seat's own reading was that the gate could not have caught it.
**Re-derived at this ref, that is false**, and the correction is the
finding:

- `npm run lint:docs` is `node scripts/docs-gate.mjs --census`. It
  exits **0**, prints the frontmatter sentence, and prints **no FIRES
  line and no owed suite at all** (`grep -c FIRES` over its output = 0).
- The DOCS GATE **proper**, fed the RANGE RULE's pair, exits **1
  (FIRES)** on a `docs/tasks/*.md` path and names
  `npx vitest run from lib/parser/`, listing
  `lib/parser/test/smoke.test.ts` BY NAME.

## Why it is worth a card rather than a hazard line

`T-090` (done) argued the DOCS GATE is deliberately NOT an npm script
and recorded that `tools/e2e/package.json` carried **exactly four**.
Re-derived here it carries **nine**, and `lint:docs` — added since — is
an alias for the census half. So the repository grew exactly the
affordance T-090 argued against, pointed at the mode that cannot answer
the gate's question, under the name most likely to be reached for.

Two exit-0 meanings now collide: the gate's contract reserves 0 for
*nothing owed*, and the census returns 0 for *I was not asked*.

## Shape of a fix, not the fix

Rename or re-scope the alias so the name states which half it runs, or
have `--census` print one line saying it computed no owed-suite verdict
and that the gate's diff form is the instrument for that. **Not** a new
gate: the instrument that catches this already exists and works.

## Implementation notes (executor claude-opus-5, 2026-08-31)

Built in `/Users/ujju/Projects/nputer-T-142-s1` on
`task/T-142-s1-the-lint-docs-alias-names-the-census-mode`, base
`57c1b39`, work at `cb0d77d`. Every figure below was re-derived in this
lane; where the dispatch brief and the tree disagreed, the tree won and
it is said so.

### What the card asked for, and which of its two shapes was built

The card offers two: **rename or re-scope the alias**, or **have
`--census` say it computed no owed-suite verdict**. The first is
**outside this fence** — CI's step is `npm run lint:docs`
(`.github/workflows/ci.yml`) and `workflow-parity.spec.ts`'s
`CI_SEQUENCE` spells it a third time, so a rename is a three-file
commit and `.github/` is not in `touches:`. **Routed, not built.**

The second is built, and it is built larger than "print one line",
because measuring the mode showed the disclaimer was **already there**
and was not enough.

### The defect, re-measured at `57c1b39` before anything was changed

`npm run lint:docs` is `node scripts/docs-gate.mjs --census`.

- Census exits **0**; `grep -c FIRES` over its output = **0**. It cannot
  reach the FIRES branch at all — that branch is guarded on
  `paths.length > 0`.
- It DID already print
  `docs-gate: --census — the derivation above, no diff judged.`
  **The line was third from the end.** Below it came
  `docs-gate: every live task card's frontmatter parses, with a legal
  status.` and `docs-gate: governing-document budgets hold — 4 gated…`.
- **So the last thing a reader saw was a clean whole-tree sentence,
  followed by exit 0** — and the header's own legend reserved 0 for
  *"the diff owes nothing"*. Two facts, one number, and the reassuring
  one had the last word.

**That is the correction this lane makes to its own card.** The card
says the census "prints no owed suite at all", which is true; what it
does not say is that the disclaimer already existed and was defeated by
POSITION. A fix that only added a sentence would have added a second one
in the same losing place.

### What changed

1. **`docs-gate.mjs` — the census verdict MOVED to the end of `main`**,
   after the root-anchor, package-relative, unlinkable-reader,
   frontmatter, ADR-019 budget and STATE-staleness checks. It is now the
   last thing printed on a census run. The three diff-verdict arms are
   unchanged and now sit under one `paths.length > 0` guard.
2. **The verdict says which half it answered**, carries that half's
   finding count, and legends its own code — *"a 0 here means 'I was not
   asked', never 'nothing owed'"* — with the 0 interpolated from
   `EXIT.CLEAN` rather than typed, so the frozen object stays the single
   authority (the pin at `THE EXIT OBJECT IS THE SINGLE AUTHORITY` still
   holds).
3. **It names the alias and the other instrument**: that this mode is
   what `npm run lint:docs` and CI's step run, and that the owed-suite
   verdict comes from handing the same script the RANGE RULE's paths.
4. **The header's exit-0 legend is corrected.** It claimed one question
   where there are two; it now legends 0 per mode and carries the
   incident.
5. **A stale closed list is removed, in two of its three copies.**
   CONVENTIONS and the script header both said the whole-tree half is
   *"the frontmatter vocabulary, the root-anchor account and the
   unlinkable-reader tripwire"* — **three items, and the mode already
   ran the ADR-019 byte budgets and the STATE-staleness check besides**,
   both of which can move `found`. A closed list of a growing set is the
   signpost-versus-authority failure this file legislates against.
6. **`docs/CONVENTIONS.md` gains the exit-0 clause** in the
   `npm run lint:docs` paragraph, and pays for it in bytes (below).
7. **One new spec body** pins the property with a positive control.

**NOTHING NEW REFUSES.** No check was added, none removed, no exit code
moved — see the matrix below. The finding was never a missing
instrument; it was a true sentence in the wrong place with an ambiguous
number after it.

### The exit matrix — 18 inputs, before and after, IDENTICAL

Read from the child's own status via `spawnSync`, with **no pipe between
the gate's `process.exit` and the reader**. Both runs at the same tree,
one before the edit and one after; `diff` over the two tables is empty.

| exit | inputs |
|---|---|
| **0** | `--census` · `app/src/main.tsx` · `--census app/src/main.tsx` |
| **1** | `docs/ROADMAP.md` · `docs/CONVENTIONS.md` in three spellings (root-relative, `./`, absolute) · `../../docs/CONVENTIONS.md` from tools/e2e · `--census docs/ROADMAP.md` · `docs/checkpoints/TEMPLATE.md` |
| **2** | no args · `--range a..b` · plain relative from tools/e2e · `""` · `"   "` · a newline blob · `/etc/passwd` |
| **3** | `docs/ROADMAP.md` with `PATH=/nonexistent-dir` |

**This is the evidence for "not guard-class"**, and it is offered as a
measurement rather than as an argument: the set of trees this gate
refuses is byte-identical before and after.

### The byte band — measured at every step, never estimated

`docs/CONVENTIONS.md`, against `DOC_BUDGETS` (`docs-scan.mjs`): warn
**164,393**, fail **197,271**.

| | bytes | headroom | % of warn |
|---|---|---|---|
| base `57c1b39` | 147,948 | 16,445 | **10.0035%** |
| this lane `cb0d77d` | **147,947** | **16,446** | **10.0041%** |

**Net −1 byte, so the 10% drift band is HELD** — it had **5** bytes of
slack above that line and now has **6**. The dispatch brief said "about
six bytes above"; measured, it was five, and that is the only figure in
the brief this lane found off.

**The −1 was earned, not found.** The addition was drafted five times
and measured each time against the paragraph's own 799 bytes: **+346**,
then +103, then +9, then **798 (−1)**. Four drafts were cut. What paid
for it was the stale three-item list in item 5 above — a deletion that
is a CORRECTION rather than a trim, which is the only kind of deletion
ADR-019 allows here.

`main` did not move `docs/CONVENTIONS.md` between `57c1b39` and
`726d807`, so the figure holds against the current integration tip too.

### The uniqueness traps, checked BEFORE writing

Both are live in this file and both were checked at this ref rather than
assumed:

- **`rawBullet`/`conventionsBullet` throw unless their phrase matches
  exactly one column-zero bullet.** The edit stays inside the existing
  `DOCS GATE (T-084` bullet and repeats no pinned phrase.
- **`parseDocsGateRecipe` takes the FIRST match of
  `/^ +(node tools\/e2e\/scripts\/docs-gate\.mjs .+)$/m` inside that
  bullet.** Exactly one line matches today (the printed recipe); every
  other mention in the file is backtick-wrapped and does not match. **So
  no indented bare invocation line was added** — the new prose names the
  diff form in words instead. Re-parsed after the edit: the recipe's two
  lines, both dialect columns and all four matrix codes still resolve.
- **`the DOCS GATE bullet names exactly the commands the derivation
  produces`** reads every backticked `` `X from Y/` `` in the bullet and
  requires set equality with the derivation. The new prose adds none;
  the set is still the same four.

### Evidence per acceptance criterion

The card carries **no `## Acceptance criteria` section** — the dispatch
brief's own signal row says so (*"the card carries no acceptance
criteria, so there is nothing to build against — TRY"*). So the
"Shape of a fix" section is what was built against, and each of its
three clauses is answered:

- *"Rename or re-scope the alias so the name states which half it
  runs"* — **NOT BUILT, ROUTED.** Out of fence (`.github/`). The script
  header now records why, so the next reader does not re-derive it.
- *"or have `--census` print one line saying it computed no owed-suite
  verdict and that the gate's diff form is the instrument for that"* —
  **BUILT**, and larger than one line, because the measurement showed a
  line alone was what already failed. It is the LAST line.
- *"**Not** a new gate: the instrument that catches this already exists
  and works"* — **HONOURED, and proven**: the exit matrix is unchanged
  across 18 inputs, and the new body's positive control shows the
  existing instrument answering the question the census declines.
