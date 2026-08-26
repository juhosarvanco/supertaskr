---
id: T-137
title: The architect cannot reach the analysis the app already has — waves, critical path and worst blocker are pure, one import from portable, and blind to the live lanes
feature: F-04
milestone: 4
priority: 4
size: M
status: verifying
blocked_by: [T-134]
touches: [lib-parser, app-map, tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human, 2026-08-26:** *"'what is dispatchable, in what order, given the
live lanes' — this is a core feature of our product. The architect session
needs precise knowledge of the technical roadmap, task list, task priority
and dispatch order, and it needs to be able to update and adapt as new
tasks are added, and to plan and generate new tasks as development moves
forward."*

## MOST OF THIS IS ALREADY BUILT, AND THE CARD IT REPLACED SAID OTHERWISE

**The first draft of this card claimed the derivation did not exist. It
does.** `app/src/architecture/task-waves.ts` — C-12, `app-map` — already
computes, and its own header says *"Everything here is PURE"*:

| it already has | export |
|---|---|
| dependency waves over `blocked_by` | `layerWaves` |
| **the critical path**, longest chain, CPM sense | `criticalPath` |
| how much each card holds up, transitively | `transitiveHolds` |
| **the worst blocker** | `worstBlocker` on the model |
| **whether a card is dispatchable** — `ready \| waits \| blocked \| underway` | `readSchedule` → `ScheduleState` |
| the sentences the pane renders | `criticalPathText`, `worstBlockerText`, **`readyNowText`** |

**`ready` IS "dispatchable", and `worstBlockerText` is the `WORST BLOCKER
T-065` @human saw in the app weeks ago.** F-06's ROADMAP entry already
claims this: *"the tasks lens lays the board's cards out in dependency
waves over `blocked_by`, with a critical path and a worst blocker — so
F-06 now answers 'what is holding the release'."*

**So this card is an EXTRACTION plus ONE new dimension plus a CONSUMER.
It is not a construction, and anyone who scopes it as one will rebuild
what exists.**

## Exactly what keeps it out of a terminal — measured, both of them

**ONE: a single app-local import, used on a single line.**

    task-waves.ts:2    import { rejectedVerdictCount } from "@/lib/verdicts";
    task-waves.ts:641  rejectedCount: rejectedVerdictCount(task.sections.verdicts),

Everything else it imports is `@nputer/parser/pure` — already the shared
model. **One function, one call site, is the whole of what pins a pure
module inside a React app.**

**TWO: it is blind to the live lanes.** `grep -cE "worktree|lane|fence|touches"`
over that file returns **0**. It answers *"what is unblocked"* and cannot
answer *"…and free to start right now"*, because the fence term does not
exist in it. **That half is genuinely new and is the reason this card
is not merely a file move.**

## Acceptance criteria

- **THE PURE ANALYSIS SHALL MOVE, NOT BE COPIED.** One implementation
  (T-057). The map pane SHALL import what it used to own, and this card
  SHALL state what its `import` line became. **IF `rejectedVerdictCount`
  cannot follow, THEN pass its result in rather than reaching for it** —
  a pure function does not import a lens.
- **THE LANE TERM SHALL BE ADDED AND SHALL BE THE ONLY NEW ANALYSIS.**
  A card is startable iff its schedule reads `ready` **and** its fence is
  disjoint from every live lane's. **Fence disjointness comes from
  `T-134`'s expansion over paths, which is why that card blocks this one**
  — token comparison answers this wrong on 25 live pairs.
- **THE LANE LIST SHALL COME FROM `git worktree list` FILTERED ON THE
  BRANCH, NEVER THE PATH**, and SHALL be a LIVE fact: timestamped, never
  stamped with a commit. `T-133` built that provenance machinery and was
  rejected once for getting it wrong on three lines — **reuse it rather
  than restating it.**
- **THE TERMINAL CONSUMER SHALL WRITE NOTHING** and SHALL emit, in
  priority order: what is startable now; what is merely unblocked but
  fenced, **naming the lane that holds it**; what is blocked, **naming the
  unmet blocker**; and the critical path and worst blocker as the pane
  already computes them. **"And WHY the rest are not" is owed to the
  terminal exactly as `T-111` owes it to the screen.**
- **`blocked_by` SHALL NOT BE TOUCHED, CLEARED OR "REPAIRED".** It is a
  DECLARATION and the app has always resolved it correctly.
  **`T-136` was rejected for proposing otherwise**, and the architect
  destroyed four accurate declarations acting on the same false premise
  before @human's question surfaced it. Dangling blockers measure zero.
- **THE ROADMAP DIMENSION SHALL BE REPORTED, NOT INVENTED.** `feature:`,
  `milestone:` and `priority:` are already on every card and already in
  the parser's model. **Surface them; do not derive a second notion of
  progress** — `docs/ROADMAP.md` is hand-written prose and this card does
  not make it generated.
- **ADAPTATION IS BY CONSTRUCTION, NOT BY A FEATURE.** Because every
  answer is derived at call time from the cards and the worktree list, a
  card added a minute ago is in the next answer with no bookkeeping.
  **State that as a property and pin it**: a fixture that gains a card
  changes the output with nothing else edited.
- **GENERATION IS OUT OF SCOPE AND SHALL BE SAID SO.** @human named
  planning and generating new tasks in the same breath; that is the
  architect's judgement, not a derivation. **What this card can honestly
  give it is the input** — what is startable, what is held and by whom.
  IF a mechanical gap-finder is wanted THEN route it as its own card.

Verification: headless — `npx vitest run` from `lib/parser/`, `npm test`
from `app/`, `npm test` from `tools/e2e/`, exits **unpiped from `$?`**,
counts derived (Playwright prints `Running N tests`; cross-check it).
**The map pane must keep working** — the extraction's whole risk is a
silent behaviour change in C-12, so its existing bodies are the control
and SHALL be run and stated. **POISON DRILL on every new assertion**,
producer mutated and never the assertion, restores per-path by sha256,
detached worktree **OUTSIDE the repository at a SHORT path**. **Uniqueness
of kill SHALL be measured against the whole suite.** **Build `lib/parser`
before any app suite.** Ask GRAPH REGEN rather than predicting and **ask
again after any write** — this card moves a file between packages, so the
graph will move. **Ports are machine-wide while rule 4 partitions by
CHECKOUT (`T-132-s6`)** — explicit port, re-probed before binding.
@human: none — the requirement is stated; this is its mechanism.

## Implementation notes (executor claude-opus-5, 2026-08-26)

Lane `task/T-137-lane`, worktree `/Users/ujju/Projects/nputer-T-137`, cut
from `00e133a`. **Every figure below is measured at this lane's own ref
and names it.** Main moved twice while this lane ran (`00e133a` ->
`db4c903` -> `ae92f67`), so no figure here is stated against "main".

### What changed, and where each thing went

| path | what |
|---|---|
| `lib/parser/src/task-waves.ts` | **NEW.** The pure schedule, MOVED out of the map pane. |
| `lib/parser/src/lanes.ts` | **NEW.** The lane term — the only new analysis. |
| `lib/parser/src/index.ts`, `pure.ts` | both new modules exported from both barrels |
| `lib/parser/test/task-waves.test.ts` | **NEW**, 8 bodies — the DELTA only |
| `lib/parser/test/lanes.test.ts` | **NEW**, 13 bodies |
| `app/src/architecture/task-waves.ts` | 838 -> 323 loc: geometry + ink kept, analysis re-exported |
| `tools/e2e/scripts/dispatch-order.mjs` | **NEW.** The terminal consumer's derivation. |
| `tools/e2e/scripts/brief.mjs` | a `--dispatch` arm; `main()` is now async |
| `tools/e2e/tests/dispatch-order.spec.ts` | **NEW**, 11 bodies |

Ten paths, all inside `[lib-parser, app-map, tools/e2e]`. **`TasksLens.tsx`
did not have to change at all** — the re-export keeps the pane's import
list byte-identical, which is also what keeps `app/test/**` (C-05,
`app-shell`, outside this fence) untouched.

**THE ONE IMPORT, AND WHAT ITS LINE BECAME.** `task-waves.ts:2` was
`import { rejectedVerdictCount } from "@/lib/verdicts";` and
`task-waves.ts:641` spent it. That import **stayed in the app** and the
call site became the ARGUMENT:

    selectTaskSchedule(model, {
      rejectedCountOf: (task) => rejectedVerdictCount(task.sections.verdicts),
    })

The parser's default is `() => 0`. `verdicts.ts` is C-16 (`app-shell`),
which this fence cannot reach, so "pass its result in" was the criterion's
own second branch and not a preference.

**WHAT DELIBERATELY DID NOT MOVE:** the geometry (card boxes, wave pitch,
elbow routing, `layoutWaves`) and the ink (the Tailwind tables,
`taskCardVisual`). A parser that shipped `bg-status-planned` would be a
view with a library's name. The pane now gets `layering` on the model and
lays out what it never recomputed.

### The lane term — the new half

`lanes.ts` is the AND: a card is startable iff its schedule reads `ready`
**and** its fence is disjoint from every live lane's. It imports
`expandFence`/`compareFences` and contains **no path comparison, no
normalisation and no slug table**. Seven states, each with a reason
SENTENCE naming the lane, the shared path, the unmet blocker or the
unresolved token:

`startable` · `own-lane` · `fenced` · `unfenceable` · `waits` · `blocked`
· `underway`.

- **`unfenceable` is `compareFences`'s third verdict, carried and never
  folded.** `T-111` could not express it because its vocabulary is closed
  at six by its own criterion 1. This card is under no such constraint.
- **`own-lane`**: a card is never fenced out by the lane built to build
  it. Without it the tool tells a session it may not do its own job.
- **The COARSE-fence clause survives the migration.** `FenceWitness` is
  `{left, right, path}` and carries no component ids — `T-111-s5` called
  that "deleting this card's own headline". It does not have to be
  deleted: a witness names its two RAW tokens and a token knows the
  components it resolved through, so `witnessComponents(a, b, w)` joins
  them back. **The provenance was never missing; it was one join away.**

### The consumer

`node tools/e2e/scripts/brief.mjs --dispatch`. Writes nothing. Reuses
T-133's `laneSpellings`/`laneWorktrees` (filtered on the BRANCH, with the
pattern READ off the CONVENTIONS lane bullet) and its
`treeProv`/`liveProv`/`value`/`render`. **The worktree list is stamped
LIVE — a time and a host, never a commit.** That is the exact shape T-133
was rejected for, and it is pinned in both directions (arm A15).

