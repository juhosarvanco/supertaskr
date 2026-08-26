---
id: T-138
title: The read-first set has three spellings, its designated authority omits the product document, and that authority is in no component, no fence and no graph
feature: F-01
milestone: 4
priority: 3
size: M
status: done
blocked_by: [T-134]
touches: [CLAUDE.md, method/roles/orchestrator.md, method/roles/executor.md]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5
verified_by: claude-opus-5
review: same-model
---

**@human, 2026-08-26**: *"Why did this error happen to you? Why did you
not know this about `blocked_by`? Every time I start a new architect
session, it needs to be thoroughly aware of the functionalities and
features of our app."*

**This card is the root cause, measured. It is not an apology; every claim
below is a command anyone can re-run.**

## The chain

An architect session spent a working day believing `blocked_by` was
broken. It is not — the parser reads it, the app resolves every id against
the model, done blockers render green with a tick, and dangling blockers
measure zero. **The capability that would have told it so is documented in
`docs/ROADMAP.md`**, whose F-06 entry says the tasks lens *"lays the
board's cards out in dependency waves over `blocked_by`, with a critical
path (the longest chain, CPM sense) and a worst blocker."*

**The session never opened `ROADMAP.md`, and it was following instructions.**

| where | what it says the session reads first |
|---|---|
| `CLAUDE.md` (root adapter) | `docs/STATE.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md` |
| `method/roles/orchestrator.md:6` | `docs/STATE.md`, **`docs/ROADMAP.md`**, `docs/tasks/` |
| `method/roles/executor.md` row 3 | *"the project's OWN root adapter file"* — i.e. **`CLAUDE.md` is the authority** |

**Three spellings. The method designates the one that omits the product
document. Neither of the other two references it.** `grep -c ROADMAP
CLAUDE.md` returns **0**.

## And the authority is unowned

- **`CLAUDE.md` is tracked by git and is NOT in the architecture graph** —
  183 indexed files at `15f0d7d` and it is not among them, because the
  indexer walks code extensions and it is a root `.md`.
- **No component's `paths:` claims it.**
- **No fence can name it today** — which is why this card is
  `blocked_by: [T-134]`: path-granular fences are what make
  `touches: [CLAUDE.md, …]` expressible at all. **This card is the first
  consumer of that mechanism.**

**So the file that decides what every session in this project knows is
governed by nothing.** It is not in the registry, not in a fence, not in
the graph, and no gate fires on it.

## What is missing is a KIND of document, not a line

Adding `ROADMAP.md` to one list would fix today's instance and not the
class. **All three read-first documents are METHOD-shaped**: `STATE` is
what is happening now, `CONVENTIONS` is how to work, `ARCHITECTURE` is
which components exist. **Not one of them says what the app DOES for a
person using it.**

`ROADMAP.md` is the closest thing and it is **intent-shaped prose about
features in the abstract**, maintained by hand. It happened to carry the
F-06 sentence that would have saved a day, and it might not have.

**Meanwhile a behavioural description of the product already exists and is
derived**: `tools/e2e/tests/` holds **23 spec files and 163 named
behaviours**, each one a sentence about what the app does, kept true by
running. **Nothing points any session at them.**

## @HUMAN'S DECISIONS — 2026-08-26

**DECIDED: the product-shaped entry is a GENERATED capabilities document,
not a hand-written one.** `tools/e2e/tests/` holds **163 named behaviours
across 23 spec files**, each a sentence about what the app does, **kept
true by running**. A document generated from them cannot drift. A
hand-maintained one would reproduce the exact failure this card exists to
record — `docs/ROADMAP.md` already carried the sentence that would have
saved a day, and it went unread because prose is something somebody has to
keep true.

**AND @HUMAN REFRAMED THE CARD'S CENTRAL QUESTION, CORRECTLY.** The
architect wrote this card as *"what should the read-first set be"*. @human
asked whether the set should differ by role — *"of course they need to
differ, they are different roles"* — and that is the better question.

**Measured, and it is a third disagreement the architect had not found**:
`method/roles/executor.md` row 3 declares ONE read-first set for *"every
session in this project"*, sourced from the root adapter — **while the
role files already name different sets of their own.** So the project runs
two competing models at once, which is this card's own subject one layer
down.

**AND THE PER-ROLE DIFFERENCE IS DELIBERATE IN AT LEAST ONE SEAT.** A
verifier is kept blind to the executor's reasoning on purpose — that
blindness is what `T-104`'s ruling SEVEN identifies as the property that
makes a same-model verdict sharp. **A single universal list is therefore
not merely inconvenient for that seat; it is wrong for it.**

**THE EVIDENCE SAYS THE OTHER SEATS ARE NOT THE PROBLEM.** On 2026-08-25/26
the pipeline produced **16 merges and 100 done cards**, with two
rejections (`T-111`, `T-132`) that each caught a real defect and were each
fixed and re-approved. **Executors, verifiers and integrators repeatedly
caught the ARCHITECT's errors** — a fabricated citation, a stale figure
carried into a brief, a wrong ignore-rule, a claim of novelty that was
already written down. **The failing seat was the dispatching one, and its
list is the one that omitted the product document.**

So this card SHALL NOT speculatively re-cut the other three lists. It
SHALL reconcile the ONE-list/PER-ROLE contradiction, fix the seat that
demonstrably failed, and **change another seat's list only where there is
evidence that seat needed it.**

## Acceptance criteria

- **THE THREE SPELLINGS SHALL BECOME ONE, and the reconciliation SHALL
  name which is authoritative.** `executor.md` row 3 already rules the
  adapter authoritative — **so either the adapter gains what the role file
  has, or the role file stops carrying a competing list.** Two lists that
  agree today drift tomorrow (T-057).
- **THE SET SHALL INCLUDE A PRODUCT-SHAPED ENTRY**, and the card SHALL say
  what makes it product-shaped rather than adding a filename. **A session
  that has read the set SHALL be able to answer "what does this app do
  for a user" without opening source.**
- **THE 163 NAMED BEHAVIOURS SHALL BE EVALUATED AS THAT ENTRY, not
  assumed to be it.** They are derived and cannot go stale, which is the
  property `ROADMAP.md` lacks — **and they are 163 sentences, which is a
  reading cost a session pays every time.** Rule on it with the count
  measured at your own ref, and if the answer is "summarise them", say
  who keeps the summary true.
- **`CLAUDE.md` SHALL BE GIVEN AN OWNER**, or this card SHALL state
  plainly that it deliberately stays unowned and why. **A file the method
  designates as authoritative and the registry does not know about is the
  gap this card exists to name** — leaving it is a decision, not a
  default.
- **NO GATE SHALL BE BUILT BY THIS CARD.** Whether an unowned authority
  should fail a check is a real question and a separate one; **`T-136` was
  rejected today for gating a defect that did not exist**, and the lesson
  is to measure before mechanising.
- **THE READING COST SHALL BE STATED.** Every document added to the
  read-first set is paid for by every session forever. **Say what the set
  costs now and what it costs after** — the ceremony measurement in
  `T-131` exists because nobody had ever priced this project's overheads.

