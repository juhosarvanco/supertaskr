---
id: T-219-s3
title: "T-219 made `carveOutFor`'s own-card arm unreachable for every possible manifest — the exact defect its own header was ordered first to avoid, and the ordering argument is now false"
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: executor claude-opus-5@subagent @T-219
blocked_by: []
touches: [.claude/hooks/lane-fence.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**Guard-class, and found by the card that caused it.** `T-219` made
`expandFence` refuse any token whose domain CONTAINS `docs/tasks`. That
is correct and is not in question here. Its side effect is that
`carveOutFor`'s FIRST arm — the one answering for a lane's own card file
— can no longer be selected by any write, which is precisely the
condition that arm was ordered first to avoid.

## The header's own argument, now false

`carveOutFor` in `.claude/hooks/lane-fence.mjs` carries it:

> THE OWN-FILE TEST COMES FIRST THOUGH `docs/tasks` WOULD CATCH IT
> ANYWAY … Every card lives under the unfenceable directory, so ordered
> the other way this branch would answer for nothing that reaches it —
> **an arm no write can select is an arm no mutation can kill**, and the
> ruling names it as a criterion in its own right.

The ordering is still right. What moved is underneath it: **the arm is
now unreachable in BOTH orders.**

## Why, in two steps that compose

The lane-less seat consults `carveOutFor` only for a path some live
lane's manifest RESERVES (`manifest.paths`). So the own-card arm needs a
manifest whose `paths` contains a card file.

1. **A card file enters `paths` only through a domain containing
   `docs/tasks`** — and `T-219` refuses every such token.
2. **`expandFence` moves a card's OWN file out of `paths` into
   `excluded`** regardless, so even a card naming its own file by name
   does not reserve it.

`carveOutFor`'s first arm reads `manifest.excluded`, and the seat never
reaches `carveOutFor` for those paths. The two facts compose to: **no
manifest can select that arm.** Inside the LANE the same write is
answered by `always-writable` before any carve-out is consulted, so the
arm is dead there too.

## Measured at `T-219`'s lane tip

Through the real hook against the real fixture, with a lane fencing
`[tools/e2e, <its own card>, <another card>, docs/STATE.md,
docs/checkpoints, docs/ROADMAP.md]`:

    the lane's OWN card, asked from the seat   -> allow, code `not-a-lane`
    ANOTHER card under docs/tasks, same seat   -> allow, code `protocol-carve-out`
                                                  ("no card may fence it")

The second arm survives **only because a lane may still fence another
card BY NAME**, which is the spelling rule 5 prescribes in the same
breath as the refusal. The first has no such escape: a lane's own file
is carved out of its own fence by construction.

`tools/e2e/tests/lane-fence.spec.ts`'s *the carve-outs each free a
DIFFERENT write* now asserts `not-a-lane` for that write, with the
reason on the assertion, **so this card landing will red that body by
name** — which is the intended tripwire and not a conflict.

## What to build

- DECIDE, and record the decision rather than only the code: either the
  arm is REMOVED (the hook's own rule — *an allow no mutation can kill
  is an allow no test can prove, so it is gone rather than left inert* —
  which is what it did to the `../` allow), or it is made REACHABLE by
  consulting `carveOutFor` for a path no lane reserves.
- WHICHEVER IS CHOSEN, the header's ordering paragraph SHALL be rewritten:
  it argues from a premise (`docs/tasks` would catch it anyway, so order
  matters) that T-219 retired.
- IF the arm is removed THEN `tools/e2e/tests/lane-fence.spec.ts`'s
  `not-a-lane` assertion becomes the permanent pin and its comment
  pointing here SHALL be updated; IF it is made reachable THEN that
  assertion SHALL move back to `protocol-carve-out` and a body SHALL
  prove the arm is selected by a write that exists.
- A POSITIVE CONTROL SHALL show the chosen arrangement failing under a
  mutant, since a dead arm and a working one are indistinguishable from
  a green suite — which is how this survived to be found by a card about
  something else.
- Verification: headless.

## Read beside

`T-219` (the refusal that caused this, and where it was measured),
`T-154-s2` (the seat-side carve-outs and @human's ruling of 2026-08-30),
`method/lane-protocol.md` rule 5.

## TRIAGE, 2026-09-02 — promoted and dispatched, priority 2, at T-219's merge (64fed70)

The architect seat. Guard-class, filed by the lane that caused it: the
own-card carve-out arm of `carveOutFor` can no longer be selected by any
manifest, so the header's "an arm no write can select is an arm no
mutation can kill" now describes its own first arm. Blocker cleared —
T-219 is done. Criteria: the hook SHALL either remove the unreachable
arm with its header rewritten to say why, or make it reachable by a
manifest shape the parser can still produce, and in either case a body
SHALL red under a mutant of whichever arm remains; the write that used
to select it (a lane writing its own card) SHALL still be allowed, with
the reason on the assertion.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

**THE ARM IS REMOVED.** Both branches of the DECIDE criterion were
measured before choosing, and only one of them exists.

### Which arm, and why — the measurement that decided it

The criterion offered *remove* or *make reachable by a manifest shape
the parser can still produce*. **There is no such shape**, and this was
measured rather than argued: `measure-manifests-T-219-s3.mjs` (scratch)
drove the REAL `expandFence` from `lib/parser/dist` at `a7cc65b8064d`
over thirteen `touches:` spellings and asked, for each resulting
manifest, the REAL `carveOutFor` at exactly the seat's own call site
(`paths.find((d) => within(rel, d))`, `laneLessVerdict`).

| `touches:` | `paths` | `excluded` | the own card, from the seat |
|---|---|---|---|
| `[<own card>]` | `[]` | `[<own card>]` | not reserved → `not-a-lane` |
| `[tools/e2e, <own card>]` | `[tools/e2e]` | `[<own card>]` | not reserved → `not-a-lane` |
| `[<other card>]` | `[<other card>]` | `[]` | not reserved → `not-a-lane` |
| `[docs/tasks]` | `[]` | `[]` | token REJECTED |
| `[docs/tasks/]` | `[]` | `[]` | token REJECTED |
| `[docs/tasks/**]` | `[]` | `[]` | token REJECTED |
| `[docs]` | `[]` | `[]` | token REJECTED |
| `[docs/]` | `[]` | `[]` | token REJECTED |
| `[.]` | `["."]` | `[]` | not reserved → `not-a-lane` |
| `[./<own card>]` | `[]` | `[<own card>]` | not reserved → `not-a-lane` |
| `[docs//tasks/<own card>]` | `[]` | `[<own card>]` | not reserved → `not-a-lane` |
| `[.claude/hooks/lane-fence.mjs]` (this lane) | that path | `[]` | not reserved → `not-a-lane` |
| the six-token fixture the spec arms | `[docs/ROADMAP.md, docs/STATE.md, docs/checkpoints, <other card>, tools/e2e]` | `[<own card>]` | not reserved → `not-a-lane` |

**ARM 1 SELECTED BY ANY CANDIDATE: false.** Which arm each write DOES
select, measured on the fixture shape: `<other card>` → **arm 2**
(`alwaysWritable`, `docs/tasks`); `docs/STATE.md` and
`docs/checkpoints/x.md` → **arm 3** (`INTEGRATION_SEAT_PATHS`);
`tools/e2e/x.ts` → **no carve-out**, `held-by-a-live-lane`.

Two further narrowings make the arm dead rather than merely unused.
`tools/e2e/scripts/lane-fence.mjs` REFUSES to write a manifest for a
fence carrying an `unusable` token (so the five REJECTED rows never
become manifests at all) and refuses one expanding to no path (so
`touches: [<own card>]` alone is refused too). And the five manifests
live on `Mac.lan` at 2026-09-02T04:40Z carried `excluded: []` outright.

**Reachability was therefore not available from inside this fence, and
would not have been correct outside it.** The only route left is to
consult `carveOutFor` for a path NO lane reserves, and that answer is
false in its own words: `protocol-carve-out` says *"inside `<lane>`'s
fence (`<domain>`) and written anyway"* about a path nothing reserves
and for which there is no domain to name. It would also convert every
`not-a-lane` write to `docs/STATE.md`, `docs/checkpoints` and
`docs/tasks` into a carve-out the seat never needed. The bodies that
would prove selection live in `tools/e2e/tests/lane-fence.spec.ts`,
which is held live by `T-215-s1` — so no fast-path-A widening was
available either.

**The property survives the arm**, which is what makes removal safe
rather than tidy: `expandFence` subtracts a card's own file from `paths`
at dispatch, in the one implementation that owns the rule, so the write
meets no reservation and needs no carve-out. The arm was a second copy
of a subtraction already performed (T-057).

### The header

The ordering paragraph is replaced by a record of why its PREMISE
retired, with the three composing facts, the measurement above, the
alternative and why it was refused, and the property that survives. Two
further header claims were corrected in the same pass because the
declared-limits header is part of the guard: the `TWO SEATS` paragraph
now says `readManifest`'s `excluded` requirement is a SHAPE check and
nothing else, and `INTEGRATION_SEAT_PATHS`' own comment no longer says
two of @human's three carve-outs "are already IN THE MANIFEST" as though
the hook applied both. The refusal message no longer enumerates
`excluded` among "carve-outs checked and none matched"; it states
instead that the lane's own card is outside its fence by construction.

### The write that used to select it — MEASURED, both seats

- **From the lane-less seat**: `allow`, code **`not-a-lane`** — reason
  *"…, and no live lane's manifest reserves …"*. Pinned by
  `lane-fence.spec.ts`'s *the carve-outs each free a DIFFERENT write*,
  with the reason on the assertion (*"the own-card carve-out arm became
  reachable again — see T-219-s3"*). That assertion is now the permanent
  pin and did NOT red, because the arm was removed rather than made
  reachable.
- **From inside the lane**: `allow`, code **`always-writable`** — read
  through `decide` against this lane's own manifest and its own card:
  *"docs/tasks/T-219-s3-…md is under docs/tasks, which no card may fence
  and every card writes to"*. The wired runner exits 0 and prints
  nothing, as a judged allow must.

Neither answer passes through a carve-out arm. The card's own
prediction that this lane's landing *"will red that body by name"* was
written for the OTHER branch of the decision and does not hold for this
one.

### Drills — four, all in a detached worktree at `f6aca05`, all restored

Cut with `git worktree add --detach <scratch>/drill-T-219-s3 f6aca05`,
provisioned by copying this lane's installed `lib/parser/{node_modules,dist}`,
`tools/e2e/node_modules`, `app/{node_modules,dist}`, port `15319`
(this lane's own runs use `15219`; the number is derived per run, never
defaulted). **Baseline: 54 passed, exit 0.** Every mutation was read
back with `git diff` before its run, mutated ONE side only, and restored
with `git restore --source=f6aca05 --staged --worktree`.

| # | mutation (code side only) | result | kill set |
|---|---|---|---|
| 1 | `carveOutFor`'s `alwaysWritable` loop → `for (const domain of [])` | **1 failed / 53 passed** | *the carve-outs each free a DIFFERENT write* |
| 2 | `carveOutFor`'s `INTEGRATION_SEAT_PATHS` loop → `for (const domain of [])` | **1 failed / 53 passed** | the same body |
| 3 | the removed arm RE-ADDED, byte-identical to `a7cc65b8064d`'s | **54 passed, 0 failed** | EMPTY — see below |
| 4 | `expandFence`'s own-file subtraction disabled (`if (false && …)`), `lib/parser` rebuilt | **3 failed / 51 passed** | *the carve-outs each free a DIFFERENT write*; *`excluded` PARTICIPATES…*; *a card fencing a domain that CONTAINS `docs/tasks`…* |

**Restoration proof — `git show f6aca05:<path> | shasum -a 256` against
the working file, after every mutant:**

- `.claude/hooks/lane-fence.mjs`
  `964233e19244d1e8309a67eb8b4c7a461dce5a25fc5c2d9a0b6234dede1a0311`
  (committed and worktree equal after mutants 1, 2 and 3)
- `lib/parser/src/fence.ts`
  `f5a5e065a6626665b5aaa38845b41571872a948366011f8a69abadf7c4e2616b`
  (after mutant 4)
- `git status --porcelain` in the drill: EMPTY. Worktree removed with
  `git worktree remove --force`; this lane's own files re-hashed against
  `HEAD` afterwards and equal.

**MUTANT 3 IS THE FINDING, NOT A FAILURE.** Its kill set is empty ON
PURPOSE and that is the evidence the ruling asks for: with the arm put
back verbatim, the whole of `lane-fence.spec.ts` still passes 54-for-54.
The suite cannot distinguish the arm's presence from its absence in
EITHER direction — which is the sentence the arm's own header wrote
about itself. It is why *left inert* was refused, and it is the gap
routed to `T-219-s5`: a body that would red on a re-added arm has to
live in the spec, which this fence does not reach. **Mutants 1 and 2
are the positive controls the criterion asks for**: each kills exactly
the body that pins the arm it broke, and 53 of 54 bodies stay green, so
the mutation is contained rather than a collapse. **Mutant 4 is the
coupling control**: it shows the surviving `not-a-lane` allow is not
vacuous and names what it rests on — `expandFence`'s subtraction, itself
pinned by three bodies.

### Commands, in order, with exits

| # | command | exit |
|---|---|---|
| 1 | `git rev-parse HEAD` (lane) → `a7cc65b8064deb9420a6190540f64ae884357d2a` | 0 |
| 2 | `npm ci` from `app/` | 0 |
| 3 | `npm run build` from `app/` | 0 |
| 4 | `npm ci` from `tools/e2e/` | 0 |
| 5 | `node measure-manifests-T-219-s3.mjs` | 0 |
| 6 | `NPUTER_E2E_PORT=15219 npx playwright test tests/lane-fence.spec.ts` (lane) — 54 passed | 0 |
| 7 | `git commit` — code change, `f6aca05d2cc4b2cc8661da64090b7376d4d3ec2e` | 0 |
| 8 | `git worktree add --detach <scratch>/drill-T-219-s3 f6aca05` | 0 |
| 9 | drill baseline, `NPUTER_E2E_PORT=15319 npx playwright test tests/lane-fence.spec.ts` — 54 passed | 0 |
| 10 | mutant 1 + run — 1 failed / 53 passed | 1 |
| 11 | `git restore --source=f6aca05 --staged --worktree` + `shasum -a 256` | 0 |
| 12 | mutant 2 + run — 1 failed / 53 passed | 1 |
| 13 | restore + `shasum -a 256` | 0 |
| 14 | mutant 3 (resurrection) + run — 54 passed | 0 |
| 15 | restore + `shasum -a 256` | 0 |
| 16 | mutant 4 (`fence.ts`) + `npm run build` in `lib/parser` + run — 3 failed / 51 passed | 1 |
| 17 | restore `fence.ts` + `shasum -a 256` | 0 |
| 18 | `git worktree remove --force <scratch>/drill-T-219-s3` | 0 |
| 19 | `decide` probe — this lane writing its OWN card → `allow`/`always-writable` | 0 |
| 20 | `node tools/e2e/scripts/gate-run.mjs parser` — **363 bodies, GREEN** | 0 |
| 21 | `node tools/e2e/scripts/gate-run.mjs app` — **1131 bodies, GREEN** | 0 |
| 22 | `node tools/e2e/scripts/gate-run.mjs rust` — **639 bodies, 18 targets, GREEN** | 0 |
| 23 | `node tools/e2e/scripts/gate-run.mjs e2e` — **575 bodies, 573 passed / 2 failed, RED** | 1 |
| 24 | base attribution: detached worktree at `a7cc65b`, `npx playwright test tests/session-economics.spec.ts` — 2 failed / 8 passed | 1 |
| 25 | `git worktree remove --force <scratch>/base-drill-T-219-s3` | 0 |
| 26 | `git merge-tree --write-tree main HEAD`, `$?` read first | 0 |
| 27 | `cargo run -q -p nputer-index -- index --check --root ../..` — **CURRENT** | 0 |
| 28 | `git merge-tree --write-tree main HEAD` at the tip — 3 paths | 0 |
| 29 | `NPUTER_E2E_PORT=15219 npx playwright test tests/lane-fence.spec.ts` at the tip — 54 passed | 0 |

**THE TREE THE BATTERY RAN ON, SAID PLAINLY.** `gate-run` stamps its
`ref=` from `HEAD`, which was `f6aca05` at rows 20–23; the TREE it ran
was the working tree that became this lane's tip — the hook's two
comment corrections, this card's `verifying` stamp and the routed
`T-219-s5` card all present. The only thing added afterwards is this
notes section itself, which is the self-reference the report format
names and cannot escape: a lane's last commit is its notes, so the
battery is run on the tree MINUS the paragraph recording its result.
Row 29 re-runs the fenced spec against the committed tip.

### The e2e red, ATTRIBUTED BY NAME at the base

`gate-run e2e` is RED at 573/575 and **neither failure is this lane's**:

- *the recommended seat is a function of the CARD, and an environment
  full of model dials does not move it* (`session-economics.spec.ts:179`)
- *the advisory line is NOT a contract row — it is printed outside the
  row set and derives none of it* (`session-economics.spec.ts:365`)

Both fail with the SAME assembler finding: *"T-018-s6 holds a worktree
on `refs/heads/task/T-018-s6-startup-pull-overtake` and no live card
declares that id"*, and the same for `T-215-s1`. Those two lanes were
cut AFTER this lane's base, so their cards do not exist in this
checkout's board — the machine-scoped worktree list joined to a
checkout-scoped board, which `lane-protocol.md` rule 4 names in as many
words and `docs/STATE.md` carries as `guard-surface-behind`.

**Measured, not asserted**: a detached worktree at the BASE
`a7cc65b8064deb9420a6190540f64ae884357d2a` — this lane's diff nowhere in
it — runs the same file to **2 failed / 8 passed**, the same two bodies
by name with the same reason. And neither id has a card at the base or
at the tip (`git ls-tree a7cc65b docs/tasks/` and `ls docs/tasks/` both
empty for `T-018-s6` and `T-215-s1`). This lane's diff touches
`.claude/hooks/lane-fence.mjs` and its own card only.

### Standing gates, derived on the MERGE FORECAST

`git merge-tree --write-tree main HEAD` exit **0** (read from `$?`
before the tree was used), tree `6fd99f171fe3c8f1f656fcb80f7aa09953c161da`.
`git diff --name-only main <tree>` — **3 paths**:
`.claude/hooks/lane-fence.mjs`, this card, and the routed
`T-219-s5` card. **This is the set the gates below are derived on**,
and it does not move when the notes commit lands, which is the whole
reason the forecast rather than a ref is the honest vantage here
(`method/roles/executor.md`, *A GATE DERIVATION IS NOT A FIGURE*).

- **GRAPH REGEN** — trigger is `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside
  `docs/`. The forecast carries `.claude/hooks/lane-fence.mjs`, a `.mjs`
  file, which the suffix list does not name — but the gate was ASKED
  rather than predicted: `index --check` answers **CURRENT** (200 files,
  2502 symbols, 2390 edges, 1168614 bytes, 54.5% of budget). `.claude/`
  is outside the walk. **NOT OWED**, and asked anyway.
- **BOOT GATE** — trigger `app/src-tauri/**`, `app/src/**` or either
  manifest. The forecast touches none. **NOT OWED** (derived, not
  skipped).
- **DOCS GATE** — trigger a path under `docs/` a code suite READS. The
  forecast carries this card and the routed `T-219-s5` card, both under
  `docs/tasks/`, which the board parser reads. **OWED on the card
  paths** — and the four-suite battery above is the run that covers it;
  the integrator re-derives at the merge.
- **METHOD EVAL GATE** — trigger `method/**`. The forecast touches none.
  **NOT OWED.**
- `AUDIT GATE` and `THE BLESSED GATE` declare no merge-diff trigger, so
  they are not in this set.

### Routed, not built — `T-219-s5`

`docs/tasks/T-219-s5-two-documents-still-describe-the-own-card-carve-out-arm-T-219-s3-removed.md`,
`status: suggested`, `suggested_by: executor claude-opus-5@subagent
@T-219-s3`, `touches: [tools/e2e/tests/lane-fence.spec.ts,
docs/CONVENTIONS.md]`. Three prose sites still describe the arm as one
the hook applies, plus the body that would red on a re-added arm. **Both
files are reserved by ONE live lane, `T-215-s1`** (read
2026-09-02T04:57Z on `Mac.lan` from `git worktree list --porcelain`
joined to that lane's manifest), so no fast-path-A widening existed and
the cheaper route may be to hand the three edits to `T-215-s1` — the
dispatching seat's call.

**Sweep for the class** *(a document describing a carve-out the hook no
longer applies)*: `grep -rn excluded` across `docs/CONVENTIONS.md`,
`docs/ARCHITECTURE.md`, `method/`, `.claude/hooks/*.mjs`,
`tools/e2e/scripts/lane-fence.mjs` and `tools/e2e/tests/lane-fence.spec.ts`.
Five sites in `tools/e2e/scripts/lane-fence.mjs` describe `excluded` as
the manifest FIELD and as `compareFences`' subtraction — all still true
and left alone. Two in-fence sites were fixed here. Three out-of-fence
sites are the routed card. No other site claims the hook applies it.

### Where the brief was wrong

1. **Row 4's base commit** reads `6cc38909ab24c9c5c06b4e23a0fa11424662a038`.
   This lane was cut at **`a7cc65b8064deb9420a6190540f64ae884357d2a`** —
   the dispatch stamp — which `git rev-parse HEAD` confirms. The
   dispatching seat flagged this as T-233's known defect; the worktree's
   HEAD is the truth and every figure here is derived at it.
2. **Row 5's lane list is stale by two lanes.** It names `T-018-s5` and
   `T-215`; the live list at 2026-09-02T04:57Z on `Mac.lan` names
   **`T-018-s6`** (`app/src/lib/docs-model.ts`,
   `app/src/lib/watcher-store.ts`, `app/test/docs-model.test.ts`,
   `app/test/watcher-store.test.ts`) and **`T-215-s1`**
   (`docs/CONVENTIONS.md`, `tools/e2e/tests/lane-fence.spec.ts`). This
   lane stays disjoint from all four, but the second correction changes
   the routing answer below.
3. **The dispatch message said `tools/e2e/tests/lane-fence.spec.ts`
   "is free now but not yours".** It is NOT free: `T-215-s1`'s manifest
   reserves it. The instruction to route rather than breach was right;
   the reason given for it was already out of date.
4. **This card's own body** says *"this card landing will red that body
   by name — which is the intended tripwire and not a conflict."* It did
   not, and could not: that sentence assumes the REACHABLE branch of the
   decision. Under removal the `not-a-lane` assertion is correct and
   stays green, which the card's own *What to build* section
   independently prescribes.
5. **The advisory line's third signal** reads *"the card carries no
   acceptance criteria, so there is nothing to build against"*. The card
   carries a `What to build` section of five criteria plus a TRIAGE
   paragraph restating them; the assembler's keyword match missed the
   heading spelling. Nothing was built against a guess.