**`tools/e2e` declares no dependency on `@nputer/parser`** (ADR-011
family; its own manifest says it "imports neither app nor parser"), so
the parser's BUILT entry is loaded by relative path — the same file
`preflight.ts` already asserts into existence for this package — and a
missing build REFUSES loudly at exit 3 rather than falling back to a
fourth spelling of the fence rule. Declaring the dependency properly is
`T-137-s7`, not a decision made from inside a lane.

**THE ORACLE IS THIS CONSUMER'S OWN CONTRIBUTION.** `expandFence`'s
`knownPaths` is by its own doc *"the ONLY way this module can tell a bare
directory token from a word that names nothing"*, and a board has no
filesystem. A terminal does. `knownPathOracle()` supplies every tracked
path **and every directory prefix of one** — the prefixes are load-bearing,
because `git ls-files` names files and `docs` never appears in it.

### The measurement that is the card's own argument

Derived at `000273e`, 2026-08-26, on `Mac.lan`:

    drawn cards                                138
    ready on blocked_by alone                   31
    startable once the lanes are counted   5 -> 20

**Both readings are of the same tree.** At 16:14 UTC three lanes were live
(T-137, T-138, T-139) and **5** cards were startable. At 16:46 UTC T-139's
worktree had been removed by someone else and the same command at the same
ref answered **20**, with nothing edited and nothing regenerated. That is
"adaptation is by construction" observed rather than asserted — and it is
also why the lane list must be LIVE-stamped: the tree did not move.