Verification: headless. **`CLAUDE.md` is read by `app/test/interview-chat-dom.test.tsx`** — derived, not assumed — so `npm test` from `app/` is owed and the reason SHALL be stated. `npx vitest run` from `lib/parser/` and `npm test` from `tools/e2e/` per the DOCS GATE's own answer; run it **directly, never through `xargs`**, and note **exit 3 is GATE COULD NOT RUN**. Exits **unpiped from `$?`**, counts derived (Playwright prints `Running N tests`; cross-check it). **This card may add no test body** — if so, say so explicitly rather than leaving the drill silent. **Build `lib/parser` before any app suite.** **Ports are machine-wide while lane-protocol rule 4 partitions by CHECKOUT (`T-132-s6`)** — explicit port, re-probed immediately before binding. **@human: one look at the final read-first set**, because what every future session is required to read is a judgement about their time, not a mechanical fact.

---

## @HUMAN AND THE ARCHITECT NARROWED THIS CARD MID-LANE — 2026-08-26

**@human asked to simply see the lists and decided in two sentences.**
First: *"everything seemed to be working fine except that architect
session didn't get roadmap in the list."* Then, on being shown the lists
properly: *"keep the reading list the same for now, just add roadmap to
orchestrator"* — which landed on main at `db4c903`, after this lane was
cut. **So the per-role reconciliation this card was about to build is
DROPPED: no seat's list is re-cut by this lane, and no rule is written
declaring one file authoritative over the others.**

**What was already built to the wider scope was reverted rather than
landed** — `method/roles/executor.md` step 1, its row 3, two new bullets in
its rules section, and a new step 2c in `method/roles/orchestrator.md`. The
tree went back to `00e133a` and the lane's diff is this card and its
findings. Details in the implementation notes below, because a reverted
edit that is never described is a decision nobody can review. **The revert
also turned out to matter mechanically**: `db4c903` wrote to
`method/roles/orchestrator.md` while this lane held it, and the reverted
step 2c is the only reason that is a clean merge rather than a conflict.

## Implementation notes — executor claude-opus-5, 2026-08-26

Every figure is measured at this lane's base and tip,
`00e133a16d11829ba5218417490d0b7856345324`, unless it names another ref.
Branch `task/T-138-lane`, worktree `/Users/ujju/Projects/nputer-T-138`.

### THE SHAPE, CORRECTED TWICE — AND THE SECOND CORRECTION CAME FROM THE ARCHITECT, NOT FROM ME

**THIS SECTION FIRST SAID "ONE SET AND FOUR SUBSETS". THAT WAS WRONG, AND
I DID NOT CATCH IT.** The architect handed me the correction mid-lane; I
verified it against the files and against history, and it is right in its
load-bearing half and wrong in one of its four quoted lines. Both halves
are below, because a record that shows only the corrected answer hides
who found it.

