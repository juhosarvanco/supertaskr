---
id: T-163-s3
title: The C-11 ruling's last live copy is a sentence in docs/CONVENTIONS.md that still says C-11 carries two slugs — the suite halves are discharged, the governing doc was outside every fence that fixed them
feature: F-06
milestone: 4
priority: 18
size: S
status: building
suggested_by: executor claude-opus-5@subagent @T-163
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-163's LANE AT `89af57a`, ROUTED RATHER THAN FIXED:
`lib/parser` is outside T-163's fence** (asked of `decide` in
`.claude/hooks/lane-fence.mjs`, which answers
`block / outside-the-fence` for `lib/parser/test/fence.test.ts`).
**CORROBORATES `T-163-s2` RATHER THAN DUPLICATING IT** — same cause,
different package, therefore a different fence and its own card.

## The cause, once

@human's architecture ruling of 2026-08-30 took C-11's `touch_slugs:`
from `[app-shell, app-board]` to `[]`. C-11 was the ONLY component in
the registry carrying more than one slug (derive:
`git grep -h '^touch_slugs:' docs/architecture/components/`). Bodies
that reach into the LIVE registry for a doubly-claimed component
therefore lose their subject, whatever spelling carries the ruling.

## The two bodies, measured

`npx vitest run` from lib/parser/ at `cec6cde` — **2 failed / 313
passed, 1 failed file of 15, exit 1**. The smoke test over the live
docs/ tree is GREEN, so this is not a parse problem.

1. `test/fence.test.ts`, describe *"slugPathIndex — the map is READ from
   touch_slugs:, never built"*, body *"C-11 carries two slugs, so
   app-board and app-shell share its paths"* —
   `expect(doubleClaimed.map((c) => c.id)).toEqual(['C-11'])`, Received
   `[]`. The body then asserts `c11.touchSlugs` equals
   `['app-shell', 'app-board']`, which is the field the ruling changed.
   **The whole body is about the fact that was ruled away.**
2. `test/fence.test.ts`, describe *"THE TWO PINS THE CARD ASKS FOR, each
   measured against BEFORE"*, body *"PIN TWO (a): two live planned cards
   whose slugs differ and whose paths meet at C-11"* —
   `expect(seen.verdict).toBe('overlapping')`, Received `'disjoint'`.
   It drives T-112 `[app-dispatch, app-board]` against T-114
   `[app-shell]` and expects witnesses
   `['app/src/assets', 'app/src/styles']` via `app-board|app-shell`.
   **That pair is exactly what the ruling makes disjoint** — the
   `disjoint` it now returns is the ruling working, not the comparator
   failing.

Note what body 2 is FOR: it is the pin proving `compareFences` catches
an overlap that `tokenEquality` misses. That property is untouched and
still worth pinning; only its live instance is gone. Its sibling
*"PIN TWO (b)"* — T-128 against T-134, containment through
`method/` — is GREEN and unaffected, and is the model for what a
surviving live instance looks like.

## The shape of the fix

The same treatment T-163 applied inside its own fence to
`app/test/select-board.test.ts`'s three equivalent bodies: **state the
ruled fact on the live half (including the assertion that the pair now
comes back disjoint, so the ruling is pinned rather than merely
tolerated), and move the MECHANISM onto a synthetic registry that still
carries the shape — one component, two slugs.** That file already builds
synthetic cards (`synthetic('T-907', […])`) and has a `components`
fixture to extend, so the cost is small. Result there: 83 passed,
nothing loosened, every moved assertion keeping a positive control.

**Do not delete body 1 outright.** Its subject — *is there a
doubly-claimed component in this registry?* — is now a NEGATIVE worth
asserting: after this ruling, `components.filter((c) =>
c.touchSlugs.length > 1)` being empty is a property somebody could
silently undo, and a body asserting it empty is how the ruling stays
ruled.

## A standing gotcha this uncovers, for whoever can reach CONVENTIONS

