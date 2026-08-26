---
id: T-138
title: The read-first set has three spellings, its designated authority omits the product document, and that authority is in no component, no fence and no graph
feature: F-01
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: [T-134]
touches: [CLAUDE.md, method/roles/orchestrator.md, method/roles/executor.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
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