**THE CATEGORY ERROR, WHICH THE ARCHITECT AND THEN I BOTH MADE.** Grepping
a role file for document paths finds two different kinds of sentence and
cannot tell them apart: a READING STEP (*"Read X, Y, Z"*) and a WORK
INSTRUCTION that happens to name a document (*"Run the test commands from
CONVENTIONS"*, *"resolve conflicts in the spirit of ARCHITECTURE"*). Only
the first is a reading list. My own table below inherited this error and
carried it one step further, which is recorded at the end of this section.

**EVERY ROLE FILE'S STEP 1, VERBATIM, AT `00e133a` — this lane's base:**

| role file | its step 1 opens | what it IS |
|---|---|---|
| `orchestrator.md` | *"Read the read-first set named by this project's own root adapter file (its filled-in CLAUDE.md/AGENTS.md), then docs/tasks/."* | a DEFERRAL plus one work input |
| `executor.md` | *"Read your task file, docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md."* | **a real reading list** |
| `verifier.md` | *"Run the full test commands from docs/CONVENTIONS.md."* | **an ACTION** |
| `integrator.md` | *"Merge the task branch into the integration branch with a merge commit…"* | **an ACTION** |
| `planner.md` | *"Scaffold first — stage 0, before any question: copy docs-templates/\*.md into docs/…"* | **an ACTION** |

**AND MAIN MOVED UNDER THIS LANE WHILE IT RAN.** At `db4c903`, main's tip
at the time of writing, @human ruled *"keep the reading list the same for
now, just add roadmap to orchestrator"* and `orchestrator.md` step 1 went
back to an explicit list:

> *"Read docs/STATE.md, docs/ROADMAP.md, docs/ARCHITECTURE.md,
> docs/CONVENTIONS.md, and docs/tasks/."*

**SO THE SHAPE, NAMED AT ITS REF RATHER THAN IN THE ABSTRACT:**

- **At `00e133a`** — the adapter carries the set; **ONE** role file carries
  a list of its own (`executor.md`); **ONE** defers to the adapter
  (`orchestrator.md`); **THREE** carry no reading step at all.
- **At `db4c903`** — the adapter carries the set; **TWO** role files carry
  a list of their own (`orchestrator.md`, `executor.md`); **THREE** carry
  no reading step at all.

**IT WAS NEVER FOUR SUBSETS AT ANY REF.**

### THE FINDING WORTH KEEPING: THREE ROLES ARE TOLD TO BEGIN BY DOING

**RECORDED, NOT FIXED.** @human has said the reading list stays as it is
for now and is reasoning about the target shape; this card proposes
nothing about it.

`verifier.md`, `integrator.md` and `planner.md` have no reading step. They
open on an action — run the suite, make the merge commit, scaffold the
tree. **Everything standing those seats know therefore arrives in their
BRIEF**, which is why briefs to them are the longest this project writes,
and it is where this pipeline's dispatch errors have concentrated.

**AND THE THIRD ONE IS DIFFERENT FROM THE OTHER TWO, WHICH IS WHAT MAKES
THIS A FINDING RATHER THAN A TALLY.** The planner has nothing to read: its
step 1 CREATES `docs/` from the templates, so a reading step there would
name files that do not exist yet. **The verifier and the integrator run
against a full tree and are still told to start by doing.** Those are the
two cases. The architect's correction counted two roles with no reading
step and named the two that matter; the file count is three, and the
distinction above is the reason both numbers are defensible.

### WHERE MY OWN TABLE WAS WRONG, IN THE SAME WAY

An earlier version of this section claimed *"the integrator is the WIDEST
seat, not the narrowest"*, citing `integrator.md:31–33`. **Those three
lines are the checkpoint RITUAL — a list of documents the integrator
WRITES at the end of its work, not a list it reads at the start.** The
observation is true and the label was wrong, and it was wrong by exactly
the mechanism described at the top of this section: I found document names
with a search and called the result a reading list. **The integrator does
update STATE, ROADMAP and ARCHITECTURE at `:31–:33`, and it has no
read-first step.** Both, not either.

### A FENCE BREACH ON MAIN, AGAINST THIS LIVE LANE

**`db4c903` edits `method/roles/orchestrator.md`, which is inside this
card's `touches:`, while this lane was live.** No damage: this lane
reverted its own edit to that file before the commit landed, so
`git merge-tree --write-tree db4c903 HEAD` returns **exit 0** and a
five-path diff with no conflict. **Had the reverted step 2c stayed, the
merge would have arrived at a hand-resolved conflict in a file two
writers held** — which is the situation `lane-protocol.md` rule 5 exists
to prevent, and it was avoided by luck rather than by the rule working.
Recorded, not routed: the fix is a dispatching-seat discipline and @human
is already reasoning about that seat.

### AND ONE MEASUREMENT THE NARROWING DOES NOT DISPOSE OF, RECORDED AND NOT ACTED ON

**The executor's three are byte-for-byte the pre-`6a6bc87` shared list,
and byte-for-byte what `method/adapters/CLAUDE.md:8` still says today.**

```
method/roles/executor.md:5      docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
method/adapters/AGENTS.md:8     docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
method/adapters/CLAUDE.md:8     docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
CLAUDE.md / AGENTS.md (root)    docs/STATE.md, docs/ROADMAP.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
```

Three identical copies of the old set survive; the root pair moved on
2026-08-26 and nothing else did. **A subset whose members are the previous
version of the superset is a stale copy until somebody says otherwise — it
is not evidence that it is one, and this lane does not treat it as one.**

**AND THIS IS NOT NEWS, WHICH IS THE POINT OF SAYING SO.** `db4c903`'s
own message already reaches the same conclusion — *"executor.md:5 omits
ROADMAP exactly as the adapter did before today"* — and records @human's
ruling that it stays: *"Flagged rather than fixed, because an executor
reading its own card and fence may genuinely not need the product
roadmap, and that is a judgement rather than an oversight."* **This lane
adds the byte-identity evidence and the fence-collision note and claims
nothing else.** A claim of novelty about something already written down is
one of the four architect errors this card exists to record, and filing
one here would have been the fifth. `T-138-s4` carries the residue.

### THE TEMPLATE IS NOT GENUINELY MINE, AND THE CANONICAL MODULE SAYS SO

Asked directly of `lib/parser`'s `fence.ts` — the one implementation
(T-134) — at `00e133a`:

```
T-138 expands to exactly: CLAUDE.md, method/roles/executor.md, method/roles/orchestrator.md
                          excluded [] · unusable [] · issues []

T-138                        vs [method/adapters/CLAUDE.md, method/adapters/AGENTS.md]  ->  disjoint
T-138                        vs [method/, docs/CONVENTIONS.md]                          ->  overlapping
  witnesses: method/roles/executor.md, method/roles/orchestrator.md
[method/adapters/*.md]       vs [method/, docs/CONVENTIONS.md]                          ->  overlapping
  witnesses: method/adapters/CLAUDE.md, method/adapters/AGENTS.md
```

**The token `CLAUDE.md` normalises to the repository-root path and does
not reach `method/adapters/CLAUDE.md`** — `sharedDomain` returns
`undefined` for that pair, because neither string is a path-prefix of the
other. **So the adapter half of the template fix is DISJOINT from this
fence: not mine, by measurement rather than by caution.** And it is
`overlapping` with `[method/, docs/CONVENTIONS.md]`, which `T-105`,
`T-128` and `T-131` each hold — so it composes with whichever of those
runs, or it needs its own file-granular fence. Routed as `T-138-s2` with
the arithmetic below.

### THE PRODUCT-SHAPED ENTRY — RULED, WITH THE COUNTS DERIVED AT MY OWN REF

**THE 163 IS REAL AND IT IS NOT THE NUMBER OF BEHAVIOURS.** At `00e133a`:

| figure | value | how |
|---|---|---|
| spec files | **23** | `ls tools/e2e/tests/*.spec.ts \| wc -l` — the card's figure, confirmed |
| `test(` call sites | **170** | `command grep -rhE "^[[:space:]]*test\(" tools/e2e/tests/*.spec.ts \| wc -l` |
| of those, with a literal double-quoted name | **163** | the same grep restricted to `test\("` |
| the remaining **7** | template literals | 2 interpolate a constant into one test each; **5 sit inside `for` loops** — `keyboard-activation`, `panel-real-keys`, `range-rule` over `CHECK_IDS`, `shell-frame` over `VIEWPORTS`, `window-contract` over its size list — and each expands to more than one test at run time |

So **163 is exactly the set of statically extractable sentences**, which
is the right number for a generated document and the wrong number for
"how many behaviours does this suite assert". A generator reading only
`test("…")` is honest about 163 and silently drops seven families; it must
expand the loops or NAME what it could not extract. **The card's own
figure was right for a reason the card did not state.**

**RULED: the 163 sentences ARE the product-shaped entry, and they are it
as a GENERATED document under `docs/`, not as a pointer to a directory.**

1. **THEY CANNOT GO STALE, WHICH IS THE PROPERTY `ROADMAP.md` LACKS.** A
   sentence in a spec name is false the moment its body reds. **Nobody
   keeps the generated summary true — the generator does, and what gets
   reviewed is the generator.**
2. **A DIRECTORY POINTER IS INVISIBLE TO THE MACHINERY THAT WRITES ROW 3
   INTO EVERY BRIEF, AND THIS IS MEASURED.** `dispatch-brief.mjs`'s
   `deriveReadFirst` extracts the set from the adapter with
   `/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g`. Run at `00e133a`, row 3 emits:

   ```
   CLAUDE.md names: docs/STATE.md docs/ROADMAP.md docs/ARCHITECTURE.md docs/CONVENTIONS.md docs/NORTH_STAR.md
   ```

   The `tools/e2e/tests/` paragraph `6a6bc87` added — the product pointer,
   the whole point of that commit — **does not appear**, because it is not
   a `docs/*.md` path; and `docs/NORTH_STAR.md` does appear, because the
   adapter names it in its ROUTING sentence. **Row 3 today over-reports by
   one document and under-reports the only one this card is about.** A
   generated `docs/CAPABILITIES.md` is picked up by that regex with no
   change to the tool. Routed as `T-138-s3`.
3. **IT IS AFFORDABLE, which is the third criterion and not a formality.**

### THE READING COST, BEFORE AND AFTER

Measured at `00e133a` with `wc -l -w -c`:

| document | lines | words | bytes |
|---|---|---|---|
| `docs/STATE.md` | 1 062 | 9 936 | 63 635 |
| `docs/ROADMAP.md` | 1 079 | 12 487 | 73 183 |
| `docs/ARCHITECTURE.md` | 1 202 | 19 911 | 128 088 |
| `docs/CONVENTIONS.md` | 1 464 | 15 942 | 99 212 |
| **the set today** | **4 807** | **58 276** | **364 118** |
| the 163 sentences, as a flat list | 163 | 2 052 | 11 808 |

- **BEFORE: 364 118 bytes.**
- **AFTER THIS CARD: 364 118 bytes — unchanged.** This lane adds no
  document to the set.
- **AFTER THE ROUTED ENTRY LANDS: 375 926 bytes, a 3.24% increase.** The
  entry is **16.1%** the size of `ROADMAP.md`, which is itself **20.1%**
  of the set — and it answers the question the failing session opened
  `ROADMAP.md` for.

For scale the other way: the adapter naming the set is 1 140 bytes, so the
set costs **319×** what the file naming it costs. That ratio is the reason
the adapter can afford to be read every time and the reason each document
added to it cannot.

### `CLAUDE.md` DELIBERATELY STAYS UNOWNED, AND THE CARD'S FRAMING OF THIS IS WRONG

Both of the card's facts are TRUE at `00e133a` and both were re-derived:
no component's `paths:` names `CLAUDE.md`, and it appears **0 times** in
`docs/architecture/graph.json`, whose file count is **183** — the card's
figure at `15f0d7d`, unmoved.

**But it is not an anomaly, and the card reads it as one.** Expanding
every component's `paths:` against `git ls-files` at `00e133a`:

```
tracked 789   claimed by some component 119   unclaimed 670
unclaimed by top level: docs/ 381, app/ 241, tools/ 43, .github/ 1, root 4
the four root files: .gitignore  .nputerignore  AGENTS.md  CLAUDE.md
```

**85% of the tracked tree is in no component**, including all of `docs/`,
all of `tools/e2e/` and 241 files under `app/`. The registry maps
COMPONENTS whose reality the map compares against code; it was never a
file census. So:

- **Ownership buys nothing the map can use.** The indexer walks code
  extensions, so a claimed root `.md` adds zero files to the 183 and
  leaves a `paths:` entry the walk can never confirm — the situation
  `C-01` needed a hand-written `non_code: true` flag to stop reporting as
  amber forever.
- **What the card wanted was a FENCE, and `T-134` already delivered it.**
  `touches: [CLAUDE.md, …]` on this very card is the board's first
  repository-root file token; it expanded to exactly one path, with an
  empty `unusable` list, and held for a whole lane. The file is
  governable now. It was never going to be a component.
- **And the registry is outside this fence anyway** — a `paths:` edit
  lives in `docs/architecture/components/C-*.md` and moves three live
  fixtures (`CONVENTIONS.md`, the DECLARING A COMPONENT gotcha).

**Recorded as a decision: `CLAUDE.md` stays unowned. Its governance is its
fence, not a component row.**

### WHY THE ROOT ADAPTER GOT NO EDIT, THOUGH IT IS IN THE FENCE

`CLAUDE.md` and `AGENTS.md` are byte-identical at `00e133a` (`diff`
returns empty). `AGENTS.md` is NOT in this card's `touches:`, and
`deriveReadFirst` **compares the two root adapters and files a FOUND
finding when they disagree about the set** — `brief.mjs` then exits 1.
Editing one twin and not the other would manufacture, inside this lane,
the exact divergence this card exists to close. **The fence permitted the
edit; the twin made it unsafe.** The card's `touches:` is one file short,
and that is a dispatch defect rather than a judgement call.

### NO GATE. NO TEST BODY. THE DRILL IS SILENT AND THIS SAYS SO.

**No gate was built** — criterion 5. `T-136` was rejected today for gating
a defect that did not exist; the two defects a gate might want here are
now measured and on the record above, and both are routed.

**THIS CARD ADDS NO TEST BODY, SO NO POISON DRILL WAS RUN.** Stated
explicitly per the drill's own clause: the final diff is markdown under
`docs/tasks/` and contains no new or changed assertion anywhere.

### THE METHOD SNAPSHOT DOES NOT MOVE, DERIVED RATHER THAN ASSUMED

`METHOD_SNAPSHOT_VERSION` is `"0.1.6"` at
`app/src-tauri/src/agent/kit.rs:35`. The KIT table names **`roles/planner.md`
and no other role file** — `kit.rs:63–64`, and the module header says so
in as many words: *"Deliberately NOT included: the other role files (a
planner does not need executor.md)"*. The adapters it does carry are
`method/adapters/CLAUDE.md` (`rel:` at `:99`, `include_str!` at `:100`)
and `method/adapters/AGENTS.md` (`:103`/`:104`). **This lane's final diff
touches no file under `method/` at all**, so nothing recompiles, no
method format changed, the version stays at `0.1.6`, and **`cargo test`
is NOT owed by this card.** It IS owed by `T-138-s2`, which is why that
one is a card and not a line.