### THE RULING ON THE `fence.ts` MIGRATION, with a fresh measurement

**`T-111`'s decline stands for the BOARD, and this card does not overturn
it.** Re-measured at `000273e` through the merged `fence.ts` — a fresh
run, not T-111's numbers carried:

    raw touches: tokens on the board                          27
    tokens unresolvable WITHOUT an oracle                      3   ci, docs, method
    tokens unresolvable WITH    an oracle                      1   ci
    carriers of all three                            T-054 ONLY, and T-054 is `done`

    ALL fence-carrying cards        151    11 325 pairs
      no oracle    overlapping 3458   disjoint 7751   unusable 116
      with oracle  overlapping 3492   disjoint 7751   unusable  82

    OPEN fence-carrying cards        38       703 pairs
      no oracle    overlapping  322   disjoint  381   unusable   0
      with oracle  overlapping  322   disjoint  381   unusable   0

**THREE THINGS THIS MEASUREMENT SAYS THAT T-111'S DID NOT.**

1. **Over the set a dispatch can actually reach — cards that are
   `planned`/`building`/`verifying` and carry a fence — `unusable` is
   ZERO, with or without an oracle.** T-111 measured over all 147
   fence-carrying cards and got 113; the figure at this ref over all
   **151** is **116**, and it is not the number that governs a dispatch.
