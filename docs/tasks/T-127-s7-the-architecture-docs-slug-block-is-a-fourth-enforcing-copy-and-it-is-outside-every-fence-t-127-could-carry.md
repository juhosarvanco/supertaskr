---
id: T-127-s7
title: docs/ARCHITECTURE.md's derived slug block is a FOURTH enforcing copy of the registry, it reds `brief.spec.ts` the moment a component is declared, and it sits outside every fence T-127, T-127-s1 and T-127-s6 could carry
feature: F-06
milestone: 4
priority: 10
size: S
status: done
blocked_by: []
touches: [docs/ARCHITECTURE.md]
suggested_by: executor claude-opus-5 @T-127-s6
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent @T-127-s7
verified_by:
review: self-verified
---

**PROMOTED at the first standing triage, 2026-08-30 — but SEVENTY PERCENT DISCHARGED, and what survives is smaller than the card reads.**

Re-derived at this ref, defect by defect:

| # | as the card names it | now |
|---|---|---|
| 1 | the slug block omits C-17 / C-18, reding `brief.spec.ts` | **DISCHARGED at `268f544`** |
| 2 | *"the full component set — C-08 ... C-16"* omits C-17 / C-18 | **STILL PRESENT** (`docs/ARCHITECTURE.md:36-38`) |
| 3 | *"pinned by three live-tree fixtures"* | **STILL PRESENT** (`:40`) |

`docs/ARCHITECTURE.md:57` now reads `app-board -> C-08, C-09, C-11,
C-17, C-18`, and the field side derived independently
(`grep -l app-board docs/architecture/components/*.md`) returns the same
five — so the spec-asserted copy agrees with the fields and
`brief.spec.ts:439` is satisfied. The T-127-s6 checkpoint claims this
landing and the claim is true. A fourth defect the card never named
(*"Three slugs are claimed by more than one component"* -> *"Two"*)
landed in the same commit.

**WHAT IS LEFT IS THE HALF NOTHING ASSERTS**, which is exactly why it
survived the merge that fixed its sibling: `grep -rn "shared
primitives\|live-tree fixtures"` over `tools/e2e/tests/`, `app/test/`
and `lib/parser/test/` returns nothing. Two prose sentences in one file,
under a path-token fence, with no gate behind them — the card predicted
this and was right.

**THE SIZE IS S AND THE CEREMONY ROW IS THE DOCS ROW** — `docs/` only,
nothing a user could run, so the executor is its own integrator.
Acceptance names the command, not the count: after the edit,
`npm test` from `tools/e2e/` SHALL stay green and the two sentences
SHALL agree with the fields derived from
`docs/architecture/components/C-*.md` at the executing ref.

**T-127-s6 landed the four-node partition and left one file stale that
its fence cannot reach.** `docs/ARCHITECTURE.md` carries a derived slug
block, and `tools/e2e/tests/brief.spec.ts:439` — *"THE SLUG MAP COMES
FROM THE FIELD, and the prose block is compared rather than trusted"* —
asserts that block EQUALS the `touch_slugs:` fields for every slug. The
block is prose the architecture doc's own paragraph describes as
"Derived mechanically from `docs/architecture/components/C-*.md` at this
compaction", and nothing re-derives it.

## Measured at `f0ff62d` (T-127-s6's lane tip), read from `brief.mjs --task T-127-s6`

    app-board -> C-08, C-09, C-11, C-17, C-18   <- the FIELDS
    prose block diverges: app-board: field says C-08, C-09, C-11, C-17,
      C-18 and the prose block says C-08, C-09, C-11

`brief.mjs` itself does NOT red — it reports the divergence as a
finding, which is the design row 5 describes. The spec that DOES red is
`brief.spec.ts`, and it is a `npm test` from `tools/e2e/` body.

## The repair, spelled out so it is one edit and not a judgement

`docs/ARCHITECTURE.md`, the four-space-indented block under **THE SLUG
MAP'S AUTHORITY IS EACH COMPONENT FILE'S OWN `touch_slugs:` FIELD**.
One line moves:

    app-board    -> C-08, C-09, C-11   app-map  -> C-12

becomes

    app-board    -> C-08, C-09, C-11, C-17, C-18   app-map  -> C-12

The parser is `slugMapFromProse` in `tools/e2e/scripts/dispatch-brief.mjs`:
lines starting with four spaces, matched by
`/([a-z][a-z-]*)\s+->\s+((?:C-\d+)(?:,\s*C-\d+)*)/g`. Keep the indent.

**Two more sentences in the same file go stale with it and are NOT
asserted by any suite** — list them in the same edit rather than leaving
a half-repaired doc:

- *"The full component set — C-08 board, C-09 model store, C-10 docs
  watcher, C-11 design tokens, C-12 map pane, C-13 genesis pane, C-14
  agent runner, C-15 dispatch, C-16 shared primitives — is the
  registry"* omits C-17 Board model and C-18 Board root.