### ROUTED, NOT BUILT — and one card already filed that this lane could have taken

| id | what it is | the fence it needs |
|---|---|---|
| `T-138-s1` | the GENERATED capabilities document @human decided on, with the 163/170 arithmetic, the loop hazard, and why it belongs under `docs/` | `[tools/e2e, docs/CAPABILITIES.md, CLAUDE.md, AGENTS.md]` |
| `T-138-s2` | the adapter TEMPLATE still names the old three, with the full three-file bump arithmetic and `0.1.6 → 0.1.7` | `[method/adapters/*.md, method/interview/plan-interview.md, docs/CONVENTIONS.md, app-agent]` — `disjoint` from this lane, `overlapping` with `[method/, …]` |
| `T-138-s3` | row 3's deriver reads only `docs/*.md`, so it over-reports NORTH_STAR and drops the product pointer | `[tools/e2e]`, which `T-137` holds live |
| `T-138-s4` | the executor's subset is byte-identical to the superseded shared list — recorded, deliberately not acted on, per the narrowing | `[method/roles/executor.md]` |

**AND `T-133-s3` WAS SITTING AT A SEAT THIS LANE HELD, AND I DID NOT TAKE
IT.** It asks for one sentence in `method/roles/orchestrator.md` step 5b
naming `brief.mjs` as the way to obey the contract step 5b already
requires. That file was inside this fence and free. **Taking another
card's suggestion is a triage act and belongs to the orchestrator (its
step 2), not to an executor whose own step 5 says suggestions never
expand its scope.** Flagged loudly rather than taken, because the next
lane to hold that file may be a long way off — `method/roles/orchestrator.md`
is `overlapping` with `[method/, docs/CONVENTIONS.md]`, held by three
queued cards.

### THE COUNT CROSS-CHECKED AGAINST THE RUN, WHICH COMPLETES THE RULING

The card asked for the Playwright figure as a cross-check on the static
count. Run at `64b939e`:

```
Running 194 tests using 1 worker
194 passed (2.2m)
```

**So the three numbers are 163, 170 and 194, and each is the answer to a
different question:**

| number | what it counts |
|---|---|
| **163** | `test("…")` sites with a literal double-quoted name — **the extractable sentences**, and the figure the card carried |
| **170** | all `test(` call sites, literal or template |
| **194** | tests Playwright actually RUNS — the 5 loop-generated sites expand, adding **24** |

**A generator that reads the SOURCE tops out at 163 and is silently
missing 31 behaviours; one that reads the RUN gets all 194 and costs a
full suite pass per regeneration.** That is the choice `T-138-s1` has to
make, and it is now a measurement rather than an argument. The card's
"163 named behaviours" was right about the sentences and 31 short of the
behaviours — which is the same shape as every other figure this card is
about: true, unrefed, and read as something slightly different from what
it measured.

### SUITES AND GATES, AT THEIR REFS

**Every figure below was measured at `64b939e`.** This section is a later
prose-only commit on top of it, so the tip carrying these words is not the
tip they were measured at — named rather than papered over
(`roles/verifier.md`, THE FIGURE CASE). The suites were re-run at the
final tip and the numbers are unchanged.

