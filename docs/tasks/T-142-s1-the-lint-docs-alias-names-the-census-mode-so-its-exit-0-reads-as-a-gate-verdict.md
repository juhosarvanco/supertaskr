---
id: T-142-s1
title: "The `lint:docs` alias runs the DOCS GATE's CENSUS mode, which names no owed suite and exits 0 — so the one command whose name sounds like the general question is the one that cannot answer it"
feature: F-06
milestone: 4
priority: 3
size: S
status: done
suggested_by: executor claude-opus-5 @T-142
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
builder: claude-opus-5
built_by: claude-opus-5 @T-142-s1
verifier:
review: self-verified
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

### The poison drill — two drills, four mutants, and one SURVIVOR that changed the body

Detached scratch worktree `/private/tmp/nd-T-142-s1`, cut at a SHORT
root with the stem **DERIVED from the card id** and spent on the
worktree, the driver and every log. No `CARGO_TARGET_DIR` hazard applies
— no Rust body is drilled — and `node_modules`, `lib/parser/dist` and
`app/dist` were SYMLINKED in rather than installed. The driver refuses
any path outside **this** drill, recognising it by that stem rather than
by the shared scratch prefix (T-092: a prefix guard answers *"is this A
drill"*, never *"is this MY drill"*).

Every mutation is **one side only and always the PRODUCER**
(`docs-gate.mjs`), never an assertion, so a symmetric mutation cannot
leave the test agreeing with itself. Every anchor was required to match
**exactly once**, and every mutated TEXT was read back with
`git diff --unified=0` **before** its suite ran.

**Drill 1, at `cb0d77d`.** Baseline: full lane **1 failed / 366
passed**, spec alone **43 passed**.

| # | mutant (producer only) | scope | tally | reds |
|---|---|---|---|---|
| M1 | the census verdict RELOCATED back above the whole-tree sentences — wording untouched | FULL | 2F/365P | inherited + **mine only**, at the POSITION assertion |
| M2 | the verdict stops saying it computed NO owed-suite verdict | spec | 1F/42P | **mine only**, at the WORDING assertion |
| M3 | the FIRES branch stops naming the owed suites | spec | **43P — SURVIVED** | **none** |
| M4 | a clean census returns FOUND rather than CLEAN | spec | 2F/41P | the PRE-EXISTING census body **+ mine** |

**M3 SURVIVING IS THE MOST USEFUL THING THIS LANE MEASURED, AND IT WAS
POISON SHAPE EIGHT IN THE BODY WRITTEN TO BE THIS CARD'S EVIDENCE.**
The control arm asserted `toContain("npx vitest run from lib/parser/")`
over the WHOLE output. The gate prints its derived-reader table at the
top of every run, and that table carries `[npx vitest run from
lib/parser/]` **five times** and names `lib/parser/test/smoke.test.ts`
**once** — so the mutant deleted the assertion's actual subject and the
search found somebody else's copy. Green with its subject removed.

Repaired with shape EIGHT's own remedy at `48c925d`: anchor on
`docs-gate: FIRES`, **assert the anchor occurs exactly once** so the
haystack cannot silently widen back, and run both needles against the
slice from the anchor on.

**Drill 2, at `48c925d`, the whole set re-run against the repair.**
Baseline: full lane **1 failed / 366 passed**, spec alone **43 passed**.

| # | mutant | scope | tally | reds |
|---|---|---|---|---|
| M1 | position only | FULL | 2F/365P | inherited + **mine only** — line 1071, *"the verdict comes AFTER them"*, offset 4293 against 4745 |
| M2 | wording only | spec | 1F/42P | **mine only** — line 1065, *"the census prints its own verdict"* |
| M3 | FIRES stops naming the owed suites | spec | **1F/42P — KILLED** | **mine only** — line 1112, and the received string is the SLICE, which is the repair proving itself |
| M4 | clean census returns FOUND | spec | 2F/41P | the pre-existing census body at `:769` (*expected 0, received 1*) **+ mine** |

**SHAPE SIX ASKED AND ANSWERED, THE WAY THE CATALOGUE SAYS TO ASK IT.**
M1 is a mutation of the code under test, run against the WHOLE suite,
and the failing-body count attributable to it is **ONE** — 2 failures
of which one is the inherited red present in the baseline. So this body
kills a mutant no other body kills, mechanically rather than by
assertion.

**M1 AND M2 RED THE SAME BODY AT DIFFERENT ASSERTIONS**, which is what
shows they are two rules and not one: M1 moves only POSITION and M2
moves only WORDING, and neither touches what the other checks. M4 is the
control in the other direction — it reds the body BESIDE mine, so this
lane did not hollow out the census assertions it sits next to.

**Restoration proved after every mutant and again at the end of both
drills**: `git restore --source=<commit> --staged --worktree` naming
BOTH sides, then **sha256 of the producer against the drill's own
commit — MATCH every time** (`625b4742…`), with `git status` showing
**0 tracked changes**; the untracked dependency symlinks are excluded by
`--untracked-files=no` and are not evidence either way. Clean re-run at
the end: **43 passed, exit 0**.

### Gates, derived from the RANGE RULE's own pre-merge pair

`main` MOVED during this lane: `57c1b39` at dispatch, **`726d807`** now
(one commit, `T-197`). Derived against that tip:
`TREE=$(git merge-tree --write-tree 726d807 HEAD)` exits **0** — a tree,
not a conflict — and `git diff --name-only 726d807 "$TREE"` names
**4 paths** (5 with these notes).

- **GRAPH REGEN — TRIGGER MATCHES, REGEN NOT OWED.** One `.ts` outside
  docs/ (`docs-input-gate.spec.ts`) matches; `.mjs` is not in the suffix
  list. **ASKED THE GATE rather than predicting**, as the bullet
  requires: `cargo run -p nputer-index -- index --check --root ../..`
  exits **0**, *"graph.json is CURRENT"* at 1,148,046 bytes / 199 files
  / 2,446 symbols / 2,363 edges. `.nputerignore` excludes `tools/`, so
  this is T-054's and T-058's worked case again. **No regen performed.**
- **BOOT GATE — NOT OWED**, 0 of 4 paths: no `app/src-tauri/**`, no
  `app/src/**`, neither manifest. This fence cannot produce them.
- **DOCS GATE — FIRES, exit 1**, on 2 paths under docs/. It names all
  four suites: `cargo test from app/src-tauri/`, `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`. All
  four run below.
- **METHOD EVAL GATE — NOT OWED**, 0 of 4 paths under `method/`.
- **AUDIT GATE** declares no merge-diff trigger, so it is not one of
  these.

### Suites — every exit read from `$?` UNPIPED, in the order run

At `cb0d77d`, and the e2e figure re-measured twice more at `48c925d`:

| suite | result | exit |
|---|---|---|
| `npx vitest run` from lib/parser/ | **344 / 344** | **0** |
| `npm test` from app/ | **1094 / 1094** | **0** |
| `cargo test --no-fail-fast` from app/src-tauri/ | **601 passed / 0 failed / 4 ignored**, summed programmatically over **18** `test result:` lines | **0** |
| `npm test` from tools/e2e/ | **366 passed / 1 failed** | **1** |
| `npm run typecheck` from tools/e2e/ | — | **0** |
| `npm run lint:tokens -- --selftest` | — | **0** |
| `npm run lint:tokens` | clean (TOKEN 162 files; CONTROL 1037 tracked text files) | **0** |
| `npm run lint:docs` — the CI step, and this card's subject | ends on its own verdict | **0** |
| `npm run capabilities:check` | **STALE** — see Routed | **1** |

**THE ONE E2E FAILURE IS INHERITED, AND IT IS PROVEN RATHER THAN
ARGUED.** It is `dispatch-order.spec.ts:200`, and it reproduces on a
**pristine tree at `57c1b39`** with this lane's edits stashed and
`git status --porcelain` returning **0 lines**: `brief.mjs --dispatch`
returns exactly **65,536** bytes through a pipe against **69,302** to a
file, and lacks `critical path:`. It is **not `maxBuffer`** — raising it
to 64 MiB changes nothing. **`T-197` owns it**, filed on main at
`726d807` while this lane built. The evidence, including the fact that
this body ALREADY reds on it (T-197's own criterion 3, answered), is on
`T-142`'s card as instance 6, because T-197's card does not exist at
this lane's base.

### A FIX NAMES ITS CLASS AND ITS SWEEP

**Class:** *a closed list, written in prose, of a set that grows* —
here, "what the whole-tree half checks". **Sweep run:**
`git grep -n "root-anchor account"` and
`git grep -n "unlinkable-reader tripwire"` from the repository root.
**Result — three instances, not one:**

| # | site | disposition |
|---|---|---|
| 1 | `docs/CONVENTIONS.md`, the `npm run lint:docs` paragraph | **FIXED** (in fence) |
| 2 | `tools/e2e/scripts/docs-gate.mjs:46`, the header | **FIXED** (in fence) |
| 3 | `.github/workflows/ci.yml:197`, the step's comment | **NOT FIXED — OUT OF FENCE**, routed below |

The sweep is recorded with its command rather than its count, and it was
run once against a planted needle before its answer was written down.

### Routed, not built — each names the fence it needs

1. **`docs/CAPABILITIES.md` IS STALE AND THIS LANE CANNOT FIX IT.**
   `npm run capabilities:check` exits **1**: committed **29,053** bytes
   against a fresh generation of **29,121**. The delta is **68 bytes**,
   which is **exactly** the rendered line
   `- THE CENSUS SAYS WHICH QUESTION ITS EXIT ANSWERS, and says it LAST`
   plus its newline — so the regeneration adds **one line and nothing
   else**. `docs/CAPABILITIES.md` is **not in this card's `touches:`**,
   and widening a fence from inside the lane is the one repair this role
   may never make. **THE INTEGRATOR MUST RUN `npm run capabilities`
   FROM tools/e2e AND COMMIT THE RESULT IN THE MERGE OR THE CHECKPOINT**,
   or CI's census-currency step reds on the next lane, layers from its
   cause — which is that gate's own founding story.
   **AND THE UNDERLYING PROBLEM IS STRUCTURAL AND WORTH A CARD**: since
   `T-153-s8` made the census a gate, **any card fenced to `tools/e2e`
   that adds or renames a test body cannot satisfy `capabilities:check`
   inside its own fence.** The remedy is a dispatch-time one — such a
   card's `touches:` should carry `docs/CAPABILITIES.md` — and it is
   `card-preflight`'s natural home. Described, not filed: **this lane
   mints no card ids.**
2. **The alias RENAME half of this card's own "shape of a fix".**
   Needs `.github/workflows/ci.yml` (CI's step is `npm run lint:docs`)
   and `workflow-parity.spec.ts`'s `CI_SEQUENCE`, so it is a three-file
   commit and `.github/` is outside `touches: [tools/e2e,
   docs/CONVENTIONS.md]`. **Whether it is still worth doing is argued
   below.**
3. **The third copy of the stale list**, `.github/workflows/ci.yml:197`.
   Same fence problem, and it should ride whichever card takes item 2.
4. **`T-197`'s lost-byte figure is a LIVE fact stated as a tree fact**,
   and its criterion 3 is already answered by a body that reds rather
   than one that passes. Both are recorded on `T-142` as instance 6,
   because T-197's card does not exist at this lane's base and cannot be
   appended to from here.

### `T-090`'s argument, re-derived rather than taken on report

The dispatch brief said `T-090` *"argued this gate should not be an npm
script at all and recorded 'exactly four' scripts"*, and asked whether
that argument should now win. **Read in full, that is a half-truth about
T-090 and the answer is no.**

- **The "exactly four" was a STATE DESCRIPTION, never a budget.** T-090's
  preamble records the status quo at `4d2f03c` and explains the
  MECHANICAL reason it had persisted: adding a command to CONVENTIONS'
  own command bullet forces a `CI_SEQUENCE` or `LOCAL_ONLY` entry in
  `workflow-parity.spec.ts`, `CI_SEQUENCE` requires a real ci.yml step,
  and **T-084's fence could not reach `.github/`.** It was a fence
  problem, not a principle.
- **T-090's own acceptance criteria then made it an npm script
  deliberately**, in all three places at once, with a CI step, after
  widening its fence to include `.github/`. So the argument did not
  merely lose; **it was retired by the card the brief credits with
  making it.**
- **Re-derived at `57c1b39`: `tools/e2e/package.json` carries NINE
  scripts** (`test`, `typecheck`, `lint:tokens`, `lint:docs`, `health`,
  `capabilities`, `capabilities:check`, `boot:check`,
  `boot:orphan-drill`), asked of the manifest rather than counted by
  eye. Nine, not four — and the growth is not the defect.
- **THE DEFECT WAS NEVER THAT THE GATE HAS AN ALIAS.** It is that ONE
  alias covers TWO questions and its exit code cannot say which it
  answered. Removing the alias would take the whole-tree half out of CI
  — the half that holds **both** incidents this gate was built for — to
  fix a naming problem. **That trade is strictly bad**, and it is the
  reason this lane fixed the OUTPUT rather than the affordance.
- **What survives of T-090's instinct, and it is worth keeping**: the
  count should not grow unwatched. It has more than doubled with no
  keeper, and **`health-bands.config.mjs` is where a keeper for it would
  live.** Described, not filed.

### IS THIS FIX GUARD-CLASS? — measured, and the answer is no

`tasks/TASK-FORMAT.md`'s test is **"ask what the card is ABOUT, not what
it touches"**, and its discriminator is **"a card that changes what the
guard REFUSES is one, however small its diff."**

**Nothing this lane built refuses anything.** No check was added, none
removed, no threshold moved, and no exit code changed for any input —
the 18-row before/after matrix above is byte-identical, read from the
child's own status with no pipe in between. The diff moves **where a
true sentence is printed** and **what it says about a code it does not
change**.

**So by the file's own test this is not a guard card**, and the honest
reading is that the subject is the guard's REPORTING rather than its
refusal set. **The judgement is the integrator's and the evidence is
above rather than the conclusion**: if that seat reads "the card's
subject is a gate" as sufficient, the right move is `review:
independent` and a blind verifier before the merge, and the matrix is
what such a verifier should attack first.

**One thing genuinely new does refuse: the spec body.** A test refuses a
regression by construction. That is true of every test this ceremony row
already requires, and if it made a card guard-class then no size-S
tooling card could ever be self-integrated.

### What I reviewed as my own integrator, and what I could not

This card's row is **S, diff outside shipped code** — `docs/**` and
`tools/e2e` are both in THE SHIPPED PARTITION's **NOT SHIPPED** list
(`tools/e2e` is named there explicitly as the case that rule exists to
settle). So no verifier is owed and I take the integrator-review half
myself.

**What I could not check from here**, stated rather than left to be
discovered:

- **The e2e lane is not green and cannot be made green from this
  fence.** 366/1 with the failure proven inherited and owned by `T-197`.
  A reader who wants one number should read 367 bodies of which 366 pass
  and one fails for a filed reason that predates this branch.
- **`docs/CAPABILITIES.md` staleness is real and is the integrator's to
  land.** Routed item 1.
- **The merge forecast is clean but this lane cannot run suites against
  it** — materialising that tree is the integrator's act.
- **This is a self-verified pass.** `review: self-verified` is stamped
  because that is the value that names the missing guarantee honestly;
  nothing here claims informational blindness.

### A CORRECTION THIS LANE MAKES AGAINST ITS OWN SUITE TABLE

The table above records the e2e lane at **366 passed / 1 failed, exit
1**, and calls the failure inherited. **Re-run at this lane's own tip
`a6d56d3`, it is 367 passed / 0 failed, exit 0** — and the difference is
not a re-run-until-green, it is the inherited defect proving itself.

`T-190` and `T-192`'s worktrees were removed from this machine between
the two runs. `brief.mjs --dispatch` renders the LIVE LANES section and
the STARTABLE list from `git worktree list`, so its own output shrank
from **69,302** bytes to **62,651** — **below one 65,536-byte pipe
buffer**, so nothing truncates and `dispatch-order.spec.ts:200` passes.
Same branch, same tree, no relevant code change; only the machine's
worktree count moved.

**BOTH READINGS ARE KEPT AND NEITHER IS THE HONEST ONE ALONE.** 366/1 is
what a busy machine measures and 367/0 is what a quiet one does. The
figure that reproduces is the THRESHOLD, not either tally: the body reds
whenever `--dispatch` exceeds a pipe buffer and passes whenever it does
not, and how many lanes are live decides which. Recorded in full on
`T-142` as instance 6's closing measurement, with the consequence for
whoever takes `T-197`: **that card's "one invocation large enough to
exceed the buffer" cannot be the live `--dispatch`**, because that size
is a live fact and a body pinned to it is green on a quiet machine and
red on a busy one, both with no code change.

**This is why the e2e result is reported as a threshold rather than as a
number, and why the earlier table was left standing rather than
rewritten** — a lane that quietly replaces its own red with a later
green has destroyed the evidence that the red was real.
