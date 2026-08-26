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
**CORRECTED AT THE REWORK (`9d0700e`), verdict correction 3: "twice"
contradicts "Main moved THREE times" at item 6 below, and item 6 is
right — `00e133a -> db4c903 -> ae92f67 -> 2a922ce`. It has moved TWICE
MORE since the verdict** (`6036260`/`0551a5e` for T-138, then `4fadf62`,
then `1dbdc63` while this rework ran), which is five in all and is why
the sentence is corrected in place with its refs rather than replaced by
a new number that will be wrong again.

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
| `tools/e2e/tests/brief.spec.ts` | **ADDED AT `1338633`** (the `s9` narrowing) and missing from this table until the rework — verdict correction 2 |

**ELEVEN paths, not ten** (verdict correction 2, applied at the rework
`9d0700e`; the row above is the eleventh). All inside
`[lib-parser, app-map, tools/e2e]`. **`TasksLens.tsx`
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

**THE ALL-SET BLOCK DRIFTED INSIDE THIS LANE'S OWN LIFETIME AND IS LEFT
AT ITS OWN REF** (verdict correction 4, applied at the rework). At the
tip `260a354` the verifier re-derived **160 cards / 12 720 pairs / 122 /
87 / 28 tokens** — moved by the nine `T-137-s*` cards this lane itself
wrote, and moved twice more by `s10` and `s11`. **This card's own rule
— DERIVE THE COUNT AT YOUR OWN REF — applies to this block**, which is
why the `000273e` stamp above stays rather than being overwritten. **The
OPEN-set rows, the ones that govern a dispatch, reproduce exactly.**

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
    this lane's graph, UNTRUNCATED                1 012 056   <- WRONG by 57
      against 1_000_000 (this lane's base)   12 056  OVER     <- WRONG by 57
      against 1_040_000 (main at ae92f67)    27 944  of headroom  <- WRONG by 57

**CORRECTED AT THE REWORK (verdict correction 1, and the arithmetic is
its own explanation).** `973 194 + 38 862` adds the symbol block back to
a document that is STILL CARRYING ITS TWO TRUNCATION FLAGS, and those
flags cost exactly 57 bytes — `"truncated_symbols": true,` (31) plus
`"truncated_files": 1` (25) plus the comma the `"edges"` line gains (1).
The verifier measured both documents:

    delta measured, not added                        38 805
    this lane's graph, UNTRUNCATED                1 011 999
      against 1_000_000 (this lane's base)   11 999  OVER
      against 1_040_000 (main at ae92f67)    28 001  of headroom

**Neither conclusion changes and the 38 862 symbol-block figure is
right.** THE REWORK'S OWN ASK, at `9d0700e` with this lane's binary and
this lane's ceiling: `index --check` is **exit 1**, fresh index **973 197
bytes · 187 files · 2004 symbols · 2105 edges**, `truncated_symbols
Some(true)`, `truncated_files Some(1)`. **The whole rework moved the
graph by THREE BYTES** — ~130 added lines of module — because the
document is pinned at a truncating ceiling, which is `s2`'s finding
demonstrated a second time rather than argued.

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
| `T-137-s9` | `tools/e2e` | **TAKEN AND FIXED** — a `brief.spec` body joined the machine-wide lane list to the checkout's card index |
| `T-137-s10` | `tools/e2e` | **FILED AT THE REWORK** — `--dispatch` computes `underway` and never prints it, so a `building` card's DECLARED fence is invisible |
| `T-137-s11` | `tools/e2e` | **FILED AT THE REWORK** — `fenceLedger` carries R1's own `if (card === undefined) continue`, so `--state` prints `FREE` for ground a live lane holds |

**`s3` IS VERIFIED AND CLOSED** (verdict correction 5): it was filed as
*"very likely gone, NOT verified"* and the verifier verified it — base
`00e133a` exit 1, main `2a922ce` exit 0.

**Three of the nine are inside this card's own fence (`s7`, `s8`, `s9`)
and exactly ONE was taken.** `s7` and `s8` are other cards' machinery and
stay routed. **`s9` was taken after the ARCHITECT reached the same finding
independently and handed the decision to this lane**, on the ground that
`tools/e2e` is this card's fence and nobody else could touch it, that a
new lane reds that pin in every existing checkout at once, and that "what
is dispatchable given the live lanes" meeting a checkout boundary is this
card's own subject one layer over. **The derivation needed no change** —
`dispatch-brief.mjs` has always printed `<id>: no live card, fence
UNKNOWN` and raised a finding; only the assertion was wrong, and the
narrowing ADDS four assertions to a branch that had none. Two producer
arms (A19, A20), both red, both unique, both restored by sha256;
`tools/e2e` is **205/205 exit 0** afterwards with `T-141` live.

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
8. **The red in item 7 was TAKEN, not left routed** — see the findings
   index above. The correction to item 7 is that "not repaired" was true
   when written and false an hour later, and the reason is worth keeping:
   **an executor's scope is set by its fence and by its dispatching role,
   and the second half moved.** The architect's hand-off named the same
   defect, the same mechanism and the same three options this lane had
   already filed, independently — which is what made taking it safe
   rather than hasty.
9. **This session wrote two literal `U+0000` bytes** into
   `app/src/architecture/task-waves.ts`, in the `criticalPairs` separator,
   where the committed source carries the six-character escape `\u0000`.
   `T-111-s9` is therefore reproduced by a third hand, in the same
   construct, inside the same week. Caught by `command grep` answering
   `Binary file … matches`, removed with `perl`, and the whole tree
   re-swept with a NUL test that cannot degrade: **exactly 18 NUL-bearing
   tracked files, all icons and fonts, zero source-shaped**, with a
   positive control fired on `app/src-tauri/icons/32x32.png`.

## Verification — REJECTED

Adversarial verification by a seat that did not build this, at lane tip
`260a354e80a0ab4791a9a72ae02f9bbc7e4899fd` (`git rev-parse`, 8 commits
from base). **BOUNDED READ**: the card was read at base `00e133a` and
**the attack set was written down at 2026-08-26T17:24Z, before the diff,
the notes or any `T-137-s*` file was opened** (36 numbered attacks, from
the eight criteria and the verification clause).

**THE REJECTION IS NARROW AND EVERYTHING ELSE PASSED.** The extraction is
clean, the fence claim holds, the consumer is honest, and this card's own
measurements are exact to the byte. Two findings, one repair, both inside
this card's own fence.

### R1 — THE CARD'S CENTRAL CRITERION IS NOT MET AT THIS REF

Criterion 2: *"A card is startable iff its schedule reads `ready` **and**
its fence is disjoint from every live lane's."*

`readDispatchOrder` (`lanes.ts:292`) drops a lane whose card this checkout
cannot resolve:

    const other = fences.get(lane.taskId);
    if (other === undefined) continue;

So a live lane with no card in this tree **holds nothing**, and the card
is ruled `startable` with the sentence *"…disjoint from every live lane."*
Measured on the live board at this ref, `T-141` live on this machine:

    state of T-071                       startable
    its reason ends                      "…disjoint from every live lane."
    lanesWithNoCard                      ['T-141', 'T-141']
    compareFences(T-071, T-141).verdict  OVERLAPPING
      witnesses  app/index.html, app/src-tauri/build.rs, app/src-tauri/capabilities

Driving the product's own `readDispatchOrder` over one parse of one tree,
varying **only** the lane list:

    A  real lane list (T-137, T-138, T-141x2)   startable 20  fenced 11
    B  minus T-141 (the CARD-LESS lane)         startable 20  fenced 11   <- no change
    C  minus T-138                              startable 23  fenced  8
    D  no lanes at all                          startable 31  fenced  0
    E  same lanes + T-141's real card off main  startable  5  fenced 26

**Fifteen of the twenty are false green** — T-071, T-112, T-125, T-022,
T-035, T-059, T-044, T-087, T-115, T-094, T-114, T-117, T-099, T-100,
T-106 — each carrying "disjoint from every live lane" while a live lane
provably holds it. This is the ORDINARY case, not an exotic one: it is
`T-137-s9`'s own seam, and every lane older than the newest is in it.

The module already has the right state and the right words for this.
`unfenceable`'s own doc: *"no overlap proved, and a token could not be
resolved, so no overlap could be ruled out either. NOT `startable`."* A
lane whose fence cannot be read is that same situation one level up.
`s9` ruled *"THE DERIVATION ITSELF IS ALREADY CORRECT"* — true of
`dispatch-brief.mjs`, and that sentence is what carried this past.

### R2 — THE PIN THAT NAMES THE PROPERTY DOES NOT TEST IT

`lib/parser/test/lanes.test.ts:313` is titled **"because a fence that
cannot be computed is not a fence that is free"** and its body asserts
only `order.lanesWithNoCard` and `order.lanes` — the REPORTING channel.
It never asserts the RULING its title is about.

**Poison arm V1, mine, on the PRODUCER** (a card-less lane yields an
`unusable` hold, so those 15 cards become `unfenceable` instead of
`startable`):

    lib/parser  npx vitest run   exit 0   311/311
    tools/e2e   npm test         exit 0   205/205

**516 bodies, zero kills.** The choice that decides 15 of 20 live answers
is unpinned in BOTH directions. Restored by sha256 to a byte-identical
file. This is the A17 shape — a body on the helper while the call site
goes unpinned — surviving in the same lane, one commit after `000273e`
repaired the other one.

### THE EXTRACTION IS CLEAN — the control, run at BOTH refs

The card's stated whole risk is a silent behaviour change in C-12. It did
not happen.

    app npm test @ base 00e133a   47 files  1013/1013  exit 0
    app npm test @ tip  260a354   47 files  1013/1013  exit 0

    map-task-waves.test.ts        50 / 50      <- the ONLY file that reaches
    map-tasks-lens-dom.test.tsx   29 / 29         the moved analysis
    map-dogfood-render.test.tsx    8 /  8
    map-visuals.test.ts           41 / 41

`app/test/**` is **untouched by this lane** and `map-task-waves.test.ts`
is byte-identical at both refs (sha256 `1c991adc…`), so those 50 bodies
are the same bodies executing the moved implementation through the
re-export. That is a real control, not an unchanged total.

Also verified: **no duplicate implementation** — not one moved symbol is
defined in `app/src/architecture/task-waves.ts`; `tsc` + `tsc -p
tsconfig.test.json` + `vite build` exit 0.

**FOURTEEN APP BODIES ARE RED IN A FRESH WORKTREE UNTIL `npm run build`
RUNS** — "no build output at …/app/dist/assets". Node's precondition, not
a verdict, the same class as the `ERR_MODULE_NOT_FOUND: yaml` trap and
worth the same warning.

### THE ONE IMPORT — the default cannot produce a wrong schedule

`rejectedCountOf` defaults to `() => 0`. `readSchedule(status, blockedBy,
statusOf, self)` never receives it; the only consumer of `rejectedCount`
is `worstBlockerText`'s word (`task-waves.ts:651`). `ScheduleState` is a
pure function of status, `blocked_by` and the board. The default costs one
display word, the tool prints that difference in its own output, and it is
routed as `s6`. **No wrong schedule is reachable.**

### THE FENCE — no second implementation

`lanes.ts` imports exactly `compareFences`/`expandFence` (+4 types). A
mechanical sweep for `startsWith`/`endsWith`/`split('/')`/`normali[sz]`/
`toLowerCase`/`RegExp`/`.test(`/`path.`/`posix`/`resolve(` returns only
doc comments and `join(', ')` in reason SENTENCES. `normalizeFenceToken`
and `slugPathIndex` are never called. T-134's module is the only one.

### RULING ON THE `fence.ts` DISCHARGE — the counter-example holds

`FenceWitness` is `{left, right, path}`; `Fence.tokens[].raw` +
`.components` close the join, and `witnessComponents` does it. **The
reason carried to two lanes as decisive is DISCHARGED.** Re-derived
independently at this tip:

    OPEN fence-carrying cards           38    703 pairs
      no oracle    overlapping 322  disjoint 381  unusable 0
      with oracle  overlapping 322  disjoint 381  unusable 0

**The oracle changes 0 verdicts over the set a dispatch can reach** —
exact. And the decisive property: `disjoint` is IDENTICAL either way
(8732 = 8732 over all pairs); all 35 pairs the oracle resolves move
`unusable -> overlapping`. **The oracle can only ADD overlaps, never
remove one.** Confirmed. The ruling — board keeps its copy until one card
opens the vocabulary AND parameterises `knownPaths` — stands.

### RULING ON `T-137-s2` — routing is correct, and it is worse than filed

Verified at the tip with the lane's own binary, and again with main's:

    lane tip, ceiling 1_000_000   973 194 bytes  2004 symbols  TRUNCATED
    lane tip, ceiling 1_040_000  1 011 999 bytes  2129 symbols  clean
    delta                           38 805        125 symbols  = agent_runner.rs

**The direction is confirmed: data is dropped and the document SHRINKS.**
The merged tree under main's ceiling is `1 020 020 of 1 040 000 (98.1%) -
19 980 left`, no truncation — **`T-139`'s raise did save it by timing.**

`budget_line` (`check.rs:215`) uses `report.fresh_bytes`, the length
AFTER `apply_budget`. Forced empirically (main's binary, ceiling lowered
to 1_000_000 in a scratch checkout, restored by sha256):

    fresh index: 981215 bytes · 2027 symbols
    | ~ stats.truncated_symbols None -> Some(true)
    | ~ app/src-tauri/tests/agent_runner.rs  (symbols 125 -> 0)
    budget:      981215 of 1000000 bytes (98.1%) - 18785 left

**T-139's new number reads "98.1%, 18 785 left" while 125 symbols are
being dropped.** Because `apply_budget` returns only when the doc FITS,
`used > budget` — the branch whose text names the degradation — is
**unreachable except at the floor**, and its only test (`check.rs:462`)
uses `budget = 400`, the absurd case. So the branch that would alarm is
tested only where it cannot occur.

`check.rs` is C-07 `crate-index`, outside `[lib-parser, app-map,
tools/e2e]`. **T-137 cannot fix it; `s2`'s `touches: [crate-index]` is the
right routing**, and the unreachable-branch point belongs on it.

### THE RANGE — by the range rule, endpoints named

`git merge-tree --write-tree 2a922cecfc35e61ab67a20575c5bf792f6a7d7ff
260a354e80a0ab4791a9a72ae02f9bbc7e4899fd` → **exit 0, read from `$?`
BEFORE the substitution** → tree `6f9788711af4dede999b8224c83c71a90bf9d162`.
`git diff --name-only 2a922ce 6f978871` = **21 paths**, 11 under the GRAPH
REGEN trigger. The forbidden two-dot form says **74**.

### GATES — asked, never predicted, and asked again after every write

    index --check @ main 2a922ce   EXIT 0  clean
    index --check @ base 00e133a   EXIT 1  989181/183/2101/2033 BOTH SIDES
    index --check @ tip  260a354   EXIT 1  989181/183/2101/2033 committed
                                           973194/187/2004/2105 fresh
                                           truncated_symbols Some(true), files Some(1)

**The identical-figures trap reproduced at base**: bytes, files, symbols
AND edges all match and the gate still fires, on one file's content
(`architecture-dogfood.test.ts`, loc 1974 -> 1979). **`s3` is TRUE at this
lane's base and CLOSED on today's main** — the card left that unverified;
it is verified here.

Re-asked after each of my four writes; identical every time; every scratch
checkout `git status --porcelain` empty.

    lib/parser  npx vitest run  311/311  exit 0
    app         npm test       1013/1013 exit 0   (after npm run build)
    tools/e2e   npm test  Running 205 tests -> 205 passed, exit 0, T-141 live
                          explicit port 14737, re-probed immediately before binding
    DOCS GATE   exit 0        arch drift exit 0 (findings=4, dangling=0)
    arch cycles exit 1 BY DESIGN, 1 cycle among 13 components, read unpiped

**NUL SWEEP with a positive control** (plain `grep` misses across a NUL,
`command grep -a` finds): **zero NUL bytes in every one of the 21 changed
paths at every one of the 8 commits**, and exactly **18** NUL-bearing
tracked files tree-wide, all icons and fonts — the card's own figure, hit
independently.

### ARMS I RAN MYSELF

    A14'  readSchedule returns `unmet: []` on a READY reading
          -> exit 1, 1 of 1013, UNIQUE, map-task-waves.test.ts
          The absent-not-empty rule IS load-bearing, and its only pin is
          in a file this lane may not edit. Positive control supplied.
    A17   parseProjectFromFiles(boardFiles(root)) -> parseProject(root)
          -> exit 1, 1 of 205, UNIQUE, killed by dispatch-order.spec.ts:161
          The `000273e` repair works and is unique. Confirmed.
    V1    a card-less lane yields an `unusable` hold  (see R2)
          -> exit 0 / exit 0, 0 of 516. Nothing pins it.

All three restored by sha256 to byte-identical files.

### WHAT ELSE I ATTACKED AND FOUND NOTHING

`blocked_by` untouched — every diff hit is a doc comment; no card's
frontmatter field moved. `docs/ROADMAP.md` untouched; no second notion of
progress. The consumer writes nothing (no `writeFile`/`mkdir`/`rm`/
`createWriteStream` anywhere reachable). All four report sections present
and in the criterion's order, lane named, unmet blocker named, generation
declared out of scope in the output itself. Lane list filtered on the
BRANCH: my three DETACHED scratch worktrees are correctly absent from it.
`D` above is the internal control — with no lanes, `startable` is 31,
exactly "ready on blocked_by alone". `s8` reproduced independently: a card
whose `title:` opens with a backtick gives DOCS GATE **exit 0** printing
*"every live task card's frontmatter parses"* while the parser smoke gives
**exit 1 `yaml-error`** on the identical tree.

### WHERE THE BRIEF WAS WRONG

1. **"the four map-pane files at 97/97 before and after"** — that figure
   appears NOWHERE in this lane's documents and does not reproduce. The
   map-pane files count 50, 29, 8, 41, 25, 27, 10, 21, 7, 4, 28, 17; no
   set of four sums to 97. The real control is stronger: `app/test/**` is
   untouched and both refs are 1013/1013.
2. **"992 929 -> 968 081"** are two INTERMEDIATE rows of the lane's
   file-by-file table, not this lane's tip. At the tip it is
   **1 011 999 -> 973 194**.
3. **"the budget line reads 96.8%"** — 96.8% is that intermediate row.
   The lane's actual tip is 97.3%, and the line I forced T-139's own
   reporter to print read **98.1%**. Direction right, figure not.
4. **"untruncated it computes to 1 012 056"** — it is **1 011 999**
   (below).
5. **"that branch had no assertion and now has four"** — the shipped code
   comment and commit `1338633` both say **three**, `s9` says **four**,
   and the literal count on the unresolvable branch is **five** `expect`s
   (two live, three fixture) plus the totality guard. The load-bearing
   half is TRUE: before, there was NO unresolvable branch — every lane was
   required to print `touches:`. **Narrower is strictly stronger here.**
6. **"20 drill arms, one survivor"** — the card records no drill table.
   Only A14, A15, A17, A19, A20 are named, in prose. "20 arms" is not
   verifiable from this lane's own record.
7. The brief's own flagged error is confirmed: **`FenceWitness` carrying
   no component ids is NOT a reason**, and the counter-example ships.

### WHERE THE CARD WAS WRONG

1. **`s2`'s untruncated figure is 57 bytes high.** `973 194 + 38 862 =
   1 012 056` adds the symbol block back to a document that still carries
   the two truncation flags. Those flags cost exactly 57 bytes —
   `"truncated_symbols": true,` (31) + `"truncated_files": 1` (25) + the
   comma the `"edges"` line gains (1). Measured both documents: **38 805**
   delta, untruncated **1 011 999**. So `12 056 OVER` is **11 999 OVER**
   and `27 944 of headroom` is **28 001**. The 38 862 symbol-block figure
   is right; neither conclusion changes.
2. **"Ten paths" (line 147) — there are ELEVEN.**
   `tools/e2e/tests/brief.spec.ts` arrived at `1338633` and was never
   added to the table. "All inside `[lib-parser, app-map, tools/e2e]`"
   stays true.
3. **"Main moved twice" (line 130) contradicts "Main moved THREE times"
   (line 448)** in the same file. Line 448 is right.
4. **The ALL-set fence census has drifted inside this lane's own
   lifetime.** Stamped at `000273e` as 151 cards / 11 325 pairs /
   116 / 82 / 27 tokens; at the tip it is **160 / 12 720 / 122 / 87 / 28**
   — moved by the nine `T-137-s*` cards this lane itself wrote. The card's
   own rule ("DERIVE THE COUNT AT YOUR OWN REF") applies to it. **The
   OPEN-set figures, the ones it says govern a dispatch, are exact.**
5. **`s3` was filed as "very likely gone, NOT verified".** Verified here:
   base exit 1, main `2a922ce` exit 0. Closed.
6. **`lanes.test.ts:313`'s title overclaims its body** (R2).
7. **The card-less-lane finding is emitted once per WORKTREE, not once
   per task id**: `lanesWithNoCard` returns `['T-141','T-141']` and the
   report prints the same sentence twice, because two worktrees hold that
   branch.

### WHAT WOULD CLEAR THIS

Both repairs are inside `[lib-parser, tools/e2e]`. (a) A live lane whose
fence cannot be read must not leave a card in `startable` — `unfenceable`
already exists, is already documented for exactly this, and has zero live
instances. (b) Give `lanes.test.ts:313` the assertion its own title names,
so arm V1 kills. The reason sentence and the `STARTABLE NOW` header must
stop saying "every live lane" while `lanesWithNoCard` is non-empty. Dedupe
the finding by task id while there.

Nothing else found here needs to block: 1-7 above are corrections to
prose and figures, and `s2`/`s3`/`s8` are correctly routed out of fence.

Verifier frontmatter fields left unstamped.

## Rework notes (FRESH EXECUTOR claude-opus-5, 2026-08-26) — after the REJECTION at `62a4364`

Same lane `task/T-137-lane`, worktree `/Users/ujju/Projects/nputer-T-137`.
A different hand from the one that built it, as
`method/tasks/TASK-FORMAT.md` requires of a rejected card. **The verdict
at `62a4364` is the specification and it was read in full before the
diff.** Fix commit **`9d0700e`**; every figure below names the ref it was
measured at.

**THE EXTRACTION WAS NOT TOUCHED.** The verdict ruled it clean and it is
this card's stated whole risk, so `app/src/architecture/task-waves.ts`,
`lib/parser/src/task-waves.ts`, both barrels, `brief.mjs` and
`brief.spec.ts` are byte-identical to `62a4364`. The rework changes four
paths and no more: `lib/parser/src/lanes.ts`,
`lib/parser/test/lanes.test.ts`, `tools/e2e/scripts/dispatch-order.mjs`,
`tools/e2e/tests/dispatch-order.spec.ts`.

### R1 — a lane whose card this checkout cannot read now holds an UNKNOWN fence

`readDispatchOrder` dropped such a lane (`if (other === undefined)
continue`), so a card compared only against it fell through the
`holds.length === 0` branch and came back `startable` carrying the
sentence *"disjoint from every live lane"* — **having never been compared
against it.** The module states the correct principle FIFTEEN LINES ABOVE
the site, about an absent registry: an unreadable input means every token
is *"unresolvable **rather than that every fence is free**"*. It applied
that to tokens and violated it for lanes.

Such a lane now pushes a hold with `verdict: 'unusable'` and a new
`LaneHold.cardMissing`, so the card lands in **`unfenceable`** — the
state that already existed and was already documented for exactly this,
and which had **zero live instances** before this repair.
`lanesWithNoCard` was **computed and only reported**; it now also rules.

**RE-MEASURED HERE RATHER THAN COPIED**, at `62a4364` before the fix and
again after, driving the product's own `readDispatchOrder` over ONE parse
of ONE tree and varying only the lane list. Read
2026-08-26T18:06Z / 18:12Z on `Mac.lan`, `T-141` live and its card only
on main:

    lane list                              before        after
    A  real (T-137, T-141)          startable 23   startable  0   unfenceable 23
    B  minus the card-less lane     startable 23   startable 23   unfenceable  0
    D  no lanes at all              startable 31   startable 31
    E  A + T-141's real card off main    startable  8   fenced 23

**15 of the 23 were provably held** — T-071, T-112, T-125, T-022, T-035,
T-059, T-044, T-087, T-115, T-094, T-114, T-117, T-099, T-100, T-106,
the verdict's own fifteen, id for id.

**WHERE MY MEASUREMENT DISAGREES WITH THE VERDICT'S, AND THE MEASUREMENT
WINS.** The verdict recorded `startable 20 / fenced 11` and E as
`startable 5 / fenced 26`, with `lanesWithNoCard = ['T-141','T-141']`.
At my ref the totals are `23 / 8` and `8 / 23`, and `lanesWithNoCard` is
`['T-141']`. **Nothing about the defect moved; the LANE LIST did** —
T-138 merged and its worktree is gone, and T-141 now has ONE worktree
where it had two. That is this card's own "adaptation is by construction"
observed a third time, and it is why the verdict told the reworker to
re-measure instead of copying.

**A PROVED OVERLAP STILL OUTRANKS IT.** `compareFences`'s lattice is not
re-ordered here — *"a proved overlap outranks an unusable token, because
an unresolved token can only add reserved paths and never remove one"* —
so a card held by a real lane stays `fenced`. The unreadable lane is now
NAMED in that sentence too, so a COARSE-fence override is made knowing
the named overlap may not be the only one.

`lanesWithNoCard` is **deduped by task id** (verdict correction 7); the
HOLDS are deliberately not deduped, because two worktrees on one branch
are two real worktrees.

**AND THE SENTENCE THE VERDICT SAID MUST STOP BEING SAID CANNOT BE SAID
ANY MORE.** `holds.length === 0` now means every live lane WAS compared
and every comparison returned `disjoint`, so *"disjoint from every live
lane"* is unreachable while a card-less lane is live — a property, not a
promise, and arm A1 is what proves it.

### R2 — the pin now asserts the RULING, and the class was swept

`lanes.test.ts:313` was titled *"because a fence that cannot be computed
is not a fence that is free"* and asserted only `lanesWithNoCard` and
`lanes` — the REPORTING CHANNEL. The verifier's producer arm left **516
bodies green and killed nothing.**

The body now asserts the ruling FIRST and the channel LAST, and it has
three siblings: a **positive control** whose board differs from it in
EXACTLY ONE FILE (the lane's own card) with a character-identical lane
list; the **outranking rule**; and the **dedupe**, whose own comment says
in as many words that it is about the channel and why that is honest
there.

**THE CLASS, NOT THE LINE.** The same shape is now closed at the CALL
SITE — `dispatch-order.spec.ts` drives the command's whole path (real
board, real oracle, rendered report) against a lane whose card is on
nobody's disk, with a zero-lane positive control. That matters because a
pin on the helper while the call site went unpinned is what survived in
this very lane once already as arm **A17**. **The sweep for the shape was
run over all three of this lane's test files**: `task-waves.test.ts`'s
eight bodies and `dispatch-order.spec.ts`'s other bodies all assert the
value or the behaviour, not a channel; `lanes.test.ts:313` was the only
instance. And the pre-existing live-board body gained a **cardinality
floor**, because every one of its per-set loops is satisfied by an EMPTY
set and my own change is what could have emptied one — `docs/CONVENTIONS.md`
shape five, caught before it fired rather than after.

### The consumer says which empty it is

`--dispatch`'s card-less-lane line now states the CONSEQUENCE and the
REMEDY, and `nothing is startable` is split: a board fact when no lane is
unreadable, and a **live** fact naming the lane when one is. The
`STARTABLE NOW` header reads *"PROVED disjoint"*. All rendered lines
still pass the provenance floor.

### The drill — one side only, producer never assertion, in TWO detached scratch worktrees OUTSIDE the repository

`/tmp/t137p` (parser arms) and `/tmp/t137d` (e2e arms), both detached at
`9d0700e`, both at ten-character roots — well inside `T-133-s5`'s
116-character threshold. No `CARGO_TARGET_DIR` was needed or set because
no arm compiles Rust. **Every mutation was read back with `git diff`
before its suite ran**, and every restore is proved by sha256 against the
pre-mutation reading, not asserted.

    arm  producer mutation                                  suite      result
    A1   `continue` restored in the card-less branch        parser     exit 1, 3 of 314
    A2   `new Set(...)` removed from lanesWithNoCard        parser     exit 1, 1 of 314 UNIQUE
    A3   the fenced residual clause forced to ''            parser     exit 1, 1 of 314 UNIQUE
    A4   the missing-card clause dropped from the reason    parser     exit 1, 1 of 314 UNIQUE
    A5   EVERY lane treated as card-less (`if (true)`)      parser     exit 1, 9 of 314
    E1   A1's mutation + rebuilt dist                       tools/e2e  exit 1, 1 of 206 UNIQUE
    E2   the consumer's empty-startable branch reverted     tools/e2e  exit 1, 1 of 206 UNIQUE

**A1 AND E1 ARE THE VERDICT'S OWN ARM V1.** The identical producer
mutation that left 516 bodies green now kills **four** bodies across the
two suites, one of them uniquely at the call site. **A5 is the positive
control's control**: it reds the new positive control among nine, so that
body is load-bearing rather than a body that could never fail.

`lib/parser/src/lanes.ts` restored to
`07eb4f4a3b89d1e1489e57f0e2766a31751d45ae56f961b67fa051ab2d1eff50` after
each of A1–A5 and E1; `tools/e2e/scripts/dispatch-order.mjs` restored to
`d0ec5bcaf582cb6871e8171971852a7bd0abcb30ffab7f10192a6ecd4f803849` after
E2. `git diff --stat` empty for the mutated path every time.

**ONE ASSERTION COULD NOT BE POISONED AND IS NAMED RATHER THAN COUNTED**,
per the drill's own rule: the cardinality floor
`expect(ruled.length).toBeGreaterThan(0)` has no independent producer —
its subject is the live board's population, and any mutation that empties
it reds the arithmetic assertion two lines above first. It is a guard
against a FUTURE vacuous pass, not a pin on today's behaviour.

### What the architect handed this lane mid-rework, and why one half was refused

The architect reported what it called **the DUAL of R1** — *"card exists
and says `building`, lane does NOT exist → also no hold → also false
green"* — naming `T-135` (`status: building`, `touches: [crate-index,
method/tasks/TASK-FORMAT.md]`, no worktree) and the three `method/` cards
that would overlap it by containment.

**THE MECHANISM CLAIM IS TRUE AND THE "FALSE GREEN" IS REFUSED.** A
`building` card with no worktree produces no hold, by construction; it is
not a defect. Four of this repository's own sentences rule against
manufacturing one — criterion 2's *"every live LANE's"* with criterion
3's LIVE stamp, `method/roles/executor.md` row 5 (whose two examples are
both of the BOARD under-reporting), `lane-protocol.md` rule 7 as this
repository itself applies it (`T-111`'s branch was KEPT and that
checkpoint still says **"THERE ARE ZERO LANES"**), and `docs/STATE.md`'s
own capitals: *"ONE CARD IS `status: building` WITH NO LANE, AND THAT IS
ALSO ON PURPOSE."* **`T-135-s4` is already filed** recording that this
card's `status:` has no true value. R1 drops a PROVED live writer; this
would INVENT one — the false NEGATIVE `own-lane` exists to prevent.

**The residual is real and is filed as `T-137-s10`**: `--dispatch`
computes `underway` and never prints it, so T-135 appears zero times in
the report and its declared fence is invisible to a reader choosing
between T-105, T-128 and T-131.

**AND CHECKING THE CLAIM FOUND SOMETHING THE HAND-OFF DID NOT NAME —
`T-137-s11`, R1 ALIVE IN A SECOND IMPLEMENTATION.**
`dispatch-brief.mjs`'s `fenceLedger` carries `if (card === undefined)
continue`, the rejected line's own shape, so `--state` prints
`crate-index: FREE` and `app-shell: FREE` for ground `T-141`
demonstrably holds. It is smaller than R1 only because `s9` already made
the tool print *"no live card — board says unknown"* four lines above the
ledger — a verdict word its own report contradicts further up the page.
**It is inside this card's fence and was NOT taken**: `fenceLedger` is
`T-133`'s arm and `T-133`'s pinned output, and this card's item 7 already
ruled that weakening another card's pin from inside this lane is not an
executor's repair. `s9` is the one time that was relaxed, and only after
an explicit hand-off naming that defect. **This hand-off named the other
one.**

### Where the rework's own brief was wrong

1. **"Main has moved since the verdict — T-138 merged (`6036260`,
   checkpoint `0551a5e`). Derive your own range; do not assume."** The
   instruction was right and the figure was already stale twice over: at
   the range derivation main was **`4fadf62`**, and by the gate re-ask it
   was **`1dbdc63`**. Nothing was assumed and the drift is recorded.
2. **"`lanes.ts` around line 293"** — the site is `lanes.ts:292` in the
   verdict and `:293` in the brief. Both point at the same two lines; the
   rejected statement is `if (other === undefined) continue`.
3. **"`unfenceable` … already exists"** — confirmed, and stronger than
   the brief says: it had **zero live instances** before this repair, so
   nothing on the live board exercised it.
4. **The brief's instruction not to propagate the old brief's figures was
   load-bearing.** None of `97/97`, `992 929 -> 968 081` or `96.8%`
   appears in this rework; every figure here was re-derived.