- *"pinned by three live-tree fixtures"* was already wrong about
  membership before this card (`T-127-s1` finding 5) and is now wrong
  about the count too — see `T-127-s8`.

## Why T-127-s6 did not do it

`docs/ARCHITECTURE.md` is in NO slug and matches NO fence token. Checked
against the armed manifest rather than by eye — `.nputer/lane-fence.json`
at `fc45724`, whose `paths:` array is the 20 paths of
`[docs/architecture/components/, app-map, crate-index]` — and the
comparison is a case-sensitive PREFIX, so `docs/ARCHITECTURE.md` is not
covered by the `docs/architecture/components` entry that looks nearest to
it. Widening a fence from inside the lane is the one repair an executor
may never make (`method/roles/executor.md`).

**This is the THIRD generation of the same failure on one card**, and the
first two are recorded on `T-127-s1` and `T-127-s6`: T-127's fence could
not reach the two app fixtures, T-127-s1's could not either because T-149
had moved them, and T-127-s6's reaches all three enforcing copies it was
derived against and not the fourth nobody had found. The fence was
derived from `docs-gate.mjs --census`, which does not see this reader —
that gap is `T-127-s8` and is the part worth fixing.

## Fence

`[docs/ARCHITECTURE.md]` — a path token, since the file is in no slug.
It touches no code and no other document. Note that CONVENTIONS' DOCS
GATE fires on it: `docs/ARCHITECTURE.md` is read by
`tools/e2e/tests/brief.spec.ts` through `architectureText()`, so the
owed suite is `npm test` from `tools/e2e/`.

## Implementation notes

Executor `claude-opus-5@subagent`, lane `task/T-127-s7-lane`.
**Base `git merge-base main HEAD` = `0a8dd586`, which was also the branch
tip at dispatch** — the lane carried no commits when this began, so every
figure below is re-derived at `0a8dd586` unless another ref is named.

**The fence was re-derived by DRIVING `decide()`** from
`.claude/hooks/lane-fence.mjs`, not read off `.nputer/lane-fence.json`.
Over seven candidate paths it allows exactly `docs/ARCHITECTURE.md`
("inside the fence domain") and `docs/tasks` ("always-writable"), and
REFUSES `docs/architecture/components/C-09-detail-panel.md`,
`docs/CONVENTIONS.md`, `docs/STATE.md`, `docs/architecture/graph.json`
and `tools/e2e/tests/brief.spec.ts`. The manifest was accurate.

### The card's headline repair was already discharged, and the card's own transcription of it is stale

The card's table marks defect 1 DISCHARGED at `268f544` and then quotes
the landed line as `app-board -> C-08, C-09, C-11, C-17, C-18`. **At
`0a8dd586` the block reads `app-board -> C-08, C-09, C-17, C-18` — no
C-11** — because T-163 took C-11's `touch_slugs:` to the empty list.
Driven through `slugMapFromProse` and `slugMapFromFields` (both exported
from `dispatch-brief.mjs`), the prose map and the field map are 8 slugs
each and AGREE on every one, so `brief.spec.ts`'s *"THE SLUG MAP COMES
FROM THE FIELD, and the prose block is compared rather than trusted"* is
satisfied and its two non-empty guards are non-vacuous. **This lane
changed no character of the slug block.** The card also cites this file
by LINE NUMBER three times; two of the three no longer point where it
says, which is the settled reason a line number is a figure.

### What was repaired: the half nothing asserts

**One paragraph, opening `## Components`.** It carried FOUR defects at
this ref and the card named two:

1. *card* — the enumeration stopped at C-16 while C-17 Board model and
   C-18 Board root exist in the registry.
2. *card* — *"pinned by three live-tree fixtures"*.
3. **not on the card** — it called C-09 a *model store*.
   `C-09-detail-panel.md`'s own field says `name: Detail panel`, and the
   FIELD is the authority.
4. **not on the card** — it read as though the registry were only
   C-08…C-16. C-01, C-05, C-06 and C-07 have files there too; the
   table's C-02/C-03/C-04 are planned and have none.

**A FIFTH, in the same file and inside the fence, that neither this card
nor `T-127-s6` named**: the Interfaces *Code layout* bullet listed
`C-08/C-09/C-11/C-12/C-13/C-16` as the `app/src/` territories and omitted
C-17 and C-18, whose declared `paths:` (`app/src/lib/board-model.ts`,
`app/src/lib/task-detail.ts`, `app/src/components/board/Board.tsx`) are
all under `app/src/`. Same defect class as 1 — the C-17/C-18 declaration
left copies stale — so it is repaired in the same edit rather than
leaving a half-repaired doc.