| command | from | exit | result |
|---|---|---|---|
| `npm ci` · `npm run build` | `lib/parser/` | 0 · 0 | setup, per the fresh-clone ORDER |
| `npx vitest run` | `lib/parser/` | **0** | **290 passed / 290**, 13 files |
| `npx tsc --noEmit` | `lib/parser/` | **0** | — |
| `npm install` · `npm run build` | `app/` | 0 · **0** | the fast gate |
| `npm test` | `app/` | **0** | **1013 passed / 1013**, 47 files |
| `npm ci` | `tools/e2e/` | 0 | setup |
| `npm run typecheck` | `tools/e2e/` | **0** | — |
| `npm run lint:tokens -- --selftest` | `tools/e2e/` | **0** | — |
| `npm run lint:tokens` | `tools/e2e/` | **0** | clean — TOKEN 138 files, CONTROL 775 tracked text files |
| `npm run lint:docs` | `tools/e2e/` | **0** | every live task card's frontmatter parses, with a legal status |
| `NPUTER_E2E_PORT=14538 npm test` | `tools/e2e/` | **0** | **194 passed / 194**, 1 worker, 2.2m |

Exits read unpiped from `$?`. **Port 14538, re-probed on both stacks with
`lsof` immediately before binding** (16:24:28Z on `Mac.lan`, no listener);
1420 was read once with `lsof` only and holds the human's app at
`[::1]:1420`, pid 19746, untouched.

**THE RANGE, WITH ITS REF.** `main` moved twice under this lane, so it is
named rather than spelled:

```
MAINTIP=db4c90330004be43c94d3ad6946202a175d5df41
TREE=$(git merge-tree --write-tree "$MAINTIP" HEAD)   -> exit 0, read BEFORE the substitution
git diff --name-only "$MAINTIP" "$TREE"               -> 5 paths, all docs/tasks/T-138*.md
```

**THE THREE STANDING GATES, DERIVED FROM THAT 5-PATH DIFF:**

- **GRAPH REGEN — NOT OWED.** Trigger is `*.ts/*.tsx/*.js/*.jsx` outside
  `docs/`; **0 of 5** match.
- **BOOT GATE — NOT OWED.** Trigger is `app/src-tauri/**`, `app/src/**`,
  `app/package.json` or `app/src-tauri/Cargo.toml`; **0 of 5** match.
- **DOCS GATE — FIRES, and was run.** Trigger is a path under `docs/`
  that a code suite READS; **5 of 5** match. The readers are
  `lib/parser`'s smoke test (it parses the live `docs/` tree),
  `app/test/select-board.test.ts` (it reads live cards off disk), and
  `tools/e2e`'s `docs-input-gate.spec.ts`. All three ran green above, and
  `npm run lint:docs` — the gate's NAMED form — is exit **0**, not exit 3.
- **`cargo test` — NOT OWED**, derived: this diff touches nothing under
  `method/`, and `METHOD_SNAPSHOT_VERSION` does not move.

---

## VERDICT — APPROVED — verifier claude-opus-5, 2026-08-26

**Refs named, because main moved three times while I worked.** Base
`00e133a16d11829ba5218417490d0b7856345324`, tip
`956919c487be61e7c1455141bfb7924edf4bf6c8`, `main` at
`2a922cecfc35e61ab67a20575c5bf792f6a7d7ff` when I read it. Worktree
`/Users/ujju/Projects/nputer-T-138`.

**BOUNDED READ, HONOURED AND TIMED.** I read this card at `00e133a` and
wrote my attack set to disk at **16:43:59Z**, one minute later, **before**
opening the diff, the implementation notes or any routed card.

**THIS CARD'S DELIVERABLE IS A RECORD, so the verdict is about whether its
claims are TRUE.** I re-derived every load-bearing figure myself. What
follows separates what I measured from what I took on the lane's word,
because the card asked for exactly that discipline about itself.

### RE-DERIVED INDEPENDENTLY — every one matched, to the digit

| claim | lane | mine | how |
|---|---|---|---|
| tracked files at `00e133a` | 789 | **789** | `git ls-tree -r --name-only 00e133a \| wc -l` |
| claimed by some component | 119 | **119** | every `paths:` glob expanded against that list |
| unclaimed | 670 (85%) | **670 (84.9%)** | same |
| unclaimed by top level | docs 381 · app 241 · tools 43 · .github 1 · root 4 | **identical** | same |
| the four root files | `.gitignore .nputerignore AGENTS.md CLAUDE.md` | **identical** | same |
| `graph.json` files | 183 | **183**, and `CLAUDE.md` appears **0** times | `json.load` at `00e133a` |
| spec files | 23 | **23** | `ls tools/e2e/tests/*.spec.ts` |
| `test(` call sites | 170 | **170** | `^[[:space:]]*test\(` |
| with a literal name | 163 | **163**, and **0** single-quoted | `^[[:space:]]*test\(("\|')` |
| template literals | 7, **5 in `for` loops** | **7, and all 5 verified in a `for` loop by reading each** | `^[[:space:]]*test\(\`` + context |
| behaviours Playwright runs | 194 | **194** | derived WITHOUT a run: 163 + 2 + 2 + 2 + 20 (`CHECK_IDS`) + 3 (`VIEWPORTS`) + 2 — then confirmed by my own run |
| a source-reading generator is short by | 31 | **31** | 194 − 163 |
| loops add | 24 | **24** | 194 − 170 |
| STATE / ROADMAP / ARCHITECTURE / CONVENTIONS bytes | 63 635 · 73 183 · 128 088 · 99 212 | **identical** | `wc -c` at `00e133a` |
| the set today | 364 118 | **364 118** | same |
| the 163 as a flat list | 11 808 | **11 808** | extracted and measured |
| after the routed entry | 375 926 (+3.24%) | **375 926 (+3.243%)** | arithmetic on the above |
| entry vs ROADMAP · ROADMAP vs set | 16.1% · 20.1% | **16.13% · 20.098%** | same |
| adapter bytes, and the ratio | 1 140 · 319× | **1 140 · 319.4×** | same |
| `lint:tokens` census | TOKEN 138 · CONTROL 775 | **identical** | ran it |

**THE PARENT BRIEF'S CORRECTION TO THE 170 WAS WRONG, AND THE LANE IS
RIGHT.** I was told to expect 165 from "a simpler pattern". `^test\(`
gives 165; `^[[:space:]]*test\(` gives 170. **The five-line difference is
exactly the five indented call sites, and every one of them sits directly
inside a `for` loop with a template-literal name** — `keyboard-activation`,
`panel-real-keys`, `range-rule`, `shell-frame`, `window-contract`. The
simpler pattern drops precisely the sites that decide the question, which
is why 170 is the right count and 165 is not. (A sixth match, 171, is the
words `` `test()` `` inside a comment at `range-rule.spec.ts:45` — prose,
not a call site. 170 stands.)

### THE FOUR STRUCTURAL CLAIMS — attacked, all four hold

