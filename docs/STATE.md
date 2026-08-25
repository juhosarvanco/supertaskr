# State

Updated: 2026-08-25 by the T-079 integrator (self-integrated, size S).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: TWO LANES ARE LIVE
AND NEITHER IS MOVING.** One is STOPPED and waiting on @human; the other
is waiting on three architect rulings its own card demanded before it was
dispatched. **Nothing on main is broken by this merge** — all three
standing gates were derived and run, and every suite is green except one
known, filed, intermittent watcher flake that fired again here over Rust
this merge never touched (`T-088-s4`, below). The pipeline's next useful
act is a DECISION, not a build.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is a
scratch worktree and not a lane (the T-089 correction in CONVENTIONS).
No detached entry was live at this read; T-079's own `drill-T-079` was
removed before the merge.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-110** | `[app-dispatch]` | **STOPPED — two rejections, escalated to @human** |
| **T-033** | `[docs/architecture/components/, lib-parser, app-map]` | building, and **BLOCKED ON THREE RULINGS IT WAS DISPATCHED WITHOUT** |

**THERE IS NO TIP COLUMN AND THAT IS THE FIFTH MEASUREMENT SAYING SO**
(`b7b4213` removed it; T-010, T-031 and T-123 each confirmed it, and this
turn is the fifth). Between the tips this integrator read at dispatch and
the ones it read at the merge, T-033 moved `25a9e2c` → `9b9472b` and
T-110 `2b20ea8` → `0bdaa24`, with T-031's entry disappearing entirely.
**A live lane's tip is a live-environment fact, not a function of a
tree.** What is stable is WHICH lane holds WHICH fence. For a tip, run
`git worktree list`.

**THE BOARD CANNOT TELL YOU A LANE'S PHASE, AND BOTH LIVE LANES PROVE IT
DIFFERENTLY.** Both cards read `status: building` on disk, derived here.

- **T-110 is not in flight.** It has been REJECTED TWICE by two
  independent verifiers and its circuit breaker has fired
  (`method/tasks/TASK-FORMAT.md`: *"Two rejections → stop; open a room,
  escalate to the human"*). The room is
  `docs/rooms/t110-second-rejection.md`, **open and addressed to
  @human**. Its card still says `building`. **BELIEVE THE ROOM, NOT THE
  STAMP.** Nothing has merged, the lane worktree is intact at the verdict
  commit, and the card is safe to leave sitting.
- **T-033 is not blocked by `blocked_by:` either — that field reads
  `[]`.** Its card carries THREE decisions marked *"at dispatch (ADR-004
  — the registry is the architect's pen; record the picks in this file's
  plan section before dispatch)"* — (1) the umbrella shared-primitive
  story, (2) the non-code D3 story, (3) the ADR-015 one-implementation
  question folded in from `T-014-s1` — **and the plan section records no
  picks.** A lane dispatched without the rulings its own card made a
  precondition cannot finish; that is a dispatch defect, not a lane
  defect, and it is the sibling of `T-123-s10` filed one commit before
  this one. **This is the outstanding @architect item.**

**T-079's OWN WORKTREE IS REMOVED IN THE SAME BREATH AS THIS COMMIT**, in
the order lane-protocol rule 6 fixes (merge, then checkpoint, then
remove), so **`[tools/e2e]` is FREE**. Every other fence in
ARCHITECTURE's slug table is free too — `app-shell`, `app-agent`,
`app-board`, `app-interview`, `crate-index`, `.github/`,
`docs/CONVENTIONS.md`, `method/`. `[app-shell]` has been free since
T-123's checkpoint and `T-088-s4`'s fix is still waiting on it.

## Just completed