CONVENTIONS' **DECLARING A COMPONENT** gotcha says declaring a component
moves THREE live-registry fixtures (`lib/parser/test/smoke.test.ts`,
`app/test/architecture-dogfood.test.ts`,
`app/test/map-dogfood-render.test.tsx`). **MOVING A `touch_slugs:` FIELD
IS A DIFFERENT EDIT AND MOVES A DIFFERENT SET, AND NOTHING SAYS SO.**
Measured at T-163, which moved exactly one field: the three fixtures
that gotcha names were ALL GREEN and needed nothing, while four other
places moved —

    lib/parser/test/fence.test.ts        (2 bodies, this card)
    app/test/select-board.test.ts        (3 bodies, fixed in T-163's lane)
    tools/e2e/tests/brief.spec.ts        (3 bodies, T-163-s1 + T-163-s2)
    docs/ARCHITECTURE.md                 (the prose slug block, T-163-s1)

— in three packages plus a governing doc, and no single card fence in
this repo's vocabulary reaches all four. That belongs beside the
DECLARING A COMPONENT gotcha, derived rather than transcribed if
somebody can see how; T-163's fence could not reach
`docs/CONVENTIONS.md` either.

DISCHARGED-NOT-DECLINED (2026-08-30, integration seat, the T-163 flip-set landing): the finding was real and the landing consumed it — performed in the merge window per the lanes-need-green-bases rule (a complement lane could not legally be cut from the red window this fix closes), with the executor's diagnosis on this card as the map and the select-board rewrite as the model. Every live half now states the ruled negative; every mechanism moved onto a synthetic registry carrying the shape. Evidence: the 2026-08-30-T-163 checkpoint record.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 18 — RETITLED AND REFENCED ONTO THE HALF THE DISCHARGE COULD NOT REACH

**THE FILED HALF IS VERIFIED DISCHARGED, at the sitting rather than on
the stamp's word.** Re-derived at `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`:
the fence suite's live body now reads *"no component carries two slugs —
the T-163 ruling stays ruled, and the shared-path mechanism holds
synthetically"* and asserts the doubly-claimed set is empty; the brief
spec carries the same treatment in two places, each with a synthetic
registry keeping the shape. Nothing about the two `lib/parser` bodies is
owed.

**AND THE HALF THIS CARD ITSELF WARNED ABOUT IS THE ONE LEFT STANDING.**
Its closing section said, in as many words, *"T-163's fence could not
reach docs/CONVENTIONS.md either"* — and that is exactly where the
ruling's last live copy is. Two things there, found by this sitting's
own sweep and derived rather than argued:

**One — a live false sentence.** The SHIPPED PARTITION bullet closes
with *"`non_code:` IS A DIFFERENT AXIS AND IS NEVER SUBSTITUTED: C-11 is
`non_code: true`, carries two slugs, and ships."* Derive the component's
own field with

    grep -h '^touch_slugs:' docs/architecture/components/C-11-design-tokens.md

and it answers the empty list. `non_code: true` still holds and so does
"ships"; the middle clause is false, and it is the clause the example
rests on. **What the repair has to decide, and it is not a find-and-
replace**: the bullet's first clause makes a registry SLUG the test for
shipped, and C-11 now claims none — so a tokens change enters a lane by
its own bare path and the example has to say what carries "ships" once
the slug is gone. That reasoning is this card's ask, not its answer;
whoever takes it derives it rather than adopting this paragraph.

**Two — the missing gotcha this card already wrote.** The DECLARING A
COMPONENT bullet names three live-registry fixtures. Moving a
`touch_slugs:` field is a different edit that moves a different set, and
nothing says so — T-163 moved exactly one field, found all three of that
bullet's fixtures green and needing nothing, and moved four other places
in three packages plus a governing doc. The list is in this card's own
body above, measured at that lane.

## Acceptance criteria

- THE stale clause SHALL be repaired against the component's own field
  DERIVED at the lane's ref, not against this card — the field is
  authoritative and this body is a stamp.
- THE repaired example SHALL still make the bullet's point, which is
  that `non_code:` is a different axis from shipped-ness. IF the ruling
  has cost the bullet its example THEN the lane SHALL say so and pick
  one that survives, rather than leaving a sentence that is true and
  illustrates nothing.
- THE bullet naming the fixtures a component DECLARATION moves SHALL
  also say that moving a `touch_slugs:` field moves a DIFFERENT set, and
  SHALL name that set by derivation where a derivation exists rather
  than transcribing the list this card measured — a transcribed set goes
  stale exactly the way the clause above did.
- THE lane SHALL re-derive, before writing, whether any other clause in
  the file still assumes a doubly-claimed component, and record the
  answer even when it is none — a negative sweep recorded is worth more
  than a sweep nobody can tell happened.
- THE lane SHALL NOT edit any component file, spec or suite. Those halves
  are discharged, stated above with what discharged them; this card is
  the governing document and nothing else.
- Verification: headless. The suites that read this document run green
  at the lane's ref, and the DOCS GATE's owed set is derived rather than
  assumed.

## Implementation notes

**BUILT 2026-08-30, lane `/Users/ujju/Projects/nputer-T-163-s3`, branch
`task/T-163-s3-false-clause`, cut from `bf274ed`. Fence:
`docs/CONVENTIONS.md`. Nothing else in the repository was written — the
component file, the specs and the suites were left exactly as the
discharge left them, as criterion five requires.**

### The clause the card sent me for, before and after

BEFORE (`docs/CONVENTIONS.md`, THE SHIPPED PARTITION's last line, at
`bf274ed`):

> **`non_code:` IS A DIFFERENT AXIS AND IS NEVER SUBSTITUTED**: C-11 is
> `non_code: true`, carries two slugs, and ships.

AFTER:

> **`non_code:` IS A DIFFERENT AXIS AND IS NEVER SUBSTITUTED**: C-11 is
> `non_code: true`, claims NO slug since T-163 (2026-08-30), and ships
> anyway. The example SURVIVES the ruling that falsified its middle
> clause and is stronger for it: it now carries two flags that both look
> like "not product" and is shipped under the clause above regardless,
> which is the whole point — neither field is the shipped-ness test.

Criterion two asked whether the ruling had cost the bullet its example.
**It had not — it improved it.** The bullet's point is that `non_code:`
is a different axis from shipped-ness; C-11 now carries TWO fields that
both read like "not product" (`non_code: true` and an empty
`touch_slugs:`) and ships regardless, so the example makes the point
twice over. No replacement example was needed and none was invented.

### A SECOND false clause in the same bullet, found by the sweep

The card named one. The sweep found the ruling had falsified a second
sentence four lines above it, by the same arithmetic:

BEFORE: *"…prints the set at your own ref, and the one EMPTY line in it
(C-01, `method/`) is why the next clause exists."*

DERIVED at `bf274ed`: `git grep -l '^touch_slugs: \[\]'
docs/architecture/components/` → **2 files**, `C-01-method.md` and
`C-11-design-tokens.md`. "The one EMPTY line" had been false since the
ruling landed. AFTER, the count is derived rather than written, the
derive command is published, and the sentence records its own former
wording so the next reader can see what went stale and why.

### What carries "ships" once the slug is gone — DERIVED, not asserted

This was the card's real ask. A third SHIPPED clause was added:

> **SHIPPED — a bare path into the `paths:` of a SLUGLESS component
> whose bytes REACH the built app**

The reasoning, from the bullet's own logic plus the registry and the
build, not from the card's paragraph:

1. The bullet's first clause makes a registry SLUG the test. C-11 claims
   none, so a tokens change enters a lane by its own bare PATH —
   `touches: [app/src/styles]` or `[app/src/assets]`, the spelling
   C-11's own body publishes and the fence expander already accepts.
2. Left alone, the NOT SHIPPED clause (*"every other bare path"*) would
   have swallowed that path and made a tokens change ceremony-free. That
   is the trap, and it was one sentence away from being live.
3. The bullet already owns the right test for exactly this situation:
   **REACHES**, which it uses for `method/` against `KIT_FILES`
   (`git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` → **14
   entries at `bf274ed`**, every one under `method/`, so that clause has
   nothing to say about `app/`). C-11 needed the same question asked of
   its own territory.
4. Asked and answered by derivation: `app/src/index.css` — C-05's file,
   slug `app-shell`, a SHIPPED slug — `@import`s `./styles/tokens.css`
   and `./styles/fonts.css`, and `app/src/styles/fonts.css` `url()`s
   `../assets/fonts/Geist-Variable.woff2` and
   `GeistMono-Variable.woff2`. **CONFIRMED AT THE BUILD, not only in the
   source**: `npm run build` from app/ in this lane emitted
   `dist/assets/index-D41xl3Gz.css` (45.18 kB),
   `dist/assets/Geist-Variable-Bj2R_7yk.woff2` (69.65 kB) and
   `dist/assets/GeistMono-Variable-Dispecij.woff2` (71.37 kB). C-11's
   bytes are in the shipped bundle.
5. The clause says explicitly that it does **NOT** generalise to every
   empty line: C-01 is slugless too, and its `method/**` ships only as
   far as its own clause says. Each slugless component's territory is
   asked the REACHES question separately. Without that sentence the new
   clause would have quietly made all of `method/` shipped.

`**NOT SHIPPED — every other bare path**` was reworded to
`**NOT SHIPPED — every bare path no SHIPPED clause above reaches**` so
the new clause is not swallowed by the one after it. The enumeration
(`docs/**`, `.github/`, `tools/e2e`, the kit's leftovers) is untouched.

### Criterion three — the DECLARING A COMPONENT bullet

Added, and DERIVED rather than transcribed exactly as the criterion
demands (this card's own measured four-place list is deliberately NOT
copied into the document — that is the transcription that goes stale):

    node tools/e2e/scripts/docs-gate.mjs docs/architecture/components/C-NN-*.md

Run at `bf274ed` it names **4 suites** — `cargo test` from
app/src-tauri/, `npm test` from app/, `npm test` from tools/e2e/,
`npx vitest run` from lib/parser/ — against the **2** the bullet's three
named fixtures live in. The bullet now says the three can all be GREEN
while other bodies in those same suites red (what T-163 measured moving
one field), says the gate answers at SUITE granularity so each named
suite is run in full rather than the files it happens to print, and
names the one consumer no suite covers: docs/ARCHITECTURE.md's prose
slug BLOCK, which `brief.mjs --task` compares against the fields and
reports in one line.

### Criterion four — the negative sweep, recorded

Swept `docs/CONVENTIONS.md` at `0f41aef` for every clause that could
still assume a doubly-claimed component:

    two slugs · doubly · double-claim · double claim · both slugs
    more than one slug · shares its paths · C-11 · app-shell · app-board
    app/src/styles · app/src/assets · touch_slugs

**ANSWER: NONE REMAIN.** The two repaired above were the only ones. The
surviving `[app-shell, app-board]` occurrence is the ruling's BEFORE
state, stamped as history inside the new clause; the surviving bare
`app-shell` occurrence is C-05's live slug, derived and true at this
ref. `- UI work adds tokens to app/src/styles/tokens.css…` mentions the
territory but makes no slug claim and needed nothing.

### Gates, every exit unpiped

- `npm run lint:docs` from tools/e2e/ — **exit 0**. Budget line:
  *"governing-document budgets hold — 4 gated, 0 awaiting their
  compaction landing"*. docs/CONVENTIONS.md **137,350 → 140,380 bytes**
  (`wc -c`), +3,030 against the 164,393-byte warn line — **24,013 bytes
  of headroom left**.
- DOCS GATE, derived not assumed, and derived TWICE because the owed
  set GREW when the cards landed. On the fence alone
  (`docs-gate.mjs docs/CONVENTIONS.md`) it FIRES for **2** suites. On
  the whole lane diff (`docs-gate.mjs $(git diff --name-only
  bf274ed..HEAD)`, three paths) it FIRES for **4**, because a new flat
  `docs/tasks/T-*.md` is a live-registry input to the parser and the two
  app dogfood fixtures. **ALL FOUR WERE RUN**; had the gate been run
  once at the start, two of them would have been missed.
- `cargo test` from app/src-tauri/ — **exit 0**, 548 passed / 0 failed /
  4 ignored across 18 result lines, on a `target/` built from nothing in
  this lane. kit.rs's CONVENTIONS assertion is on the *"formats are
  version-bumped"* line, which this diff does not touch.
- `npx vitest run` from lib/parser/ — **exit 0**, 15 files, **315
  passed**.
- `npm test` from app/ — **exit 0**, 47 files, **1015 passed**.
- `NPUTER_E2E_PORT=41633 npm test` from tools/e2e/ (port derived from
  the lane's card number; `lsof -nP -iTCP:41633 -sTCP:LISTEN` = **0
  rows** immediately before each bind) — run TWICE, before and after the
  cards landed: **1 failed / 319 passed, exit 1** both times, the same
  body. The cards moved nothing.
  **THE ONE RED IS PRE-EXISTING AT THE BASE AND IS NOT THIS DIFF'S** —
  see below. **Every reader of this document is GREEN**: brief,
  dispatch-order, docs-input-gate, lane-fence, range-rule,
  workflow-parity, shell-frame, window-contract.
- GRAPH REGEN, BOOT GATE and METHOD EVAL GATE do not fire: the diff is
  three files under docs/ and nothing else.

### The one red, and the proof it is not mine

`tests/session-economics.spec.ts:73` fails at line 113 because its
POSITIVE CONTROL spawns `dispatch-brief.mjs --task T-112` and asserts
exit 0, while the brief now refuses: *"fences are not disjoint: T-169
app-board against T-112 app-board"*. T-169 (`touches: [lib-parser,
app-board]`) was stamped `building` at **`bf274ed`** — the commit this
lane was cut from — and T-112 is `touches: [app-dispatch, app-board]`.

Positive control run both ways in this lane:
`git checkout bf274ed -- docs/CONVENTIONS.md` then `brief.mjs --task
T-112` → **exit 1**; restore this lane's own file, re-run → **exit 1**.
A docs/CONVENTIONS.md edit cannot move fence disjointness, which is
computed from cards' `touches:` and the component registry.

**tools/e2e IS OUTSIDE THIS FENCE, SO IT WAS RECORDED RATHER THAN
REACHED FOR** — filed as `T-163-s4`, which carries the full measurement,
the reason the control exists and must not simply be deleted, and
criteria for a board-independent replacement.

### What this lane did NOT do

- No component file, spec or suite was touched (criterion five).
- This card's measured four-place list was not transcribed into
  docs/CONVENTIONS.md; only the derivation that reproduces it was.
- No reader pin had to move, so the `tools/e2e` STOP-and-record rule was
  not triggered by the edit itself — checked BEFORE writing, by grepping
  tools/e2e for `SHIPPED PARTITION`, `non_code`, `two slugs` and
  `DECLARING A COMPONENT`: **no spec pins any sentence in either
  repaired bullet.** The only tools/e2e matter that arose is
  `T-163-s4`, a pre-existing red rather than a pin this diff moved.

## Verdicts