**1. THE ROLE-FILE SHAPE — verified by READING step 1 of all five, never
by grepping.** At `00e133a`: `orchestrator.md` defers to the adapter and
carries no list; `executor.md` carries a real reading list; `verifier.md`
opens *"Run the full test commands…"*, `integrator.md` opens *"Merge the
task branch…"*, `planner.md` opens *"Scaffold first — stage 0…"*. **Three
actions, one list, one deferral. Not four subsets, at any ref.**
**And the planner reasoning is sound — I checked it because it is the one
that makes the other two interesting.** `planner.md` step 1 copies
`docs-templates/*.md` INTO `docs/` and creates `docs/decisions/`,
`docs/tasks/`, `docs/rooms/`. It is the seat that brings the read-first
documents into existence, so a reading step there would name files that do
not yet exist. **Having nothing to read is correct for the planner and is
NOT correct for the verifier and the integrator, which run against a full
tree.** The lane's distinction is real, and its own self-correction — that
`integrator.md:31–33` is the checkpoint RITUAL, documents it WRITES — is
right: I read those lines.
**The grep artefact is demonstrable.** `verifier.md` names
`docs/CONVENTIONS.md` and `docs/ARCHITECTURE.md`; `integrator.md` names
`docs/ARCHITECTURE.md`. A path-grep returns a reading list for both. Step 1
returns an action for both. The architect reached the same conclusion
independently at `db4c903` — *"my 'four reading lists' table was
three-quarters a grep artifact"*.

**2. `deriveReadFirst` — REPRODUCED BY RUNNING THE TOOL, both directions.**
`context({root, taskId:"T-138", role:"executor"})` → `assembleBrief` →
`render` emits, verbatim:

```
ROW 3 — Read-first set
  AGENTS.md names: docs/STATE.md docs/ROADMAP.md docs/ARCHITECTURE.md docs/CONVENTIONS.md docs/NORTH_STAR.md
  CLAUDE.md names: docs/STATE.md docs/ROADMAP.md docs/ARCHITECTURE.md docs/CONVENTIONS.md docs/NORTH_STAR.md
```

`docs/NORTH_STAR.md` is **wrongly included** — it reaches the set from the
adapter's ROUTING sentence, not from its reading sentence. The
`tools/e2e/tests/` pointer `6a6bc87` added is **wholly invisible**, because
`/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g` cannot see a path that is not
`docs/*.md`. **Row 3 is wrong in both directions today.** This is the
sharpest thing in the card and it is exactly as described. `T-138-s3` is
correctly routed and correctly scoped to `[tools/e2e]`.

**3. THE BUMP ARITHMETIC — the ordering claim is EXACTLY right, and it
does decide one commit versus two.** `kit.rs:437`
`snapshot_version_matches_the_live_method_stamps` asserts in this order:
**`:443`** the compiled-in `plan-interview.md` contains `(v{VERSION}`,
**then `:450`** the on-disk `docs/CONVENTIONS.md` contains
`currently v{VERSION}`. Rust `assert!` panics, so **a const-only bump
aborts on the plan-interview arm and never reaches the CONVENTIONS arm** —
the second stamp is never even evaluated. All three must move together or
every intermediate commit is red. **One commit, confirmed.** Live stamps
are `0.1.6` in all three places (`CONVENTIONS.md:266`,
`plan-interview.md:26`, `kit.rs:35`).

**4. THE FENCE — asked of the canonical module, both halves confirmed.**
Built `lib/parser` and called `expandFence`/`compareFences` from
`dist/fence.js`:

```
T-138 -> [CLAUDE.md, method/roles/executor.md, method/roles/orchestrator.md]  issues 0
T-138 vs [method/adapters/CLAUDE.md, method/adapters/AGENTS.md] -> "disjoint", witnesses []
T-138 vs [method/, docs/CONVENTIONS.md]                        -> "overlapping",
     witnesses: method/roles/executor.md, method/roles/orchestrator.md
```

**The subtlety is real and the lane read it correctly.** `sharedDomain`
returns a domain only when one string is a `/`-prefix of the other;
`"method/adapters/CLAUDE.md".startsWith("CLAUDE.md")` is **false**, so a
shared BASENAME creates no overlap. A fence holding the repository-root
`CLAUDE.md` does not hold the template of the same name. **Not this lane's
to edit, by measurement rather than by caution.** I also confirmed all four
routed fences expand with **0 issues and 0 unusable**, and that `app-agent`
in `T-138-s2` resolves through `C-14` to `app/src-tauri/src/agent` — which
is where `kit.rs` lives, so that card's fence really does cover its own
bump.

### THE CORRECTIONS TO MY BRIEF — each checked, three confirmed, one wrong

- **`token-scan.spec.ts:106`** — confirmed at that exact line. Its seven
  roots are `app/package.json`, `docs/NORTH_STAR.md`,
  `lib/parser/package.json`, `tools/e2e/package.json`, `method/README.md`,
  **`AGENTS.md`**, `.github/workflows/ci.yml`. **`CLAUDE.md` is NOT among
  them; `AGENTS.md` is.** The twin carries a test consequence the file in
  the fence does not.
- **`kit.rs`** — confirmed: `:99` is `rel: "adapters/CLAUDE.md"`, `:100` is
  the `include_str!`. (`6a6bc87`'s own message says `:99` for the
  `include_str!` and is off by one.) `AGENTS.md` at `:103`/`:104`.
  `METHOD_SNAPSHOT_VERSION` at `:35`.
- **THE READER** — confirmed, both halves.
  `interview-chat-dom.test.tsx:720` mentions `CLAUDE.md` **only inside a
  `REFUSED_COMPOUND` fixture string** quoting a kit copy command; it never
  opens the file. The live reader is
  **`select-board.test.ts:1119`**, `readRepo("method/roles/orchestrator.md")`,
  regex-matched for `Ceiling: 3–5 concurrent` — a file that was inside this
  fence. The DOCS GATE census agrees: it lists `select-board.test.ts` as a
  reader and does not list `interview-chat-dom.test.tsx` at all.
- **THE `test(` COUNT — my brief was wrong and the lane was right.** See
  above.

### THE TWO-WRITER TRAP — clean at my ref, and clean only because of the revert

`db4c903` (19:14:50) edits `method/roles/orchestrator.md`, inside this
card's live `touches:`. At my ref:

```
git merge-tree --write-tree main task/T-138-lane
-> exit 0            (read BEFORE the substitution)
-> 661229f585fe31d7ada8103b26db75081525ddbc
```

**Exit 0, no conflict.** The lane's account is right: the reverted step 2c
is the only reason. This is a `lane-protocol.md` rule 5 breach by the
dispatching seat that escaped by luck, and recording it rather than routing
it is the correct disposition — the remedy is a seat discipline @human is
already reasoning about.

### THE REVERT — complete

```
git diff --name-status 00e133a 956919c
A  docs/tasks/T-138-s1-…  A  docs/tasks/T-138-s2-…
A  docs/tasks/T-138-s3-…  A  docs/tasks/T-138-s4-…
M  docs/tasks/T-138-the-read-first-set-has-three-spellings.md
```

**Five paths. Zero outside `docs/tasks/T-138*`. Zero under `method/`,
`CLAUDE.md` or `AGENTS.md`.** Nothing built to the wider scope survives.

### SUITES — I RE-RAN THEM MYSELF, and one failure is NOT this lane's

Exits read unpiped from `$?`. Port **14691**, re-probed with `lsof` on both
stacks immediately before binding (16:55:42Z, no listener). Port 1420 read
once with `lsof` only: the human's app, pid 19746 on `[::1]:1420`,
untouched.

