# State

Updated: 2026-08-25 by the T-124 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: TWO LANES ARE LIVE,
ONE OF THEM IS APPROVED AND WAITING FOR AN INTEGRATOR, THE HUMAN'S WINDOW
IS PINNED TO A CHECKOUT MAIN CANNOT REACH, AND `cargo test` REDS MOST OF
THE TIME IN THIS CHECKOUT FOR A REASON THAT IS NOT A BUG IN ANY TEST
(3 of 5 at this checkpoint, ~80% at the last one).** Nothing on main is broken. **But two known reds and one newly
filed intermittent will meet you before any real defect does — read the
next three sections before you debug anything.**

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — it is the
first item under "Next up" for the FOURTH checkpoint running.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a
`Date`, and a `Date` holds whole milliseconds** — so the restore writes
back a ROUNDED timestamp while the assertion compares the unrounded
float it captured. **And the failure repairs the condition that caused
it**: the `utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**IT DID NOT FIRE AT THIS MERGE EITHER, AND THAT IS THE PREDICTION
HOLDING RATHER THAN THE DEFECT BEING GONE.** Main is not a fresh
checkout, so E2E was 146/146 first time — the same reading T-110's
checkpoint got, for the same reason. It fires in exactly the places this
project creates most often: a fresh lane worktree and a fresh poison-drill
worktree. **DO NOT "FIX" IT BY RE-RUNNING UNTIL GREEN.** The fix is one
token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend.

## `T-088-s4` IS NOT A FLAKE. IT IS AN 8.7 GB `target/` DIRECTORY, AND THAT IS MEASURED

**PRESERVED FROM T-110's CHECKPOINT, WHICH DID THE EXPERIMENTS, WITH THIS
INTEGRATION'S OWN TALLY ADDED AT THE END.** The account below is the most
useful thing in this file for a session that runs `cargo test` in main.

**`docs_watch::tests::startup_arm_watches_the_initial_root` has been
carried as a flake with a "3 red in 12" tally since T-088. It is not one.
It reds ~80% of the time in THIS checkout and ~0% everywhere else, and
the single variable is the size of the cargo target directory.**

**STEP 1 — is it the merge?** `cargo test --lib` alone never builds or
runs T-110's new `dispatch_lanes` binary, and it reds by itself. `lib.rs`
declares `agent`, `docs_watch`, `churn`, `index_cmd`, `acl_pin` and
**not** `dispatch`. Suggestive, not decisive.

**STEP 2 — same TREE, two checkouts** (interleaved, so load is
controlled; the throwaway has its own small target dir):

| checkout of `1223543` | red | test time |
|---|---|---|
| clean worktree, own target dir | **0 / 5** | 3.85–3.93s |
| main's own checkout | **4 / 5** | 8.85–15.14s |

**STEP 3 — same CHECKOUT, two target dirs.** This is the one that
names the cause. Identical source, identical checkout, identical load —
only `CARGO_TARGET_DIR` differs:

| target dir | red | test time |
|---|---|---|
| isolated (1.5 GB, fresh) | **0 / 5** | 3.82–3.93s |
| main's own, **8.7 GB** | **4 / 5** | 8.85–14.70s |

**THE LIB TEST BINARY IS BYTE-IDENTICAL ACROSS THAT TABLE AND RUNS ~4x
SLOWER**, and one body in it has a wall-clock deadline, so it is the one
that reds.

**WHY THE HISTORICAL TALLY WAS ERRATIC, EXPLAINED RATHER THAN
APOLOGISED FOR.** A lane worktree and a poison drill both start with a
small target dir and see green; main's checkout has been accumulating
since the project began and sees red. The tally moved with WHERE each
session happened to run, which is why it looked like a coin flip. **A
tally that mixes checkouts is not a flake rate.**

### THIS INTEGRATION'S TALLY — 3 RED IN 5, AND THE CLOCK SEPARATES THEM WITH NO OVERLAP

**Five full `cargo test --no-fail-fast` runs in main's checkout: runs 1
and 5 green at 455/0/3 exit 0, runs 2, 3 and 4 red at 454/1/3 exit 101,
every red the same body.** Nothing else ran on the machine during any of
them and `uptime` read load **2.26–2.75** throughout, an order of
magnitude below the 32.36 that produced T-110's separate `shell-frame`
timeout — so this is not the load story, it is the target-dir story.

**AND THE LIB SUITE'S OWN TIME SORTS THE FIVE RUNS PERFECTLY**, which is
the sharpest confirmation of T-110's diagnosis yet recorded because it
falls out of the ordinary suite output rather than an experiment:

| run | lib `test result:` | lib time |
|---|---|---|
| 1 | ok. **160** passed | **9.48s** |
| 2 | FAILED. 159 passed; **1 failed** | 14.73s |
| 3 | FAILED. 159 passed; **1 failed** | 14.87s |
| 4 | FAILED. 159 passed; **1 failed** | 14.65s |
| 5 | ok. **160** passed | **8.94s** |

**EVERY GREEN RUN IS UNDER 9.5s AND EVERY RED RUN IS OVER 14.6s — a gap
of more than five seconds with nothing in it.** On an identical tree,
in one checkout, with nothing else running. This is not a flake rate with
a confounder; it is a threshold, and the outcome is a function of which
side of it the run lands on. `du -sh app/src-tauri/target` still reads
**8.7G** and this integrator did not touch it. **The deadline is what is
being crossed; the merge is not what crosses it.**

**DO NOT `cargo clean` MAIN'S TARGET DIRECTORY TO "FIX" THIS RIGHT NOW**
without checking `lsof` first: `target/debug/nputer` is a running binary
(pid **89201**, started 10:54:33, still up at this checkpoint), a lane is
building against this repository, and reclaiming 8.7 GB is a system-state
change no architect has ruled on. This wants a card, not a reflex — see
"Next up".

## A SECOND INTERMITTENT — `T-124-s3` — AND IT DID NOT FIRE HERE, 5 FOR 5

**`a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`
in `app/src-tauri/tests/agent_runner.rs` (T-113's, added at `55f9b1b`)
failed its POSITIVE CONTROL with an empty `stderr_tail` in 1 of 4 runs
during T-124's verification, and it is the first thing to falsify the
pipeline's standing "green except `T-088-s4`" sentence.** It was proved
not to be T-124's — `runner.rs`, which owns the stderr ring and the
`ExitNonZero` path, is a 0-file diff, and the body was 14/14 green on
MAIN's Rust in a detached worktree.

**THIS INTEGRATION IS THE FIRST THAT COULD IN PRINCIPLE HAVE SEEN IT MOVE
— its fence `[app-agent]` is T-124's own, and the merge carries 90 new
lines into the very file the body lives in — AND IT DID NOT MOVE.** The
body reads `ok` in all FIVE full runs above, including the three that
were red on the watcher body. **That is five data points on an honest
tally, not a claim that it is fixed**, and it is exactly the shape that
needs a tally rather than a verdict: an intermittent that does not fire
has told you nothing except how often it does not fire. Its own filing
saw it once in four; this checkpoint saw it zero in five; the pooled
count is **1 in 9**.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not
a lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN
AND THIS IS THE SEVENTH MEASUREMENT SAYING SO.** A live lane's tip is a
live-environment fact, not a function of a tree; what is stable is WHICH
lane holds WHICH fence. For a tip, run `git worktree list`. **No scratch
worktree is named here either** — the CLASS is recorded, the membership
is the command.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-052** | `[method/, docs/CONVENTIONS.md]` | **APPROVED — awaiting integration** |
| **T-033** | `[docs/architecture/components/, lib-parser, app-map, app-shell]` | building |

**T-052 IS THE NEXT MERGE AND ITS VERDICT IS ALREADY WRITTEN** — read
from the object database rather than from its worktree, which this
integrator did not enter: the branch head is *"T-052 VERDICT: APPROVED —
the bump is not owed, and the card's own rung 8 is refuted twice over"*.
**Its card reads `status: verifying` in the lane and `building` on
main**, which is the board-truth mechanism below, still running.

**ONE WORKTREE THAT IS NOT A LANE, AND IT MATTERS A LOT:**

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** See the
  running-app section below.
- **Detached `drill-T-NNN-*` entries — scratch worktrees belonging to
  whichever passes are running.** DO NOT QUOTE A LIST FROM HERE. **This
  integration created none**; the card was already verified and needed no
  drill of its own.

**AND `c4cfe52` IS ALSO THIS LANE'S MERGE-BASE**, which is worth one line
because it explains the coincidence rather than leaving it to be
rediscovered: @human cut their app checkout at the same commit T-124's
lane was cut from, so the lane's base ref and the pinned window are the
same object.

**ONE LANE WORKTREE STILL SITS AT A NON-STANDARD PATH** —
`tools/nputer-T-052`, **INSIDE the repository**, where
`method/lane-protocol.md` rule 3 asks for a sibling directory. The
dispatcher cut it with a relative path and owns the error; relocation is
pending. **T-124's was the second and this checkpoint removed it**, so
the count is now ONE. **THE DISPATCH BRIEF FOR THIS MERGE SAID TWO** —
correct when it was written and correct at the ceremony check, wrong by
the time the checkpoint landed. T-110's checkpoint recorded the identical
staleness one merge ago ("THE DISPATCH BRIEF FOR THIS MERGE SAID THREE;
IT IS TWO"). **Twice running now: derive it from `git worktree list`.**

**`[app-agent]` IS FREE** as of this checkpoint, in the order lane
protocol rule 6 fixes (merge, then checkpoint, then remove). Free too:
`app-dispatch`, `app-board`, `app-interview`, `crate-index`, `tools/e2e`,
`.github/`.

## Just completed

**T-124 — the adapter grants a spelling the planner does not use, and
the argv deliberately did not move.** F-03, milestone 4, size M,
`touches: [app-agent]`, **fence never widened**. Main-before **`1d8a2c2`**,
lane tip **`f76a77c`**, merge **`b1d51dc`**, this checkpoint after it.
`built_by: claude-opus-5 @T-124`; one verification pass,
`review: same-model`.

**THE FINDING IS A REFUSAL, AND IT IS THE CARD'S OWN FOURTH CRITERION
BEING EXERCISED RATHER THAN A CARD FALLING SHORT.** `CLAUDE_V1`'s six
`Bash(...)` grants — `git init`, `git add`, `git commit`, `git status`,
`mkdir`, `cp`, all bare — are **byte-identical to main's**, re-derived
here rather than taken from the verdict: the whole `CLAUDE_V1` const
block is **1113 bytes, sha256 `2130e3f386d39a064d850ab7aac551618a7534b55ce2733c57b8ff3e36a0cd54`**
at `1d8a2c2` and at `b1d51dc`, `cmp` **exit 0**. That block contains all
six grants, both templates and `--disallowedTools`, so nothing in the
spawned child's permission surface moved.

**SAY BOTH HALVES OR THE SENTENCE IS FALSE.** `adapter.rs` went
**1319 → 1707 lines, +388**, and `spawn_args` gained **none**. "The
adapter did not move" is true only of the ARGV; the file grew by a third.
The verifier flagged that imprecision and it is repeated here rather than
smoothed over.

**WHY DECLINING WAS RIGHT, IN THE FORM THAT DOES NOT DEPEND ON GUESSING
THE CLI's INTERNALS.** The grants are prefixes over fixed verbs, and only
two patterns could admit the planner's `git -C <projectdir> status
--short`. `Bash(git -C:*)` covers a command's text from its first byte,
so it admits **every git subcommand in every directory on disk** —
`push`, `reset --hard`, `clean -fdx` — which reaches outside the project
that the deliberate absence of `--add-dir` exists to prevent. A
runtime-substituted project path is not expressible without changing what
`spawn_args` IS (`&'static [&'static str]`, one `SESSION_ID_SLOT`), and
would carry a `/`-bearing user-controlled string into a permission grant.
**And the bare twin is already granted**: `git status --short` reaches
`Bash(git status:*)` and the planner's cwd already IS the project
directory, so an instruction costing ZERO grant surface reaches the same
operation. **A remedy that costs nothing beats one that costs an
arbitrary-directory git grant**, and that argument needs no claim about
the CLI at all.

**WHAT ACTUALLY LANDED.** `adapter::OBSERVED_PLANNER_REFUSALS` — `pub
const` DATA, not prose, sitting directly under `CLAUDE_V1` where the
grants live — carrying the three captured `claude` **2.1.226** refusals
with a `RefusalMechanism` each (`CliSafetyHeuristic` /
`CliCommandAnalyser` / `OurAllowlist`, three distinct values, exactly
one ours), a `RefusalRemedy` and a `why`. Three new test bodies across
two files read it. The `--allowedTools` header bullet now says the grant
is a prefix over a fixed verb, that it covers a command's TEXT and not
its EFFECT, and that `git -C <dir> …` reaches **none of the six** — with
the sharper number the card itself did not claim, that **all four git
grants** are lost to that spelling, not merely `git status`.

**THE HALF THAT DID NOT LAND IS `T-124-s1`, AND IT IS THE HALF THAT
ACTUALLY FIXES THE DEGRADATION.** The genesis loop still runs degraded:
the planner works around grants it was given and every refusal spends a
turn's reasoning. The repair is a PLANNER INSTRUCTION, not an argv change
— run git bare in the cwd, which IS the project; write files with the
Write tool rather than a shell redirect — and it is out of `[app-agent]`
by construction: `method/` is a method FORMAT change whose third file is
Rust (`METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs`).
`T-124-s1` carries both texts ready to paste and names **T-104**, which
is live at `status: planned` with exactly the three-way fence that bump
needs. **Nothing about the refusals is fixed until T-104 runs.**

**AND THE CARD'S OWN "FIRST REAL-CLI PERMISSION TEXT" CLAIM IS FALSE,
which is the error that paid for itself.**
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` — tracked,
five days older, same CLI 2.1.226 — carries two real `permission_denied`
messages. That older capture is the only thing in this repository that
can corroborate any of the three refusals, and it does: the first **85
bytes** of refusal 3 are byte-identical to the capture's own denial
message. It also settles the transcription question — **the capture
carries no backtick**, so the backticks in the card's quotations are the
transcriber's markdown and the const is right to strip them. Two of the
three reasons remain uncorroborable by construction, and the body says so
out loud rather than implying it checked all three.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 1d8a2c2 f76a77c -> tree 43c4f97f…, exit 0 (read from $? FIRST)
    git diff --name-only 1d8a2c2 <TREE>                        ->   7   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 1d8a2c2..b1d51dc  (THE MERGE'S DIFF)  ->   7   the only one that means anything
    git diff --name-only c4cfe52..f76a77c  (branch-only, TWO)  ->   7
    git diff --name-only 1d8a2c2...f76a77c (THREE dots)        ->   7   AGREES HERE — see below
    git diff --name-only 1d8a2c2..f76a77c  (TWO dots, FORBIDDEN)   ->  39
    git diff --name-only c4cfe52..b1d51dc  (merge-base, FORBIDDEN) ->  39
    git diff --name-only c4cfe52..1d8a2c2  (main's advance)        ->  32

**THE FORBIDDEN TWO-DOT FORMS OVERSTATE BY 32 PATHS — 5.6x — AND BOTH
ARE PURE LEFT-ENDPOINT DRIFT.** Main advanced **32** under this lane, the
branch **7**, `comm -12` over the sorted lists is **EMPTY**, and
32 + 7 = 39 — the arithmetic that proves the sets disjoint. T-110
measured 7.0x, T-120 measured 1.2x, and T-110's checkpoint already said
why the ratio is weather and the left endpoint is the signal. **This
merge does not add a third ratio to that argument; it adds something
better.**

**THE THREE-DOT FORM RETURNED THE RIGHT ANSWER, AND THAT IS THE HAZARD
RATHER THAN A REPRIEVE.** `A...B` is DEFINITIONALLY
`$(git merge-base A B)..B`, so `1d8a2c2...f76a77c` IS the branch-only
range — **7, exactly right**, because this branch is purely additive and
main's advance is disjoint from it. **It was also exactly right at
T-110's merge (20 against 20), and at T-120's before that.** So a reader
who tests the ban empirically on any of the last three merges concludes
the ban is pedantry, and adopts a notation that agrees *only while the
two sets stay disjoint* — the day a lane and main touch the same file, it
silently drops main's side of that path from the count with no signal
that anything happened. **A forbidden form that keeps giving the right
answer is more dangerous than one that gives a wrong one**, and three
consecutive merges have now handed it the right answer. CONVENTIONS
already bans it by name; what was missing is the reason it keeps looking
harmless, and that is this paragraph.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`43c4f97fc01667a1ef75aff855a62f75096a2cfa` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`1d8a2c2` and `f76a77c` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**THE TWO TOOLS WANT OPPOSITE THINGS, AND THIS INTEGRATION USED EACH
WHERE IT BELONGS.** `git merge-tree` reads **COMMITS** — it cannot see an
index, so staging a file before measuring buys nothing. The DOCS GATE
reads **TRACKED files** — so new doc files must be `git add`ed before it
can see them (`T-010-s10`). At the merge all seven paths were already
committed by the merge itself, so the gate saw them without staging; this
checkpoint's own two doc writes were `git add`ed by explicit path before
their gate run.

## THREE standing gates — DERIVED from the merge's own 7 paths

| gate | trigger | on these 7 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **2 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **5 — FIRES**, three suites |

Both code gates take the same two paths: `app/src-tauri/src/agent/adapter.rs`
and `app/src-tauri/tests/agent_runner.rs`.

- **GRAPH REGEN — FIRES on 2, ASKED rather than predicted**, and this is
  the second lane running on which `e1f3023`'s **`*.rs` clause** does the
  whole job: without it the trigger would match **0 of 7** while the graph
  moved by 8 symbols. See THE REGEN below.
- **BOOT GATE — FIRES, 2 of 7. RUN, exit 0** on scratch port **15201**,
  both startup lines observed: `[nputer] project folder:
  /Users/ujju/Projects/nputer` and `[nputer] window "main" created`.
- **DOCS GATE — exit 1**, invoked DIRECTLY from the repo root with the
  merged paths as ROOT-RELATIVE arguments, **never through `xargs`**.
  **5 of 7 under `docs/`, THREE suites owed** — `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/` — all
  three run and green, at the merge and again after this checkpoint's doc
  writes. **THE DISPATCH BRIEF SAID "3 of 5" AND IT WAS RIGHT AT THE
  VERIFIER'S REF AND WRONG AT MINE**: the verdict commit `f76a77c` added
  `T-124-s3`, `T-124-s4` and the verdict itself, so the diff is 7 paths
  and 5 of them are docs. **Re-derive; never quote a gate count from a
  brief.** The gate reports **12 derived readers across 4 suites**, a
  census of **130** docs-shaped sites in 22 files (129 at T-110 — the one
  new site is this merge's own second climb into the capture), and **0
  frontmatter issues**; every live card's frontmatter parses with a legal
  status, which is this card's `done` stamp checked rather than assumed.
  **Both climb sites are reported** — `agent_runner.rs:1880` and this
  merge's new `:1993`, both resolving to
  `docs/research/captures/real-planner-turn-2026-08-19.jsonl`, a file that
  was ALREADY a `cargo test` docs input, so this merge adds no new suite
  to any future diff's obligations.
  **`cargo test from app/src-tauri/` is NOT owed by this diff** — the
  capture it reads is not among the seven — and it was run anyway, four
  times, because this merge changes Rust.

## THE REGEN — a forecast that survived a change of endpoint

**`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored`**, committed WITH this checkpoint.

| | bytes | files | symbols | edges |
|---|---|---|---|---|
| committed (main at `1d8a2c2`) | 918 406 | 178 | 1951 | 1878 |
| fresh at the merge | **920 597** | **178** | **1959** | **1878** |
| **DELTA** | **+2 191** | **+0** | **+8** | **+0** |

Two files `~`, no file added or removed: `adapter.rs` loc 1319 → 1707,
symbols 24 → 31; `agent_runner.rs` loc 4517 → 4607, symbols 118 → 119.
7 + 1 = 8.

**THE LANE AND THE VERIFIER BOTH FORECAST THIS OFF ENDPOINTS THAT WERE
ALREADY STALE, AND THE FORECAST HELD ANYWAY.** They measured
**895 891 → 898 082** against main at `ce8b8e7`; T-110's checkpoint then
took the committed graph to 918 406 before this merge ran. **The
ENDPOINTS moved by 22 515 bytes and the DELTA did not move at all** —
`+2 191` bytes and `+8` symbols on both sides, because a delta is a
function of the diff and an endpoint is a function of the tree. That is
the discipline the dispatch brief asked for ("forecast the DELTA,
re-derive the ENDPOINTS") vindicated by measurement rather than argued.

**`index --check` is exit 0 — CURRENT — after the regen, and again after
every doc write in this checkpoint.** That is the verdict, and it is the
ONLY thing trusted here: **T-123's integrator measured a stale graph
whose four headline figures AND byte count were identical on both sides
while the sha256 differed.** A byte count is not evidence. For the
record and not as evidence, the file's sha256 moves
`a618995c…` → `b99f819b…`.

**THE SIZE AGAINST THE CEILING: 920 597 of `max_graph_bytes` 1 000 000 =
92.06%, with 79 403 bytes of headroom.** Up from 91.84%. **This is the
highest this repository has ever been, and NOTHING REPORTS IT** — no
gate, no test, no line of output. A lane cut now owes its regen forecast
against **1959 symbols / 1878 edges at 920 597 bytes / 178 files**.

## NO FIXTURE RECONCILIATION WAS OWED, AND THAT IS ITSELF THE FINDING

**Derived rather than assumed, and then confirmed by running the suite.**
The live-registry dogfood fixtures move when a component gains or loses
indexed FILES. This regen moves **symbols only** — `files +0 -0 ~2` — so
`architecture-dogfood.test.ts`'s `fileComponent.size` stays **178**,
`unmappedFiles` stays its single-entry `["app/src-tauri/tests/dispatch_lanes.rs"]`,
the findings and drift arrays are untouched, and
`map-dogfood-render.test.tsx`'s `committed graph · 178 files` hint holds.
`npm test from app/` is 958/958 across 46 files before and after the
regen, which is the confirmation.

**AND NOT ONE FIXTURE IN THIS REPOSITORY PINS A SYMBOL OR EDGE COUNT** —
grepped for, not remembered. The only place `1951`/`1878` appear outside
`graph.json` is a COMMENT in `map-dogfood-render.test.tsx:502` that is
explicitly scoped to T-110's regen, so it is a historical ledger entry and
this regen does not falsify it. **The consequence is worth stating
plainly: a regen that moves symbols without moving files cannot red any
fixture in this repository.** Today that is correct — nothing about the
architecture changed. But it means the fixture set gates the FILE→
COMPONENT map and nothing else about the graph, and a reader who assumes
"the dogfood would have caught it" about a symbol-level regression is
wrong. **No card filed** — scope belongs to the architect, and filing one
here would move the board counts this checkpoint derives (T-110's
precedent).

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command captured on the very next token — **and the
COUNT was read as well as the exit**, because an exit alone cannot tell a
green suite from a suite that did not run.

- **cargo: 455 passed / 0 failed / 3 ignored, exit 0**, summed over
  **SIXTEEN** `test result:` lines, **zero warnings**. That is T-110's
  452 plus this lane's three new bodies (452 + 3 = 455), and the line
  count was DERIVED, not quoted — this merge adds no test target, so 16
  before and 16 after. Read at the merge and again after this
  checkpoint's doc writes; both readings are 455/0/3 exit 0.
  **THE HONEST TALLY: five full runs in main's checkout, TWO green and
  THREE red, every red the same `docs_watch` body**, with the lib timings
  in the section at the top of this file separating green from red with a
  five-second gap and no overlap. Every re-run is declared; **none was a
  silent re-run to reach green**, and the FIRST run was green, so nothing
  was discarded on the way to a number.
  **`self_graph_is_current` is one of the three `ignored`** — it
  byte-compares the committed graph and is run explicitly, which is what
  the regen invocation below does.
- **app: `npm run build` exit 0, `npm test` 958/958 across 46 files, exit
  0** — at the merge and again after the regen and this checkpoint's doc
  writes.
- **parser: 264/264 across 12 files, exit 0.**
- **E2E: 146/146, exit 0**, on scratch port **15200** at the merge and
  **15202** after the doc writes.
- **Every suite ran AT the merge and again AFTER this checkpoint's doc
  writes** (T-081-s9). Both passes are the numbers above; the three
  gate-owed suites ran a third time against the final text.

**AND THE "RE-RUN AFTER THE DOC WRITES" RULE HAS A REGRESS, WHICH IS
SETTLED BY DERIVATION RATHER THAN BY ANOTHER RE-RUN.** Editing STATE
after the suites pass appears to invalidate them, and editing it to say
so invalidates them again. **NO SUITE IN THIS REPOSITORY READS
`docs/STATE.md`'s CONTENT** — checked, not assumed: the two `docs`-wide
readers (`shell-frame.spec.ts:65`, `window-contract.spec.ts:98`) `walk()`
the tree and consume the FILE LIST, and every by-name occurrence of
`docs/STATE.md` in `app/test/**` and `tools/e2e/**` is a synthetic
genesis FIXTURE path, never the real file. So a content-only edit to
STATE cannot move any suite's answer, while ADDING OR REMOVING a file
under `docs/` can. **The rule bites on the file set, not on the prose**,
and an integrator who knows which is which stops re-running for nothing.

**THE SHIPPED BUNDLE DID NOT MOVE, AND IT COULD NOT HAVE.**
`index-CNznNhXD.js` / `index-D41xl3Gz.css` are **527.99 kB / 45.18 kB**,
byte-identical filenames and sizes to T-110's checkpoint, after a real
rebuild. **This merge contains no frontend path at all** — the seven are
two Rust files and five docs — so unlike T-110's merge, where a 314-line
new frontend file changed the bundle by zero bytes and that was a
finding, here it is arithmetic.

## Documents ticked

- **ROADMAP — NOT TOUCHED, and that was derived rather than assumed.**
  The candidate sentence was T-029's promise that *"a turn killed because
  `--allowedTools` was too narrow names the tool that was denied"*, which
  T-069 made true. **This merge does not falsify it**: that promise is
  about the DIAGNOSTIC a killed turn renders, and T-124 changes nothing
  about diagnostics — it documents that the six grants are
  spelling-sensitive, which was equally true before this merge and after
  it. **A card that measures a standing degradation without changing it
  ticks no progress line.**
- **ARCHITECTURE — NOT TOUCHED, and this was checked at the two clauses
  that could have moved.** No interface moved: zero `#[tauri::command]`
  and zero `generate_handler!` lines in the diff, no new event, no new
  grant, no dependency, no manifest. And the D2 clause T-110 corrected in
  place still reads true — this merge is `files +0`, so
  `app/src-tauri/tests/dispatch_lanes.rs` remains the bucket's single
  occupant and nothing joined it.
- **CONVENTIONS was NOT touched, deliberately.** It is T-052's fence, and
  T-052 is approved and next.
- **The card** is stamped `done`, with `built_by: claude-opus-5 @T-124`,
  `verified_by: claude-opus-5 @T-124-verify — APPROVED, 2026-08-25` and
  `review: same-model` — **SELF-DECLARED, never read off a commit
  trailer**, and written with em dashes because a colon-space in a YAML
  plain scalar opens a nested mapping and has broken a card three times.
  The lane's notes and the verdict are preserved byte-untouched.
- **The lane's and the verifier's four suggestion files stay as filed**
  (`T-124-s1` … `T-124-s4`). `T-124-s1` is the routed planner-instruction
  change for T-104's owed v0.1.6 bump and it is the half of this card that
  did NOT land.

## THE BOARD-TRUTH QUESTION, CAUGHT IN THE ACT — FOURTH ASK

Three checkpoints have recorded that **`verifying` reads 0 on the board
while lanes are genuinely in verification**, because an executor stamps
`verifying` in its LANE and that stamp only reaches main at the merge.
**This integration watched it happen, which no previous one could:**

| ref | T-124's `status:` |
|---|---|
| main before the merge, `1d8a2c2` | `building` |
| **the merge commit, `b1d51dc`** | **`verifying`** |
| this checkpoint | `done` |

**THE `verifying` STAMP WAS OBSERVABLE ON MAIN FOR EXACTLY ONE COMMIT,
AND THE SAME INTEGRATOR WHO OPENED THAT WINDOW CLOSED IT.** The field is
not "unused" and it is not "one merge behind" — **it is one COMMIT wide,
and the ritual guarantees nobody is looking during it**, because the
merge and the checkpoint are the same person's consecutive actions. Right
now `T-052`'s card reads `verifying` in its lane and `building` on main,
so the next integrator can reproduce this table exactly.

The three dispositions are unchanged and none is free:

1. **The stamp moves on the integration branch at handoff**, the way
   T-089 has the architect stamp `building` before the cut. Costs a write
   to main per handoff.
2. **The field goes**, and phase is read from the lane set — which T-110
   now makes possible and T-111 would render.
3. **It stays and is documented as lane-local.**

**Disposition 3 is the status quo and this table is the argument against
describing it as "knowingly one merge behind"** — that phrasing implies a
window a reader could observe, and there is none. It wants a ruling
rather than a fifth observation.

## What ACTUALLY reached the human's running app — NOTHING, AND THE REASON IS STRUCTURAL

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal, on any interface. Holder `node`
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, unchanged before and
after. `target/debug/nputer` is pid **89201**, started 10:54:33, still
running and deliberately not disturbed.

**THE WINDOW IS NOT SERVING FROM THIS CHECKOUT.** It serves from
`/Users/ujju/Projects/nputer-app`, which is **detached at `c4cfe52`**.

**SO THIS MERGE CANNOT REACH IT, AND THE REASON IS NOT A RESTART
TRIGGER.** The checkout is PINNED at an older commit — `c4cfe52` is an
ancestor of this merge, re-verified here with
`git merge-base --is-ancestor` at **exit 0** — so main is strictly ahead
of it and nothing committed to main after `c4cfe52` reaches that window
**until @human moves it**, whatever any trigger does. A session that asks
"did my change reach the app?" by checking `app/src/**` triggers gets the
right answer for the wrong reason today, and a wrong answer the moment
@human switches back. **@human's tree was not entered at any point.**

**And on this merge the trigger question does not even arise**: the seven
paths contain no `app/src/**` and no manifest, so there is nothing a
reload or a restart could have carried even to a checkout that was
tracking main.

**No process from this integration survives.** Scratch ports **15200**
(e2e at the merge), **15201** (boot gate), **15202** and **15203** (the
two post-checkpoint e2e re-runs) were each `lsof`-read FIRST (zero rows),
then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in
that order and never the reverse, and all four were free again after.
**No `pkill` at any point.** No sibling lane worktree was entered — T-052's
verdict above was read from the OBJECT DATABASE. **The untracked
zero-byte file `z`** still sits there — not this integrator's, not
staged, left alone for the twelfth checkpoint running. **Main's 8.7 GB
target directory was left exactly as found.**

## The board, derived from disk at this checkpoint

**216 flat task files — 83 done / 39 planned / 41 parked / 51 suggested /
0 verifying / 2 building; 26 in `rejected/`.**
83 + 39 + 41 + 51 + 0 + 2 = 216. T-124's stamp moves done from 82 to 83
and building from 3 to 2; its four suggestion files took `suggested` from
47 to 51 and the flat total from 212 to 216.

**THE SUGGESTION BACKLOG IS FIFTY-ONE AND THE LAST TRIAGE WAS THE
SEVENTH.** It has grown by seventeen across the last two merges alone
(T-110's thirteen, T-124's four).

## Provenance — SELF-DECLARED, never read off a trailer

T-124 is **built by `claude-opus-5` and verified by an independent
`claude-opus-5` session** which did not write the build it judged, and
which read the spec BOUNDED (from the base ref, forming and running its
attack before opening the lane's own notes) under the ruling on T-121
arm 2. **The `Co-Authored-By` trailer on this lane's commits is a harness
constant and is NOT evidence of a model** — T-085 proved it and T-101
sharpened the proof with a counterexample inside one session.

**83 done cards — 61 `same-model`, 16 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 61 + 16 + 5 + 1 = 83. T-124 moves `same-model` from 60
to 61.

## In progress / broken right now

**NOTHING IS BROKEN.** Two lanes are live: **T-052 approved and awaiting
integration**, T-033 building. `[app-agent]` was released by this
checkpoint. `git branch` still lists every lane this repo has ever run,
which is the intended asymmetry: the BRANCH is kept and only the WORKTREE
is removed.

## Next up

1. **T-052 IS APPROVED AND WAITING.** Its verdict is written, its fence
   is `[method/, docs/CONVENTIONS.md]`, and its worktree is the last one
   at a non-standard path. It is the obvious next merge.
2. **`T-120-s3` IS STILL THE ONE TO DISPATCH FIRST AMONG THE UNBUILT**,
   and it is one token of code. FOURTH checkpoint running at the top of
   this list. Fence `[tools/e2e]`, free.
3. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND.** Two planner
   instructions, quoted ready to paste, for **T-104**'s owed v0.1.6
   method bump. Until it runs, the genesis loop still spends a turn's
   reasoning routing around grants it was given, and **all four git
   grants** — not just `git status` — stay unreachable to a planner that
   writes `git -C <dir> …`. T-104 is `status: planned` with the
   three-way fence the bump needs.
4. **`T-110-s1` — THE LANE READER IS BUILT AND NOT WIRED.** `lib.rs`
   declares no `pub mod dispatch;`, so the shipped binary does not carry
   the module and `cargo build` is not a gate on it. **The commit that
   takes it DELETES the test shim**, which also drains the D2 bucket.
   Fence `app-shell`, **held by T-033**.
5. **THE BOARD-TRUTH RULING on `verifying`** — FOURTH ask, and the
   section above now carries the one-commit-wide table instead of another
   observation.
6. **THE GRAPH IS AT 92.06% OF ITS CEILING** with 79 403 bytes of
   headroom, and **nothing reports that number**. It has moved 89.59% →
   91.84% → 92.06% across three merges.
7. **`T-088-s4` WANTS RE-FILING AND THEN A ONE-LINE CARD.** The
   measurements are at the top of this file and this integration added a
   fourth tally (3 red in 4, with the lib clock separating green from
   red on the ordinary suite output). Two dispositions: **(a)** reclaim
   the 8.7 GB target dir — but `lsof` FIRST, `target/debug/nputer` is a
   running binary; **(b)** give the body a deadline proportional to what
   it is waiting for, which fixes the symptom in every checkout and is
   the smaller change. **No card filed here** — scope belongs to the
   architect and filing one would move the board counts above.
8. **`T-124-s3` — the second intermittent — NEEDS RUNS, NOT A VERDICT.**
   It did not fire in four runs here. Somebody should keep the tally.
9. **`T-110-s9`** — either a component claims `app/src-tauri/tests/**` or
   `T-110-s1` lands and the question dissolves. Fence
   `docs/architecture/components/`, held by T-033.
10. **`T-120-s1`** — the pre-write exclusivity check still cannot
    discriminate; this integration used the replacement it derives
    (`git diff --cached --name-only` plus `git diff --name-only`, both
    empty), which is what made this turn provably exclusive rather than
    judged. `??` lines alone are not a ceremony, and there were three.
11. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
12. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
13. **Outstanding: `method/roles/integrator.md` gains its
    running-product section only when T-052 merges.** This merge's
    dispatch brief instructed the integrator to read a section
    ("The checkout you merge into may be in use") that **does not exist
    on main** — it is on `task/T-052-two-checkouts`, unmerged. It was
    read from the branch and honoured anyway, but a brief that points at
    an unlanded document is a hazard worth one line here.