2. **THE ORACLE CAN ONLY ADD OVERLAPS, NEVER REMOVE ONE.** `disjoint` is
   **7 751 both ways, identically.** The 34 pairs the oracle resolves all
   move `unusable -> overlapping`. So supplying it is safe in the only
   direction that matters: it cannot turn a real collision into a green
   light. **This is the property that makes the oracle worth adding, and
   nothing had stated it.**
3. **The board should keep its copy, and here is the sentence to act on:**
   *import `fence.ts` into `board-model.ts` only in the same card that
   opens the disposition vocabulary to a seventh value and gives
   `selectDispositions` a `knownPaths` parameter its caller can fill —
   because `unusable` is only expressible with the seventh value, and the
   oracle is only fillable by a caller with a repository.* Both are
   criteria changes; an executor may not make them from inside a lane, and
   T-137's own criteria do not authorise them either. **The clause T-111's
   repair pinned is NOT a reason any more** — `witnessComponents` recovers
   the component ids from the tokens, and this card ships it. Routed as
   `T-137-s5`.

### `T-111-s7`, RE-DERIVED rather than inherited

At `000273e`, sites that RESOLVE a `blocked_by` id against the board:
**FOUR**, not three — `lib/parser/src/validate.ts:135`,
`lib/parser/src/task-waves.ts` (`readSchedule`'s `statusOf`, moved here by
this card), `app/src/lib/board-model.ts:1136`, and
`app/src/lib/task-detail.ts:184`. Sites that deliver a verdict about
whether the blocker BINDS: **TWO** — `readSchedule` and
`selectDispositions`. `task-detail.ts` resolves the id only to say whether
it EXISTS, which is why `s7`'s "three" is defensible and its "two" is
exact. **This card reduced neither count.** It moved ONE resolver from
app-local to shared, so the pane and a terminal now read the same one; the
board's remains separate for the reasons in the ruling above.

### `blocked_by` was READ and never repaired

`readSchedule` reads the declaration and rules on it; nothing in this
diff writes it. Pinned: `a blocker naming NO card carries no status and is
never in flight` asserts the record comes back exactly as written.
Dangling blockers on the live board at this ref: measured by the parser as
part of `--dispatch`, and the report names every unmet blocker rather than
folding it.

### GENERATION IS OUT OF SCOPE, AND THE COMMAND SAYS SO

The report's last three lines are notes, not values: *it does not plan and
it does not generate cards. That is the architect's judgement, not a
derivation. What it gives that judgement is the INPUT.* @human named
planning and generating in the same breath as the derivation; a mechanical
gap-finder is its own card if it is wanted.

### THE BYTE BUDGET IS EXCEEDED BY THIS LANE, AND THE HEADLINE FIGURE HIDES IT

**This is the most important thing in these notes for whoever integrates.**
`index --check` at this lane's ref is exit 1 and reports
`stats.truncated_files None -> Some(1)` with
`app/src-tauri/tests/agent_runner.rs (symbols 125 -> 0)`. Measured file by
file against a detached scratch worktree at the base commit, using this
lane's own built indexer:

    tree                                              bytes  files  symbols  truncated
    base 00e133a                                    989 181    183     2101   no
    + the app re-export and both barrels             976 473    183     2081   no
    + lib/parser/src/task-waves.ts                   992 929    184     2105   no   <- 7 071 left
    + lib/parser/src/lanes.ts                        968 081    185     1996   YES
    + lib/parser/test/task-waves.test.ts             970 276    186     1999   YES
    + lib/parser/test/lanes.test.ts (whole lane)     973 194    187     2004   YES

**THE TIPPING FILE IS `lib/parser/src/lanes.ts` AND IT IS AN ORDINARY
FOUR-HUNDRED-LINE MODULE.** `max_graph_bytes` is `1_000_000` at this
lane's base, read out of `crates/nputer-index/src/lib.rs:79`.
`apply_budget` drops the most expensive symbol block until the document
fits.