**T-079 — an ungated motion utility is a token-lint hit, and the card's
own premise turned out to be wrong.** F-02, milestone 4, size S,
`touches: [tools/e2e]`, **fence never widened**. Built and self-integrated
by `claude-opus-5 @T-079`; `review: self-verified` (size S takes no
verifier — `method/tasks/TASK-FORMAT.md`'s ceremony table). Main-before
**`3f9bef2`**, lane tip **`2c21377`**, merge **`91398f9`**, this
checkpoint after it.

**P6 JOINS `TOKEN_PATTERNS`, AND THE GAP AT P5 IS DELIBERATE** — T-058
owns P5 for the control-byte rule and a pattern id a checkpoint has
quoted is not reused. P6 is reached only by `scanSource`, so it is
STRUCTURALLY incapable of touching the CONTROL corpus: a motion utility
named in a design document is prose. The card's own file is the proof —
it spells `animate-status-pulse` a dozen times and CONTROL is clean at
655 files.

## THE CARD'S PREMISE IS REFUTED, AND THE DEFECT IT DESCRIBES GOT WORSE

T-079's problem statement said Tailwind *"emits a bare rule for every
animation utility alongside the gated one … the ungated class sits
outside it for every motion utility this app has."* **Measured on a
freshly built sheet: false for two of this app's four.**

| utility | declared | written BARE in a source | bare rule in the sheet |
|---|---|---|---|
| `animate-card-rain` | `--animate-card-rain` | nowhere | **absent** |
| `animate-map-teal-wipe` | `--animate-map-teal-wipe` | nowhere | **absent** |
| `animate-status-pulse` | `--animate-status-pulse` | `app/test/genesis-pane-dom.test.tsx` ×4 | **present** |
| `board-rain` | `@utility board-rain` | `app/test/genesis-mount.test.tsx:506` | **present** |

`animate-map-teal-wipe` is the control that settles it: declared, used
and gated exactly like `animate-status-pulse`, and it has no bare rule
because no file writes its name unprefixed. **Tailwind v4 emits utilities
STRICTLY ON DEMAND; a `@theme` key or an `@utility` block emits nothing
by itself.** The two bare ungated rules in the shipped stylesheet are
MINTED BY TEST FILES.

**THE CONCLUSION SURVIVES ITS REASON, AND SHARPENS.** An ungated
`className="animate-status-pulse"` still compiles, paints and ignores
`prefers-reduced-motion` in silence — not because a paired rule was lying
in wait, but because the ungated candidate **mints its own rule on the
spot.** The sheet is therefore downstream of the mistake and no amount of
reading `dist/` can find it. Only a source-level gate can, which is
exactly this card. Routed as **`T-079-s2`**, fence `[app-shell]`, now
FREE.

## Why P6 matches NAMES rather than a shape — a measurement, not a taste

A bare `animate-\w+` rule reds this tree in SIX places, none of them a
violation, and the allowlist is ZERO by card and by plan §5:

- **four** attribute selectors (`"[class*=animate-status-pulse]"`), which
  apply no class — closed by excluding `=` from the start boundary;
- **one** assembled-name hygiene idiom (`"animate-status" + "-pulse"`),
  which this tree uses deliberately so Tailwind's scanner cannot mint an
  ungated candidate from a spec file — closed by the name list, because
  `animate-status` names no utility;
- **one** bare prefix (`"animate-"`) — closed by requiring a name.

Reporting the second shape would push authors toward writing the full
literal, which is precisely the minting hazard `T-079-s2` documents.
**The staleness a list buys is closed LOUDLY:** `motionFloorChecks()`
derives every animation the tracked CSS declares — `--animate-<name>`
theme keys AND `@utility` blocks whose body animates — and reds the
selftest unless each is matched or argued into `MOTION_UTILITIES_OUT`.
Two lists that must agree, the `MUST_TOKEN_COVER` shape one rung up.

**T-028'S HAND-WRITTEN SWEEP IS KEPT, AND THE REASON IS MEASURED RATHER
THAN INHERITED.** P6 structurally cannot see `board-rain`: an `@utility`
whose BODY animates carries no `animate-` prefix, and adding bare
custom-utility names reds `app/test/genesis-mount.test.tsx:506`, where
`"board-rain"` is a needle searched for in built JS. So that sweep is the
ONLY guard over that name, and retiring it would have opened a hole in
the commit that closed one.

## Ranges, every dot count stated, at their own refs

**MAIN ADVANCED SIX FIRST-PARENT COMMITS / 38 PATHS UNDER THIS LANE** —
`25a9e2c` → `5fbfd4e` → `06f26cb` → `6802126` → `0358c0c` → `e239f8c` →
`3f9bef2` — which is T-031's merge and checkpoint, T-110's escalation
room, T-123's merge and checkpoint, and one suggestion file.

    git merge-tree --write-tree 3f9bef2 2c21377 -> tree 291da8aa…, exit 0 (read from $? FIRST)
    git diff --name-only 3f9bef2 <TREE>                        ->  5   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 3f9bef2..91398f9   (THE MERGE'S DIFF) ->  5   the only one that means anything
    git diff --name-only 3f9bef2...2c21377  (THREE dots, pre-merge)  ->  5
    git diff --name-only 25a9e2c..2c21377   (TWO, branch-only)       ->  5
    git diff --name-only 3f9bef2..2c21377   (TWO dots, FORBIDDEN)    -> 43
    git diff --name-only 25a9e2c..3f9bef2   (main's advance)         -> 38

**THE FORBIDDEN FORM OVERSTATES BY 8.6x, THE WORST GAP THIS PROJECT HAS
MEASURED**, and it is pure left-endpoint drift: main advanced **38**
paths from the cut, the branch **5**, `comm -12` over the sorted lists is
**EMPTY**, and 38 + 5 = 43 — the arithmetic that proves the two sets
disjoint. T-031's integrator measured 5.7x on a similar gap; this is
worse because the branch is smaller, which is the shape to expect from a
size-S lane held open across two other lanes' integrations.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned `291da8aa74502e2356984a9301199a88037b80cf`
before the merge and `git rev-parse HEAD^{tree}` returns the same
afterwards. Parents are `3f9bef2` and `2c21377` and nothing else;
**NOTHING WAS WRITTEN INTO THE MERGE COMMIT.**

**AND THE INTEGRATION TURN WAS EXCLUSIVE THIS TIME.** `git status
--short` in the main checkout was read BEFORE anything was written and
showed only the untracked `z` with an empty index — the check `T-123-s10`
asks for, one commit after it was filed, and the first turn tonight to
run under the rule rather than around it.

## THREE standing gates — DERIVED from the merge's own 5 paths

| gate | trigger | on these 5 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **1 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **3 — FIRES**, three suites |

- **GRAPH REGEN — FIRES on ONE path** (`tools/e2e/tests/token-scan.spec.ts`,
  the TS arm) and the gate was **ASKED rather than predicted**, which is
  what that bullet's own standing lesson demands. `index --check --root
  ../..` is **exit 0, CURRENT** at **895 891 bytes · 172 files · 1889
  symbols · 1849 edges** — unmoved from T-123's checkpoint. **NO REGEN
  WAS OWED AND NONE WAS RUN.** `tools/` is `.nputerignore`d, so a diff
  confined there cannot move the graph by construction — but that is the
  answer the gate gave, not a prediction it was spared. T-054 and T-058
  are the earlier worked examples of exactly this case.
- **BOOT GATE — NOT OWED, 0 of 5.** This fence cannot produce
  `app/src-tauri/**`, `app/src/**` or a manifest; derived at the merge
  rather than inherited from the brief.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the merged paths as
  ARGUMENTS, ROOT-RELATIVE, never through `xargs`. **3 of 5 under
  `docs/`, THREE suites owed** — `npm test from app/`, `npm test from
  tools/e2e/`, `npx vitest run from lib/parser/`. `cargo test from
  app/src-tauri/` is **NOT owed by the merge** (its readers are
  `docs/architecture/components`, `docs/CONVENTIONS.md` and a research
  capture, none of them in the merge's diff) — **but it IS owed by this
  checkpoint**, which edits CONVENTIONS; see below. The gate reports 12
  derived readers across 4 suites and **0 frontmatter issues**, with this
  checkpoint's doc writes staged before it ran (`T-010-s10`'s hole worked
  around rather than walked into).

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command, captured on the very next token. Every suite
ran AT the merge and again AFTER this checkpoint's doc writes.

- **app: 958/958 across 46 files**, exit **0**, after `npm run build`
  exit **0**. The bundle was REBUILT rather than trusted: `git merge`
  bumps mtimes the way `git checkout` does.
- **parser: 264/264 across 12 files**, exit **0**.
- **E2E: 145/145**, exit **0**, on scratch port **15107**;
  `npm run typecheck` **0**. The count is 143 + T-079's two new bodies.
- **cargo: BOTH 418 / 0 / 3 at exit 0 AND 417 / 1 / 3 at exit 101**, over
  **15** `test result:` lines and over Rust that never changed. **NOT
  owed by the merge and OWED by this checkpoint** — the derivation
  flipped the moment the CONVENTIONS edit joined the diff, because
  `app/src-tauri/src/agent/kit.rs` reads that file on every `cargo test`.
  That is THE FOUR WALKS' "two live readers outside all four walks"
  clause doing exactly what it was written for, and it is why a
  docs-only checkpoint can owe a Rust suite. **`T-088-s4`'S FLAKE FIRED
  AGAIN — see its own section below.**
- **token lint: selftest 0, lint 0** — clean at **TOKEN 131 / CONTROL
  655**. The selftest reports **65 TOKEN + 4 CONTROL samples, 87
  walk-policy checks, 9 evidence-floor checks** (from 49 / 4 / 71 / 8 at
  `25a9e2c`). **BOTH CORPORA COUNTS ARE PRINTED AND PINNED BY NOTHING** —
  CONTROL went 637 → 639 on this lane's own three docs files and then to
  655 under two other lanes' merges. Derive them at your own ref.
- **`npm run lint:docs` exit 0**, run the way CI will run it.

**THE SHIPPED BUNDLE MOVED, AND NOT BECAUSE OF THIS MERGE.**
`index-C86RloYb.css` / `index-DEkJr3K8.js` (45 061 / 526 423) at
`25a9e2c` are now `index-D41xl3Gz.css` / `index-CNznNhXD.js` (45 180 /
527 994) — T-031's and T-123's work, which touched real bundle inputs.
This merge touches none: `tools/e2e/**` is not bundled and `docs/` is not
a Tailwind source. **Measured on the lane rather than argued**: building
with T-079's card, its two suggestion files and its `token-scan.mjs`
edits in place produced a bundle byte-identical to main's, which is how a
gate that spells `animate-spin` a dozen times proves it mints nothing.

## Documents ticked

- **CONVENTIONS — THE FOUR WALKS' TOKEN row is true again**, and this
  discharges **`T-079-s1`**, filed by the lane that falsified it. The row
  read *"lint TOKEN — P1–P4"* and now reads *"P1–P4 **and P6**"*, with
  the deliberate P5 gap explained where a reader meets it. **THE
  AUTHORITY COLUMN NEEDED NOTHING AGAIN** — it names the four walk
  constants and P6 moved none of them. That is the SECOND signpost in
  this table to go stale in two days (`T-010-s1` was the `.rs` row), both
  caught by the lane that falsified them and **neither by a gate**, so
  the correction records the pattern and asks the next reader to decide
  whether a pattern COUNT belongs in this table at all rather than fix it
  a third time.
- **ROADMAP and ARCHITECTURE need NOTHING, and that is DERIVED rather
  than assumed**: neither file mentions T-079, the token lint or
  `lint:tokens` anywhere — `git grep` over both returns zero hits. A
  tools/e2e gate is below the altitude either document describes.
- **The card** is stamped `done`, `built_by: claude-opus-5 @T-079`,
  `review: self-verified`, with an `## Implementation notes` section
  carrying the refuted premise, the six-mutation drill table and the
  criterion-by-criterion account. `verified_by:` stays EMPTY: size S
  takes no verifier.
- **The lane's two suggestion files stay as filed**, and `T-079-s1` stays
  `status: suggested` with its discharge recorded here rather than being
  silently deleted.

## The poison drill, carried into the record

Detached scratch worktree `drill-T-079` at `b0b886d`, driver and results
files per-lane named, **ONE SIDE ONLY** — every mutation edits the
PRODUCER, never a sample — each read back with `git diff` BEFORE the run
and each restored to sha256 `b666643d…`. **Six mutations, six reds.**

Three are worth carrying forward:

1. **A P6 THAT MATCHES NOTHING LEAVES THE LINT AT EXIT 0.** Neutering the
   pattern reds the selftest at 14 failures and the tree scan stays
   **clean** — because a clean tree has no violation to miss. **Only the
   selftest can tell you the gate broke**, which is the whole argument
   for CI running `--selftest` as a separate first step, and it is now
   measured rather than asserted.
2. **A NAME DELETED FROM THE LIST DELETES ITS OWN CHECK AND STILL REDS.**
   Dropping `card-rain` from `MOTION_UTILITIES` removes its per-name
   floor row — poison shape FIVE, one level up from an assertion — and
   the run reds anyway, against the row derived from `app/src/index.css`,
   which did not move with it.
3. **SHAPE SIX ANSWERED WITH A MUTANT.** Narrowing P6's start boundary
   leaves all nine per-name floor rows GREEN (each scans
   `"animate-<name>"`, which begins right after a quote) and reds four
   SAMPLES that carry a whitespace or variant boundary. The samples are
   therefore not duplicates of the floor rows: they kill a mutant the
   floor rows cannot.

Criterion 4's shape-five guard was proved by DELETION rather than
claimed: removing all five P6 positive samples gives exit 1,
`selftest FAIL: evidence floor — P6 has a positive sample (0)`, because
the floor generates one row per member of the PRODUCTION pattern list.

## THE MERGE FOUND A REAL DEFECT, IN THIS CARD'S OWN NEW LANE BODY

**It was found by running the owed suites after the doc writes, and it
was fixed here rather than shipped.** T-079's end-to-end body planted a
bare motion utility into `app/src/architecture/MapNode.tsx` and restored
every byte — sha256 identical, `git diff --quiet` clean — and **the app
suite went 957/958.** `app/test/map-t1-t2-dom.test.tsx`'s body *"the
build is newer than the sources it is evidence about"* compares `dist/`'s
mtime against four files and that is one of them, so a content-exact
restore that moved the CLOCK fired a stale-build guard on a build that
was not stale (`dist/` 03:50:54, plant target 03:54:34).

**A CONTENT-EXACT RESTORE IS NOT A COMPLETE RESTORE**, and the obvious
fix was not sufficient on its own. `utimesSync` restores mtime and atime
and **cannot restore `ctime`**; `git diff --quiet` answers from the
index's cached STAT INFO rather than from content, so the first call
after a `utimesSync` reports a difference on stat alone and the call
itself refreshes the index — **red, green, green over three consecutive
runs.** An intermittent gate is worse than the bug it replaces.

**THE FIX THAT HELD MOVED THE PLANT INSIDE THE FENCE**, to
`tools/e2e/fixtures/shell.ts`. `tools/e2e` is one of the three
`TOKEN_ROOTS`, so the corpus, the walk and the wrapper path exercised are
identical, and no lint test touches anything under `app/` at all. Four
consecutive green runs after the move. The `utimesSync` is KEPT as the
completed restoration, and the weaker `git diff --quiet` assertion was
dropped in favour of the sha256 — which is what the POISON DRILL bullet
already asks for (*"restoration proved by hash rather than by a clean
`git status`"*), now with the reason written where the next author of a
plant-and-restore body will meet it.

Routed as **`T-079-s3`**: T-058's seven-path control-byte body uses the
same technique over seven first-party roots and restores no clock either.
It is GREEN today because none of its seven targets is currently read by
an mtime guard — a property of which files the guards watch, not of the
technique. **Seven bodies under `app/test/` read mtimes.**

**THE HONEST SHAPE OF THIS**: the lane was green on its own branch and
the defect needed a merge into a tree with the app suite in it to
appear. A size-S card whose fence is one package still reached across two
of them, through a file's timestamp rather than its content — which is
the kind of coupling no fence can express and only a run can find.

## `T-088-s4` FIRED AGAIN — 3 RED IN 7 FULL RUNS, AND IT IS NOT MINE

The parked-then-unparked watcher flake fired at this checkpoint, and it
is **recorded rather than re-run away**. Every failure is the SAME single
body — `docs_watch::tests::startup_arm_watches_the_initial_root`, with
the same `expected a docs-changed emit: Timeout`, now at
`src/docs_watch.rs:1648` (it was 1523 at T-010; the line moved with the
file, the body did not).

| when | full runs | result |
|---|---|---|
| after the CONVENTIONS edit | 2 | **418 / 0 / 3, exit 0** — both green |
| after the final doc writes | 5 | 2 green, **3 red at exit 101**, best-measured **417 / 1 / 3** |
| the named body alone | 1 | **green** |

**THAT IT IS NOT THIS MERGE IS DERIVED RATHER THAN ASSUMED**, which is
the whole reason the finding exists: `git diff --name-only 3f9bef2..HEAD`
contains **ZERO** `.rs` paths, this checkpoint stages zero, and
`app/src-tauri/**` is untouched end to end. The Rust under all seven runs
is byte-identical to what main carried at `3f9bef2`.

**NO OTHER BODY FAILED IN ANY OF THE 15 `test result:` LINES AT ANY
POINT.** Green in isolation, red under the loaded full suite — the same
asymmetry T-010's checkpoint measured, which locates the cause in
concurrency with the rest of the suite rather than in the body.

**WHAT THIS CHECKPOINT THEREFORE CLAIMS ABOUT CARGO, EXACTLY:** the suite
is intermittently red on one known, filed, already-unparked defect, and
green on everything else. That is stated as a RANGE rather than as a
single green, because a single green would be the less true of the two.
The running tally is now **3 red in 6 full runs at T-010** and **3 red in
7 here**, an order of magnitude above the 1-in-8 rate that supported
parking it in the first place. **Its fence `[app-shell]` is FREE as of
T-123's checkpoint, so nothing blocks the fix any more except a
dispatch.**

## The board, derived from disk at this checkpoint

**195 flat task files — 80 done / 41 planned / 41 parked / 31 suggested /
0 verifying / 2 building; 26 in `rejected/`.**
80 + 41 + 41 + 31 + 0 + 2 = 195. T-079's stamp moves done from 79 to 80
and building from 3 to 2; `T-079-s3` is the 195th file, written at this
checkpoint and counted after it was written rather than before.

**THE SUGGESTION BACKLOG IS THIRTY-ONE AND THE NEXT TRIAGE IS A LARGE
ONE.** It was zero four merges ago. T-079 contributed three: `-s1`,
discharged here but left filed for the record; `-s2`, live and fenced to
`[app-shell]`, now free; and `-s3`, filed by the integration that the
defect cost a red.

## Provenance — SELF-DECLARED, never read off a trailer

T-079 is **built and integrated by one `claude-opus-5` session**;
`built_by: claude-opus-5 @T-079`, `verified_by:` empty, `review:
self-verified`. **The `Co-Authored-By` trailer on this lane's commits is a
harness constant and is NOT evidence of a model** — T-085 proved it and
T-101 sharpened the proof with a counterexample inside one session.
Nothing here reads a model off a commit signature.

**NOTE THE STANDING RULING THIS CARD SITS UNDER.** @human ratified on
2026-08-25 that S cards touching SHIPPED CODE should get a verifier while
docs/method/TOOLING S cards keep self-integration (it rides T-104, not
yet built). T-079's fence is `[tools/e2e]` — a gate, not shipped code —
so self-integration is the correct side of that line, and it is recorded
here rather than assumed.

**80 done cards — 59 `same-model`, 15 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 59 + 15 + 5 + 1 = 80. T-079 moves `self-verified` from
14 to 15.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THIS MERGE DID NOT REACH THE RUNNING WINDOW, AND THAT IS MEASURED
   RATHER THAN ASSUMED.** It touches no `app/src-tauri/**` and no
   `app/src/**`, so neither of `tauri dev`'s restart triggers fires.
   `target/debug/nputer` was pid **82593**, started **2026-08-25
   03:17:33** — during T-123's integration, an hour before this one — and
   it is the SAME pid and start time after this merge and this
   checkpoint. The vite process is unchanged at pid 82549.
2. **THE MAP PANE SEES THE SAME GRAPH.** `graph.json` is byte-identical
   to T-123's checkpoint, so a human opening the map after this commit is
   looking at exactly the repository it drew before it.
3. **The integrator's `cargo` run shares `target/` with the human's live
   dev app** (T-113's observation, confirmed again): the graph gate built
   into the shared directory twice while the app was running, and did not
   disturb it.

**No process from this integration survives.** Scratch ports **15105**,
**15106** (lane) and **15107** (this integration) were each read with
`lsof` FIRST (zero rows) and then bind-confirmed free on `127.0.0.1`,
`0.0.0.0`, `::1` and `::` before use, in that order and never the
reverse, and all were free again after. **No `pkill` at any point.**
**The untracked zero-byte file `z`** still sits there — not this
integrator's, not staged, left alone for the ninth checkpoint running.

## In progress / broken right now

**NOTHING IS BROKEN AND NOTHING IS MOVING.** Both live lanes are stalled
on a decision rather than on work — see the table at the top of this
file, which is derived from `git worktree list` and is the thing to
re-derive rather than to quote. `[tools/e2e]` was released by this
checkpoint. `git branch` still lists every lane this repo has ever run,
which is the intended asymmetry: the BRANCH is kept and only the
WORKTREE is removed.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1889 SYMBOLS / 1849
EDGES at 895 891 bytes / 172 files**, and should **forecast the DELTA and
re-derive the endpoints**. The graph sits at **89.59% of
`max_graph_bytes`** (1 000 000) with **104 109** bytes of headroom, and
**nothing reports that number** — no gate, no test, no line of output.

## Next up

1. **TWO DECISIONS ARE THE CRITICAL PATH, AND BOTH ARE HUMAN- OR
   ARCHITECT-SHAPED RATHER THAN BUILD-SHAPED.**
   **(a)** `docs/rooms/t110-second-rejection.md` is open to **@human**:
   T-110 hit the two-rejection stop condition on a real security finding
   (`read_small` uses `fs::metadata`, which FOLLOWS SYMLINKS, while the
   three checks above it use `symlink_metadata`). The fix is two tokens
   and entirely in fence; what the room asks for is a ruling on how to
   restart, not a patch.
   **(b)** **T-033 needs its three dispatch rulings** — the umbrella
   shared-primitive story, the non-code D3 story, and the ADR-015
   one-implementation question. Its own card names them as preconditions
   and its plan section is empty. `T-059` is `blocked_by: [T-033]` and
   dissolves entirely under one of the three options, so the ruling
   unblocks two cards.
2. **THE SUGGESTION BACKLOG IS THIRTY.** It was zero four merges ago and
   no triage has run since. That is the largest it has ever been and the
   next triage is a big one.
3. **`T-079-s3` IS THE ONE THE NEXT TRIAGE SHOULD READ FIRST**, because
   it is about the METHOD rather than the code: plant-and-restore is a
   technique this project uses in several places and it restores bytes
   without restoring the clock. One live sibling, seven mtime readers,
   and a candidate clause for the POISON DRILL bullet.
4. **`T-079-s2` IS LIVE AND ITS FENCE IS FREE.** Two `app/test` files
   mint bare ungated animation rules into the production stylesheet, and
   a third file's comment states the wrong mechanism for why they are
   there — with the exact irony that the comment's own text is one of the
   minting candidates. `[app-shell]` is free. It is small, measured and
   dispatchable today.
5. **`T-088-s4` FIRED AGAIN HERE — 3 RED IN 7 FULL RUNS — AND ITS FENCE
   IS FREE.** It cost this integration seven cargo runs to characterise
   and it will cost the next one the same. `[app-shell]` has been free
   since T-123's checkpoint, so the only thing between it and a fix is a
   dispatch. It must not be parked a third time.
6. **A PATTERN COUNT IN THE FOUR WALKS TABLE HAS NO OWNER.** Two
   signposts in that one table went stale in two days and a lane caught
   both. Worth a ruling at the next triage: enumerate and gate it, or
   stop enumerating.
7. **The GNU `xargs` column still closes at the first push**, and
   `git remote` still returns zero remotes.
8. **There is one outstanding @human item** (the T-110 room) **and one
   outstanding @architect item** (T-033's three rulings).