**The repair does not transcribe a corrected list or a corrected count,
and that is the load-bearing choice.** Defect 2 would be the THIRD
correction of one number (`T-127-s1` finding 5 corrected its membership,
`T-127-s8` item 2 its count) and defect 1 the second correction of one
list. This file's own idiom already answers that shape — its Code-layout
bullet says of the docs readers *"no count of them is ever transcribed
(ask `docs-gate.mjs --census`)"* — as does CONVENTIONS' SHIPPED
PARTITION clause: *"THE COUNT IS NOT WRITTEN HERE because it has already
moved once"*. The paragraph now names the derivations and records what
the old list got wrong. It POINTS AT CONVENTIONS' gate spelling instead
of copying it (T-057: a recipe in two places is two chances to
disagree).

### What would catch this paragraph's deletion — measured, and the answer is NOTHING

- `grep -rn "live-tree fixture\|shared primitives\|full component set\|
  model store"` over `tools/e2e`, `app/test`, `app/src`,
  `lib/parser/test` and `app/src-tauri/crates` returns three hits, every
  one a comment in another test that mentions C-16 by name. No reader.
- `slugMapFromProse` reads ONLY lines beginning with four spaces, so
  every word of this paragraph is structurally invisible to the one spec
  that compares. That is also the constraint the edit had to respect:
  **the diff adds ZERO four-space-indented lines**, leaving both that
  parser and `card-preflight.spec.ts`'s own
  `/^ {4}[a-z][a-z-]*\s+->\s+C-\d+/` filter untouched.
- The only mechanism watching this file at all is its ADR-019 byte band
  in `docs-scan.mjs`'s `DOC_BUDGETS` (`landed` 8525, `warn` 10657,
  `fail` 12788) — a tripwire against GROWTH, which a deletion passes by
  construction. `wc -c` went 8592 -> 9267, inside the band, and the gate
  printed *"governing-document budgets hold"*.
- **Measured, not only derived**: with the whole repaired paragraph
  deleted at the commit below, the four bodies that read this file stayed
  GREEN. The drill is recorded under Gates.

**So this paragraph is pinned by nothing and the edit does not change
that.** Pinning prose is what row 5 rules against; the durable
substitute is the one taken — say the number is not written here and
name the derivation, so the next reader derives instead of trusting.

### Not built, routed — both outside a one-file fence

- **`docs/CONVENTIONS.md`'s DECLARING A COMPONENT gotcha still reads
  THREE** and is wrong about membership too. `T-127-s8` item 2 already
  owns it and says so; `T-127-s5` was rejected for the shape of a card
  that edits CONVENTIONS in passing. `decide()` REFUSES that path from
  this lane. No new card filed — the finding is already owned.
- **The docs-gate census still cannot see `architectureText()`.** Asked
  with this lane's changed path it names `card-preflight.spec.ts`,
  `shell-frame.spec.ts` and `window-contract.spec.ts` as readers of
  `docs/ARCHITECTURE.md` and NOT `brief.spec.ts`, which reaches it
  through that helper — exactly `T-127-s8` item 1, unchanged. It cost
  nothing HERE only because all four live in the same owed suite.

### The drill — the unpinnedness is MEASURED, not asserted

Run at the commit (`02c0c0e`), so a restore cannot pass itself off as a
revert (T-072-s1). **One side only: the DOCUMENT was mutated and no
assertion was touched.**

- **Mutant**: the entire repaired paragraph deleted from
  `docs/ARCHITECTURE.md`.
- **Landing decided by `git diff`, never by the mutator**: `1 file
  changed, 16 deletions(-)`, 16 removed lines and 0 added, and the
  working sha256 moved
  `96d648c7048598de78126cdff88ebc860e5e77e179b0d13b5925848ba468a95f`
  -> `b8242413506a402c8c722d7961e9f0ff10be0e0c02aa4b33649c5bf681edda76`.
- **Result**: `gate-run.mjs e2e` -> `exit=0 bodies=420 verdict=GREEN
  ref=02c0c0e`. **Every one of the 420 bodies passed with the paragraph
  gone.** The suite that holds all four of this file's readers cannot
  tell the repaired paragraph from its absence.
- **Restoration proved rather than asserted**, both sides named:
  `git restore --source=02c0c0e --staged --worktree --
  docs/ARCHITECTURE.md` -> exit 0, and the working file's sha256 is
  `96d648c7048598de78126cdff88ebc860e5e77e179b0d13b5925848ba468a95f`,
  equal to `git show HEAD:docs/ARCHITECTURE.md`'s. Empty `git diff` and
  empty `git status --porcelain` are recorded as COMPANIONS to that
  hash, never as alternatives to it (T-092-s4).

**The drill's finding is a negative and it is the point**: this
paragraph is pinned by nothing, exactly as the old one was, and the edit
does not change that. Pinning prose is what row 5 rules against; naming
the derivation is the substitute, and it works on the READER rather than
on a gate.