**AND `T-139` MERGED WHILE THIS LANE RAN AND RAISED THE CEILING, WHICH
CHANGES THE VERDICT AND NOT THE MECHANISM.** At `ae92f67`, main's
`max_graph_bytes` is **`1_040_000`** (`:134`). Re-derived exactly — the
serialisation was verified to reproduce the committed graph byte for byte
at indent two plus a newline, 989 181 = 989 181:

    agent_runner.rs symbol block         125 symbols = 38 862 bytes
    this lane's graph, TRUNCATED                    973 194
    this lane's graph, UNTRUNCATED                1 012 056
      against 1_000_000 (this lane's base)   12 056  OVER
      against 1_040_000 (main at ae92f67)    27 944  of headroom

**SO THIS LANE NO LONGER OVERFLOWS ONCE IT MEETS MAIN, and the integrator
should confirm that at its own ref rather than trusting either figure.**
The mechanism below holds at either ceiling.

**AND THE BYTE COUNT GOES DOWN WHEN IT OVERFLOWS — 992 929 -> 968 081.**
A checkpoint watching usage as a percentage reads **96.8%** and concludes
the budget is fine. The overflow is visible ONLY in `stats.truncated_files`,
which `index --check` prints, `arch` does not report, and
`docs/STATE.md`'s byte-budget section does not track. STATE's own sentence
— *"THIS ONE CANNOT SAY ONE [more merge]"* — was right, and this is the
merge that goes over. Routed as `T-137-s2`; it is `T-139`/`T-140`'s
subject and this lane is its first live instance.

**AND `T-139`'s CHECKPOINT ALSO REGENERATED THE GRAPH**, so the base-commit
staleness below is very likely already closed on main. **It was not
verified**, and the reason is itself the finding: checking main's graph
needs main's OWN indexer, because a check run with this lane's older
binary can report a FALSE stale on a tree whose fresh index sits between
the two ceilings — and this lane may not build in that checkout.

### THE GRAPH ON MAIN WAS ALREADY STALE BEFORE THIS LANE EXISTED

Derived by running this lane's indexer against a detached worktree at
`00e133a` with none of this lane's files: **exit 1**, one file,
`app/test/architecture-dogfood.test.ts (content, loc 1974 -> 1979)`, and
**no truncation**. `6dc5757` edited that file after the T-111 checkpoint
committed the graph at `7fd6ffb`, and no regen followed. `docs/STATE.md`
says the graph is regenerated and current and that nothing is broken.
Routed as `T-137-s3`.

### THE FIXTURE RECONCILIATION, DERIVED AND NOT PREDICTED

Regenerated in the scratch worktree, then run against it: **exactly three
assertions move, in two files, and both files are `app/test/**` — C-05,
`app-shell`, OUTSIDE this fence.** They are green in this lane because the
suite reads the COMMITTED graph, and this lane commits no graph.

    app/test/architecture-dogfood.test.ts  fileComponent.size   183 -> 187
    app/test/architecture-dogfood.test.ts  ["C-06", 27]      -> ["C-06", 31]
    app/test/map-dogfood-render.test.tsx   "committed graph · 183 files" -> 187

With those three applied and the graph regenerated, the app suite is
**1013/1013 exit 0** — measured, not forecast. **`C-12` does NOT move: it
holds at 18 files, its file LIST is unchanged, and every edge row
(`["C-12","C-06",...]`, `["C-12","C-16",...]`) is unchanged**, because the
extraction leaves a module at `app/src/architecture/task-waves.ts` that
still imports both the parser and `verdicts.ts`. `arch` moves on exactly
two rows (the graph header and C-06's file count); `edges=37`,
`findings=4`, `drift_components=4` are unchanged. Routed as `T-137-s1`.

### The nine routed findings, and which fence each needs

| id | fence it needs | what it is |
|---|---|---|
| `T-137-s1` | `app-shell` | the three assertions this card's merge regen moves, measured |
| `T-137-s2` | `crate-index` | crossing the graph budget makes the byte count go DOWN |
| `T-137-s3` | `docs/architecture/graph.json` | the graph was already stale at this lane's base |
| `T-137-s4` | `app-board`, `lib-parser` | one ORDER for the board and the terminal (`T-111-s5` option a) |
| `T-137-s5` | `app-board` | the board CAN import `fence.ts` — in the card that opens its vocabulary |
| `T-137-s6` | `app-shell`, `lib-parser` | the verdict classifier should follow the schedule |
| `T-137-s7` | `tools/e2e` | the E2E package loads the parser by path because it declares nothing |
| `T-137-s8` | `tools/e2e` | the DOCS GATE speaks for a parser it does not run |
| `T-137-s9` | `tools/e2e` | a `brief.spec` body cannot be green in any older lane |

**Three of the nine are inside this card's own fence (`s7`, `s8`, `s9`)
and none of the three was taken.** They are other cards' machinery and
other cards' pins; a suggestion never expands this role's scope, and
`s9` in particular would mean rewriting an assertion whose card this
session has not read.

### WHERE THIS CARD'S BRIEF AND THIS CARD ITSELF WERE WRONG

1. **The brief said `T-111` measured "113 of 10 731 pairs".** At this ref
   the board has **151** fence-carrying cards, **11 325** pairs and
   **116** unusable without an oracle — and **0** over the open set. The
   brief's own instruction to re-measure is what found it.
2. **The brief said `FenceWitness` carrying no component ids is a reason
   not to import.** It is not, and this card ships the counter-example:
   `witnessComponents` recovers them from the tokens. The two reasons that
   survive are the seventh verdict and the oracle.
3. **The brief said `T-111-s7` re-derives to "three sites resolve a
   blocker id".** Four do, at this ref; the fourth is
   `app/src/lib/task-detail.ts:184`. The verdict count, two, is exact.
4. **The card's own criterion 1 says the analysis SHALL MOVE and the map
   pane SHALL import what it used to own.** Taken literally that would
   have moved the Tailwind ink tables into `lib/parser`. It did not: the
   geometry and the ink stayed, because they are a screen's facts. The
   criterion is right about the ANALYSIS and silent about the line.
5. **The card's verification section says to run `npm test` from `app/`
   and treat the map pane's bodies as the control. It does not say that
   the control's file is outside this card's fence.** `app/test/**` is
   C-05 (`app-shell`), which `T-139` held live for most of this lane. That
   is what forced `unmet` to be ABSENT rather than `[]` on a `ready`
   reading — poison arm A14 proves the naive version reds
   `map-task-waves.test.ts`, a file this lane may not edit.
6. **The brief's four known limits included "it does not stop me being
   stale", and this lane is the worked example.** Main moved THREE times
   while it ran — `00e133a -> db4c903 -> ae92f67 -> 2a922ce` — `T-139`
   merged, its lane was removed, `T-141`'s was cut, and
   **`max_graph_bytes` changed underneath a measurement this card had
   already written down.** Every figure here therefore names its own ref,
   and the two that are functions of MAIN rather than of this tree
   (`max_graph_bytes`, the graph's currency) are stated twice, once at
   each ref.
7. **`npm test` from `tools/e2e/` is exit 1 at this lane's tip, and the
   red is not this lane's.** `brief.spec.ts:706` — *a brief assembled at
   this ref names the lanes the repository holds, and no others* —
   expects `T-141 touches:` and gets `T-141: no live card, fence
   UNKNOWN`. `T-141`'s lane was cut at `2a922ce`, AFTER this lane's base,
   so its card is on main and not in this tree, while `git worktree list`
   is shared across every worktree. **The positive control is in this
   same lane**: the first full run, at 19:21 EEST before `T-141` existed,
   was **204/204 exit 0** on the same tree. **The body cannot be green in
   ANY lane whose base predates a newer lane's card**, which is a
   structural defect in a `tools/e2e` spec rather than a flake. Routed as
   `T-137-s9`. It is inside this fence and was deliberately NOT repaired:
   weakening another card's pin from inside this lane, without that
   card's context, is not a repair an executor makes.
8. **This session wrote two literal `U+0000` bytes** into
   `app/src/architecture/task-waves.ts`, in the `criticalPairs` separator,
   where the committed source carries the six-character escape `\u0000`.
   `T-111-s9` is therefore reproduced by a third hand, in the same
   construct, inside the same week. Caught by `command grep` answering
   `Binary file … matches`, removed with `perl`, and the whole tree
   re-swept with a NUL test that cannot degrade: **exactly 18 NUL-bearing
   tracked files, all icons and fonts, zero source-shaped**, with a
   positive control fired on `app/src-tauri/icons/32x32.png`.