| command | from | exit | mine | lane's |
|---|---|---|---|---|
| `npm run build` | `lib/parser/` | **0** | — | — |
| `npx vitest run` | `lib/parser/` | **0** | **290/290**, 13 files | 290/290 ✓ |
| `npm run build` | `app/` | **0** | — | — |
| `npm test` | `app/` | **0** | **1013/1013**, 47 files | 1013/1013 ✓ |
| `npm run typecheck` | `tools/e2e/` | **0** | — | — |
| `npm run lint:tokens -- --selftest` | `tools/e2e/` | **0** | — | — |
| `npm run lint:tokens` | `tools/e2e/` | **0** | TOKEN 138 · CONTROL 775 | identical ✓ |
| `npm run lint:docs` | `tools/e2e/` | **0** | *"every live task card's frontmatter parses, with a legal status"* — the four new cards included | 0 ✓ |
| `NPUTER_E2E_PORT=14691 npm test` | `tools/e2e/` | **1** | **193/194 — 1 failed** | 194/194 at `64b939e` |

**THE ONE FAILURE IS MACHINE STATE CREATED 23 MINUTES AFTER THIS LANE
FINISHED, AND I AM NOT ATTRIBUTING IT HERE.**
`brief.spec.ts:706` — *"a brief assembled at this ref names the lanes the
repository holds, and no others"* — fails on
`expect(rendered).toContain("T-141 touches:")`. Re-run alone: **22 passed,
1 failed, the same single assertion.**

- A worktree `/Users/ujju/Projects/nputer-T-141` on `task/T-141-lane`
  exists **now**; it did not exist at **16:42:54Z** when I began.
- `docs/tasks/T-141-*.md` is **absent at this lane's tip `956919c` AND at
  its base `00e133a`**, and present on `main` at `2a922ce` — the T-141
  dispatch commit, **19:50:07**, twenty-three minutes after this lane's tip
  at **19:27:29**.
- So the base tree fails this assertion identically. **The lane inherited
  the condition; it could not have caused it.**

**AND IT IS A REAL DEFECT IN SOMEBODY ELSE'S FILE, WORTH NAMING RATHER THAN
SHRUGGING AT.** `brief.spec.ts:706` joins a **machine-wide** fact — the
worktree list — to a **per-checkout** fact — the card index at this ref.
The moment a newer lane is dispatched, **every older live lane's e2e suite
reds**, in a way no lane can fix from inside its own fence. That is
`T-132-s6`'s shape one file over: *ports are machine-wide while rule 4
partitions by CHECKOUT.* It belongs with `T-138-s3`, which already holds
`[tools/e2e]`.

### THE ACCEPTANCE CRITERIA

1. **Three spellings → one, authority named.** **RETRACTED BY @HUMAN
   MID-LANE**, not dodged: *"keep the reading list the same for now, just
   add roadmap to orchestrator"*, landed on `main` at `db4c903` after this
   lane was cut. The lane recorded the retraction with its ref and re-cut
   no seat's list. **Correct handling of a criterion the human withdrew.**
2. **Product-shaped entry, with what makes it product-shaped.** MET, and
   argued from a property rather than a filename: derived from spec names,
   therefore false the moment a body reds.
3. **The 163 EVALUATED, not assumed, at your own ref.** MET, and this is
   the best work on the card — 163 / 170 / 194 are three answers to three
   different questions, and the ruling on *who keeps the summary true* is
   answered exactly as asked: **the generator does, and what gets reviewed
   is the generator.**
4. **`CLAUDE.md` owned, or plainly stated to stay unowned and why.** MET —
   and it **refutes the card's own framing**, which is the honest move.
   85% of the tracked tree is in no component. Unownedness is the norm,
   not an anomaly. What the card wanted was a fence, and `T-134` delivered
   it; this card is that mechanism's first consumer, and its fence expanded
   to exactly one path with an empty `unusable` list and held for a lane.
5. **No gate built.** MET, trivially — the diff contains no code.
6. **Reading cost before and after.** MET, with both numbers and the ratio.

### THE THREE THINGS I WAS ASKED TO RULE ON

**THE SILENT DRILL IS CORRECT.** The clause is *"this card may add no test
body — if so, say so explicitly rather than leaving the drill silent."* The
lane said so explicitly. I verified the diff is five markdown files with
**no new or changed assertion anywhere**. A poison drill mutates an
assertion to prove the suite would catch it; with no assertion in the diff
there is nothing to poison, and poisoning somebody else's would prove
nothing about this card. **The lane obeyed the clause exactly as written.**

**DECLINING `T-133-s3` IS CORRECT, AND THE CITATIONS ARE EXACT.** I read
both. `orchestrator.md` step 2: *"Triage suggested tasks… **You are the
ONLY role that creates status: planned tasks.**"* `executor.md` step 5:
*"…file it as a status: suggested task… then let it go… suggestions never
expand your scope."* Promoting a suggestion IS creating planned work, and
one file says in as many words that one other seat may do it. **A free
fence is not a mandate.** An executor taking a card because its fence
happened to cover the file would be building work nobody dispatched —
which is the precise failure `executor.md` step 5 forbids. Flagging it
loudly, with the note that the file may not be free again soon, is the
whole of what the seat could properly do.

**THE `touches:` SHORTFALL IS A DISPATCH DEFECT, CORRECTLY DISCLOSED — it
is both, and the lane's conduct is not at fault.** Measured: root
`CLAUDE.md` and `AGENTS.md` are byte-identical (sha256
`0f0393da…c76a78e8` for both); `AGENTS.md` is not in the fence;
`deriveReadFirst` files a FOUND finding when the twins disagree
(`dispatch-brief.mjs:1120–1127`), and today reports **0 findings only
because they agree**. Editing one twin inside this lane would have
manufactured, in this lane, the exact divergence the card exists to close —
and `AGENTS.md` is additionally one of `token-scan.spec.ts:106`'s seven
planted roots while `CLAUDE.md` is not. **A fence that names one of two
files which must move together is an unsafe fence.** The executor's correct
response is to decline the edit and prove why, which it did by measurement,
and to route the adapter work to a card whose fence carries both twins —
`T-138-s1` expands to include both. **Defect belongs to the dispatch;
disclosure belongs to the lane, and is exemplary.**

### TWO DEFECTS IN THE RECORD — NOT REJECTION-LEVEL, AND THEY MUST BE FIXED AT CHECKPOINT

This card opens *"every claim below is a command anyone can re-run."* Two
claims in its pre-dispatch half no longer survive that invitation, and the
lane appended 419 lines without amending either.

- **`grep -c ROADMAP CLAUDE.md` returns **3** at this lane's base, not the
  **0** the card states at line 46** — and the table two lines above it
  still shows the root adapter reading *STATE, ARCHITECTURE, CONVENTIONS*.
  `6a6bc87` (13:12:47) moved both root adapters and `orchestrator.md`
  **five hours and forty minutes before dispatch** at 18:53:11. (My brief
  said "1, not 0, twelve hours earlier"; the measured answers are **3** and
  **5h40m**.) The card's central table was already stale when it was
  dispatched.
- **The verification clause names a reader that does not read the file, and
  claims the naming was *"derived, not assumed"***. It is not derived; it
  is false. It sent me to `interview-chat-dom.test.tsx`, where `CLAUDE.md`
  appears only inside a fixture string.

**Why these do not reject.** Neither sentence is the lane's; both are the
architect's pre-dispatch text describing a failure that genuinely occurred
in that state. The correcting facts are present in the same file — the
notes' own byte-identity table shows the root pair carrying ROADMAP, and
the SUITES AND GATES section names the three real readers. **No routed
figure depends on either.** Leaving an original spec intact and appending
the correction with refs is a defensible archive discipline.

**Why they must still be fixed.** A record card's top half is what later
cards will quote. A present-tense re-runnable command that returns a
different answer, and a verification instruction that misdirects the next
reader, are exactly the defect class this card exists to name. **Mark the
pre-`6a6bc87` half as historical with its ref, and correct the reader to
`select-board.test.ts:1119`.** Neither touches a routed card.

### WHAT I TOOK ON THE LANE'S WORD

Said plainly, because the card asked for it.

- **The e2e run at `64b939e` reporting `Running 194 tests` / `194 passed`.**
  I could not reproduce it at that ref. I derived 194 arithmetically from
  the source instead, got 194, and my own run at the tip printed
  `Running 194 tests`. `6a6bc87` independently reports 194/194. **The
  figure is corroborated three ways; the specific run is not mine.**
- **"The suites were re-run at the final tip and the numbers are
  unchanged."** I re-ran them at the tip myself and matched every number —
  so the claim is true at my ref, though I did not witness the lane's run.
- **The `deriveReadFirst` disagree-branch firing.** I read the code and
  confirmed the agree-branch produces 0 findings today. I did not force the
  twins apart to watch it fire.
- **The base card's "16 merges and 100 done cards" and the `T-104` ruling
  SEVEN citation.** Pre-dispatch claims, not restated by the lane. **Not
  re-derived by me.**
- **`arch`'s live D2.** `graph.json` carries `unresolved: 1` at this ref.
  Per my brief it is T-139's benchmark and the architect is fixing it.
  **Not attributed to this lane, and not investigated.**

### WHY APPROVED

The lane was narrowed mid-flight by the human, reverted work it had already
built, and delivered a record instead. **Every figure in that record that I
could re-derive, I did, and every one matched** — including the two it was
told by its own brief were wrong, where the lane turns out to be right and
the brief wrong. It ran the tool rather than reasoning about the regex; it
asked the canonical module rather than eyeballing the paths; it corrected
its own table and said who caught it; it declined a card sitting free in
its fence for a reason its role file states in as many words; and it named
a dispatch defect against the hand that dispatched it, with evidence rather
than complaint.

**The two stale sentences it did not amend are the architect's, are
superseded one screen down in the same file, and carry no routed figure.**
They are a checkpoint correction, not a rejection.

**APPROVED.**

---

## Integration — integrator claude-opus-5, 2026-08-26

**THE LANE'S NOTES, THE FOUR ROUTED CARDS AND THE VERDICT ABOVE ARE
PRESERVED BYTE-UNTOUCHED.** Everything below is the integrator's, and the
stamp in the frontmatter is the only edit made above this line.

Main-before **`2a922cecfc35e61ab67a20575c5bf792f6a7d7ff`**, lane tip
**`9818f03c2571c3960e85a129404f4bf1fbb243b5`** (derived with `git
rev-parse` — the VERDICT commit, not the last work commit `956919c`),
merge **`6036260c18eedaa46b2e3f5b03d83e6fa485a030`**, checkpoint the
commit that carries these words. Range `2a922ce..6036260`, **5 paths**,
all `docs/tasks/T-138*.md`. Forecast tree `c7c4619` **IS** the merge's
tree, byte for byte, on exit 0.

### THE BRIEF PREDICTED THIS MERGE'S SUITE WOULD RED AND IT DID NOT

The integrator's brief said *"expect 193/194"*, citing the verifier's own
red at `brief.spec.ts:706`. **Measured on main at `2a922ce` BEFORE the
merge, on explicit port 15991: 194/194, exit 0, and that body GREEN.**
Measured again after the merge on port 15992: **194/194, exit 0, green.**

**THE DIAGNOSIS IS RIGHT AND THE BLAST RADIUS WAS OVERSTATED BY EXACTLY
ONE CHECKOUT.** That body joins a MACHINE-WIDE fact (`git worktree list`)
to a PER-CHECKOUT fact (the card index at this ref), which is `T-132-s6`'s
shape one file over. But main is by construction the one tree where every
dispatched card exists — the dispatch stamp lands there before any lane
is cut (`lane-protocol`, *Why the branch carries the dispatch stamp*) —
so **the integration checkout is the one checkout that can never red for
it.** Every older LANE reds; the integrator never does. `T-138-s3` holds
`[tools/e2e]` and is the seat for the repair.

### THE TWO CARD-TEXT DEFECTS ARE **FILED**, NOT REPAIRED — `T-138-s5`

The verdict asked for them to be fixed at the checkpoint. **The rule
answers otherwise, and it answers with one command rather than with
taste**: `integrator.md` rule 3, *"ask whether the thing was true one
commit ago; yes: repair it, no: file it."* Both were false at this
merge's parent `2a922ce` — `grep -c ROADMAP CLAUDE.md` returns **3**
there, and `interview-chat-dom.test.tsx` reads nothing there either — so
the merge REVEALS them and does not write them. Filed as **`T-138-s5`**,
with the timing derived rather than quoted: the card was **TRUE when it
was written** at `b3eaefe` 12:56:24, went false at `6a6bc87` 13:12:47,
and was dispatched at `00e133a` 18:53:11 — **sixteen minutes true, five
hours and forty-one minutes false.** `T-104-s4` is the precedent and the
same seat filed it.

### WHAT THIS STAMP RELEASES, DERIVED THROUGH THE MERGED `fence.ts`

`[CLAUDE.md, method/roles/orchestrator.md, method/roles/executor.md]`
expands to exactly those three paths — `excluded []`, `unusable []`,
`issues 0`. It overlaps **three** open cards and **all three are freed**,
because no live lane holds them: **`T-105`, `T-128`, `T-131`**, each on
the witnesses `method/roles/executor.md` and
`method/roles/orchestrator.md`. **They are freed from THIS card and they
still collide with `T-135` on `method/tasks/TASK-FORMAT.md`**, which is
`building` with no lane — two different questions, and this stamp answers
only the first.

### WHAT WAS NOT DONE, AND WHY

- **No `ADR`.** Nothing supersedes ADR-001–017. The one decision this
  card takes — `CLAUDE.md` stays unowned, its governance is its fence —
  is written at the place it belongs, in the notes above, with its
  measurement (85% of the tracked tree is in no component).
  **ADR-018 is still owed and is still `T-135` Half B's.**
- **`docs/ARCHITECTURE.md` NOT TOUCHED, derived rather than skipped.**
  Rule 3's trigger is *"if any interface moved"*. This merge's five paths
  are markdown under `docs/tasks/`, which no component's `paths:` claims;
  no interface, no component row and no declared edge moves.
- **`T-133-s3` still not taken.** The lane declined it because triage is
  the orchestrator's act; an integrator has less standing, not more.
  `method/roles/orchestrator.md` is released by this stamp and is
  `disjoint` from every `building` card — **but a fence spelled `method/`
  is not**, because `T-135` holds `method/tasks/TASK-FORMAT.md` and
  containment is overlap. Name the file.
