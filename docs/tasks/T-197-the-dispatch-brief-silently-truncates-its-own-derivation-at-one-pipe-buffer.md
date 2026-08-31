---
id: T-197
title: The dispatch brief SILENTLY TRUNCATES its own derivation at exactly one pipe buffer — `brief.mjs` ends at `process.exit()`, and the loss GROWS with the board in the tool whose entire contract is a trustworthy figure
feature: F-06
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [tools/e2e]
suggested_by: "T-192's executor, which met it as an e2e red it proved was not its own; re-measured and confirmed at the architect/integrator seat before filing"
builder: claude-opus-5@subagent
review: independent
---

**FOUND BY A LANE THAT REFUSED TO ACCEPT A RED AS ITS OWN**, and
re-measured at this seat rather than taken on report.

## The measurement, run at `57c1b39`

    node scripts/brief.mjs --dispatch > file      →  69,293 bytes
    node scripts/brief.mjs --dispatch | cat > f   →  65,536 bytes

**65,536 is exactly 64 KiB — one pipe buffer.** 3,757 bytes are lost, and
**nothing says so**: exit status is 0, no error is printed, and the
output ends mid-derivation looking like a complete answer.

## RE-MEASURED AT `5e36a0b` — AND THERE IS NO SINGLE BOUNDARY

**The 64 KiB figure above is one reader's answer, not the defect's.** Two
readers, same tree, same command:

    --dispatch > file                    →  66,464 bytes  (whole)
    --dispatch | cat                     →  65,536 bytes  (8 of 8 runs)
    --dispatch via spawnSync (the spec)  →  survives to ~66,470

**The loss point is a property of WHO IS READING**, because it is a race
between the reader draining the pipe and the writer exiting. A fix that
pins one number pins one reader.

**HEAD SAT UNDER THIRTY BYTES FROM RED AND NOTHING SAID SO.** A 30-byte
title edit to `T-212` took the brief from 66,464 to 66,494 and turned
`dispatch-order.spec.ts` from 14 passed to 1 failed. The spec's own
failure text is the tell — a stamp truncated to `<- @ 5e3`.

**AND CI'S GREEN IS NOT EVIDENCE OF ABSENCE AT THIS BOUNDARY.** CI passed
on `5e36a0b` with the brief already 928 bytes past the `| cat` line. A
green run here proves the reader won the race, not that the tail arrived.

**THE LANE-COUNT ATTRIBUTION IN THE RECORD IS WRONG AND THIS CORRECTS
IT.** `docs/checkpoints/2026-08-31-four-lanes-and-a-spec-that-tested-itself.md`
says the body's red/green history "tracked only how many lanes happened
to be open." At this measurement **zero lanes are live and zero worktrees
appear in the output at all** — the BOARD'S OWN GROWTH crossed it. Four
cards filed in one afternoon did what six live lanes had done before.

**Useful for whoever builds this: the brief carries card TITLES, not
BODIES.** The `T-212` edit added 2,135 bytes of body and moved the brief
exactly 30 — the title delta alone. So this card's own body may grow
freely; a new card, or a longer title, is what costs.

## THE STANDING HAZARD UNTIL THIS LANDS

**One more card, or one more sentence in one title, drops the brief's
tail silently.** Every seat is dispatching against a tool that is one
edit away from lying, and the tool's whole contract is a trustworthy
figure. This is why the card was reordered ahead of `T-199`.

## The mechanism

`brief.mjs` ends at `process.exit()`. **Node's stdout is asynchronous
when it is a pipe** and synchronous when it is a file or a TTY, so
`process.exit()` tears the process down with the write queue still
draining. To a file the write completes; to a pipe it does not.

## WHY THIS IS THE WORST POSSIBLE PLACE FOR THIS BUG

`dispatch-brief.mjs`'s own contract, rule 2, is that **"every emitted
figure carries the provenance that produced it, and the provenance cannot
be stripped"** — the module builds RECORDS rather than strings so that a
figure cannot leave the tool detached from its source.

**All of that care is defeated after the fact by the process exiting
early.** A reader who pipes the brief into `head`, `grep`, `sed`, `tail`
or `less` — which is the ordinary way anyone reads a 69 KB document —
gets a derivation that is **correct as far as it goes and silently
incomplete**, with no signal distinguishing "this is the answer" from
"this is the first 64 KiB of the answer."

This is the night's most-repeated failure family arriving in the
project's most-trusted tool: **a summary of nothing is indistinguishable
from a summary of success**, and here a *truncation* is indistinguishable
from a *complete answer*.

**And it is not hypothetical for this seat.** The architect/integrator
piped `brief.mjs` output through `head` and `grep` repeatedly on the
night this was filed. Any invocation whose output exceeded 64 KiB was
read truncated, while every visible signal said the derivation was whole.

## What a fix decides

1. **Whether `process.exit()` is needed at all.** The usual correct shape
   is to set `process.exitCode` and let Node exit naturally once stdout
   drains. If an explicit exit is genuinely required, it must be deferred
   until the stream reports flushed. **Prefer removing the cause to
   adding a wait.**
2. **Whether the sibling commands share it.** `brief.mjs` is one entry
   point among several under `tools/e2e/scripts/`. **Sweep the class** —
   name every script that calls `process.exit()` after writing to stdout,
   and say for each whether it can exceed a buffer. A script whose output
   is always small is a non-member, but say so with its size rather than
   by assumption.
3. **Whether anything else already depends on the truncation.** The e2e
   suite reads this tool's output; a body that currently passes against
   truncated output would change behaviour when the fix lands. Check
   before, not after.

## Acceptance criteria

- WHEN `brief.mjs`'s output exceeds one pipe buffer THE full output SHALL
  reach a piped consumer, byte-identical to the same invocation
  redirected to a file.
- A body SHALL prove it by **comparing the two destinations for one
  invocation large enough to exceed the buffer**, and SHALL assert the
  size is over the buffer — **a body run against small output would pass
  before and after the fix and is the vacuity this card is about**
  (poison shape TEN).
- **THE BODY SHALL PROVE BOTH READER SHAPES, not one.** The loss point is
  reader-dependent — `| cat` truncates at 65,536 while `spawnSync`
  survives to ~66,470 — so a body proving one shape leaves the other
  reader's race unproven. **A fix that pins a single boundary number has
  pinned a single reader** and will be re-measured false by the next one.
- **A MARGIN GUARD SHALL ANNOUNCE AN APPROACH RATHER THAN LET IT BE
  SILENT.** `HEAD` sat under 30 bytes from red with nothing anywhere
  saying so, and a 30-byte title edit reddened the suite. The guard's
  threshold SHALL be DERIVED and SHALL state which reader it is derived
  against, since there is no single line.
- THE sweep SHALL name every sibling script that exits after writing, and
  argue membership either way with a measured size.
- WHERE any suite body currently passes against truncated output, it
  SHALL be identified before the fix lands.
- **A CI GREEN SHALL NOT BE TAKEN AS EVIDENCE FOR THIS CLASS.** CI passed
  at `5e36a0b` with the brief already 928 bytes past the `| cat` line; if
  the fix's own proof runs only in CI it inherits that blindness.
- Verification: headless, the `tools/e2e` suite.

## Read beside

`T-143-s1` (the sibling class of `tools/e2e` bodies that red for reasons
outside the diff — this is what `T-192` first met), and
`dispatch-brief.mjs`'s rule 2, whose provenance guarantee this defect
silently voids.

## AND IT REDS A STANDING GATE THAT EVERY DOCS-TOUCHING LANE NOW INHERITS

Added after `T-190` reported it independently, to the same byte, and
corroborated rather than re-filing.

The truncation is not merely a reading nuisance: **it reds
`dispatch-order.spec.ts`**, which the DOCS GATE names for any lane
touching `docs/`. So every such lane now inherits a red it did not cause
and must spend time attributing.

**And the tell makes it read as a flake rather than a bug**: the
truncation point is fixed at one buffer, but WHAT falls past it moves
with the live lane count, because the dispatch listing grows with every
worktree. So the failing assertion moves between runs. Two lanes
attributed it correctly only by restoring their files to base and
reproducing it there.

`T-143-s1` owns the neighbouring class — `tools/e2e` bodies that red for
reasons outside the diff — and this is a second member with a different
cause.


## THE OVERSIZE INPUT MUST BE SYNTHESISED — the live `--dispatch` CANNOT be the body's subject

`T-142-s1` established this the useful way: it inherited the red, proved
it on a pristine tree, and then **watched it go fully green with no
relevant change** — `T-190` and `T-192`'s worktrees were removed, the
dispatch listing fell from **69,302 to 62,651 bytes**, and the whole
output dropped under one pipe buffer.

**This card already records that WHAT falls past the buffer moves with
the lane count. What is new is that the lane count decides whether
ANYTHING does.** A tell that moves reads as a flake; a tell that goes
fully green reads as **fixed**.

**Consequence for this card's own criterion, and it is binding**: the
*"one invocation large enough to exceed the buffer"* **cannot be the live
`--dispatch`**. On a quiet machine — which is exactly when an integrator
runs the final battery — that invocation is under the buffer, the body
passes for the wrong reason, and it would pass identically before and
after the fix.

**SYNTHESISE the oversize input.** A body whose subject is the live board
is vacuous whenever the board is small, which is poison shape TEN wearing
a regression test's costume.


## THE TITLE'S FIGURE WAS MOVING AND IS REMOVED — the loss GROWS with the board

Filed with *"loses 3,757 bytes"* in the title. **Four measurements now
exist and the number is not stable**, because the truncation point is
fixed at one buffer while the OUTPUT grows with the board:

| ref / lane | bytes to a file | piped | lost |
|---|---|---|---|
| at filing | 69,293 | 65,536 | **3,757** |
| `T-192` | 69,197 | 65,536 | 3,661 |
| `T-198` | 70,092 | 65,536 | 4,556 |
| `T-202` | 77,712 | 65,536 | **12,176** |
| `T-194` | 77,634 | 65,536 | **12,098** |

**The title now names the MECHANISM rather than a figure**, per this
project's own rule that a moving number does not belong where it cannot
be re-derived.

**And the trend is the finding, not a footnote.** The loss more than
TRIPLED in a day of ordinary board growth. Every card filed, every lane
opened, every worktree listed pushes more of the derivation past the cut —
so this defect gets worse on exactly the days the tool is used most.

**It also sharpens the acceptance criterion already on this card**: a
body must SYNTHESISE its oversize input, because the live `--dispatch`
crosses and re-crosses the buffer as lanes open and close. `T-142-s1`
watched the red go fully green when two worktrees were removed.

## THE BODY WENT GREEN AGAIN, AND THE GREEN IS THE PROOF

Measured at this checkpoint with **zero lanes live**:

    --dispatch > file    →  63,732 bytes
    --dispatch | cat     →  63,732 bytes      lost: 0

**The output is now UNDER the 64 KiB buffer, so nothing is truncated and
the `dispatch-order` body passes.** Across one day it has gone red, green,
red and green again — 69,293 → 77,712 → 63,732 bytes — tracking nothing
but how many lanes happened to be open.

**That is this card's acceptance criterion demonstrating itself.** A body
whose oversize input is the LIVE board is green whenever the board is
small, which is exactly the state an integrator is in when running a
final battery — so the fix would appear unnecessary at precisely the
moment someone checks.

**Four measurements now sit either side of the boundary and none of them
is evidence about the code.** The defect is unchanged; only the input
moved.

---

## Implementation notes (executor, lane `task/T-197-brief-truncation`)

Every figure below is measured in the lane worktree
`/Users/ujju/Projects/nputer-T-197` at base `209e5d3`, on Darwin 25.6.0,
node v22.22.0, with `NPUTER_E2E_PORT=14197` (derived from the card id;
`lsof -nP -iTCP:14197 -sTCP:LISTEN` returned zero rows immediately before
the first bind). **No brief output was ever read through a pipe** — every
size is a redirect to a file, counted with `wc -c`.

### The defect, reproduced at the lane's own base

    node tools/e2e/scripts/brief.mjs --dispatch > file   →  69,288 bytes, exit 0
    node tools/e2e/scripts/brief.mjs --dispatch | cat    →  65,536 bytes, exit 0

**3,752 bytes lost, exit 0, nothing printed.** The e2e suite at
`209e5d3` before any change: **401 bodies, 1 failed** —
`dispatch-order.spec.ts:200 › --dispatch runs on the live repository,
exits 0, and WRITES NOTHING`, failing on `Expected substring: "critical
path:"`. That is this card's standing red, inherited by every
docs-touching lane, reproduced here rather than taken on report.

### The fix

`tools/e2e/scripts/brief.mjs`: the file's last statement,
`process.exit(code)` → `process.exitCode = code`. **The cause is removed
rather than waited out** (the card's decision 1): Node exits naturally
once the loop is empty, which is after stdout has drained. Every child
process this command spawns is synchronous (`execFileSync`/`spawnSync`)
and it opens no timer, socket or watcher — verified by sweeping
`brief.mjs`, `dispatch-brief.mjs`, `dispatch-order.mjs`,
`card-figures.mjs`, `card-preflight.mjs`, `lane-fence.mjs` and
`session-economics.mjs` for `setTimeout`/`setInterval`/`createServer`/
`fs.watch`/`child_process`: two hits, both `node:child_process` imports
of the SYNC forms. If a future arm ever leaves a handle open the command
HANGS, which is loud; the call it replaced was silent.

### TWO FINDINGS THAT CHANGE HOW THIS IS RE-MEASURED

**1. THE LOSS IS A PROPERTY OF THE WRITE SHAPE, NOT ONLY OF THE READER.**
The card records that the loss point moves with the reader. It also moves
with the WRITER, and that half decides whether a body reproduces anything
at all. Measured at `209e5d3` with the defect fully present:

| invocation | write shape | to a file | `\| cat` | spawnSync |
|---|---|---|---|---|
| `--dispatch` | ONE `console.log` | 69,288 | 65,536 | 65,536 |
| `--audit` over 200 short figures | 200 small `console.log`s | 115,079 | **115,079** | **115,079** |
| `--audit` over ONE 90,000-char figure | ONE `console.log` | 90,822 | 65,794 | 65,794 |

**A 115 KB output lost NOTHING through either reader** — twice the buffer,
the defect entirely present, and both readers whole. The queue drains
between small writes. **A single write past one buffer is what loses**, so
a body that synthesises its oversize input by making it LONGER rather
than by making one WRITE longer proves nothing. `tests/brief-flush.spec.ts`
synthesises one 90,000-character line for exactly this reason and says so.

**2. `--dispatch` CANNOT SATISFY THE "BYTE-IDENTICAL" CRITERION, BY
CONSTRUCTION.** Its lane rows carry LIVE provenance —
`<- read <ISO timestamp> on <host>` — so two invocations differ at char
498 even when both are whole (measured: both 69,288 bytes, `cmp` differs
at line 6). Byte identity is only assertable on an arm stamped with TREE
provenance alone. `--audit` is that arm, which is the second reason the
proof body drives it.

### The margin guard, and what it immediately found

`tests/brief-flush.spec.ts` derives its threshold at run time from a
control writer of the pre-fix shape and **names the reader it derived it
against** (`spawnSync`, one write past the buffer). In this lane's run
that came out at **65,536 bytes, 3 of 3 samples** — not the card's
~66,470 for the same reader, which is the card's own "there is no single
boundary" reconfirmed rather than quoted.

Against that threshold, the announced margins:

    --dispatch                    69,288    3,752 PAST
    --task T-133 --state --full   64,919      617 UNDER
    --task T-133 --state          48,100   17,436 UNDER
    --task T-133                  41,153   24,383 UNDER
    --state                        6,946   58,590 UNDER
    --card T-133                   3,799   61,737 UNDER

**`--task <id> --state --full` sits 617 bytes under the line and nothing
anywhere said so.** That is a SECOND invocation shape near the boundary,
previously unnamed on this card or anywhere else; it is now printed on
every suite run. The guard also discloses, every run, whether any live
arm was past the threshold — so a green on a quiet board announces itself
as a smoke test instead of reading as proof.

### The sweep — every sibling that exits after writing, with its size

Measured at `209e5d3`, stdout only, redirected to a file. `brief.mjs` was
the ONLY member; the rest are non-members ON A MEASUREMENT.

| script | measured stdout | verdict |
|---|---|---|
| `brief.mjs` | 69,288 B (`--dispatch`) | **THE MEMBER — fixed** |
| `docs-gate.mjs` | 4,947 B (`--census`); 4,445 B fed all 586 tracked `docs/**.md` | non-member. Same shape as the defect, an order of magnitude under the buffer, and its answer is a fixed summary rather than one line per path — so the size does not scale with a merge diff. **Listed rather than dismissed.** |
| `health-bands-run.mjs` | 1,939 B (exit 3, bands awaiting keepers) | non-member |
| `gate-run.mjs` | 120 B for one suite | non-member — one `gate-verdict` line per suite, registry of four; the suite's own output goes to a FILE whose path is printed on stderr |
| `capabilities.mjs` | 36 B (`--check`) | non-member — the GENERATOR `writeFileSync`s the document and prints ONE line, so its stdout does not track the census |
| `lint-tokens.mjs` / `token-scan.mjs` | 105 B clean, 125 B `--selftest` | non-member (the two `token-scan` exits the wrapper cannot intercept were measured through it) |
| `orphan-drill.mjs` | 0 B stdout on the called-wrong path (338 B stderr) | non-member |
| `tauri-boot-check.mjs` | 0 B stdout on the refusal path (410 B stderr) | non-member |

**RESIDUAL, NAMED RATHER THAN PAPERED OVER:** the last two were measured
on their REFUSAL paths only. Their success paths spawn the app, and this
diff owes no boot gate, so their success output is bounded by an argument
(a fixed handful of `[nputer]` lines plus the child's last output) rather
than by a reading. Nothing was changed in any non-member: changing a
gate's exit statement is a control-flow change, and a measured
non-member did not earn one.

`tests/brief-flush.spec.ts`'s third body DERIVES that list from the tree
on every run, so a ninth command that exits after writing reds by name
and re-opens the argument instead of inheriting it.

### Did any body already depend on the truncation?

**No, and it was checked before the fix landed, not after.** Only one
spec-driven invocation exceeded the buffer at base (`--dispatch`, 69,288)
and its body FAILED rather than passing. The empirical proof is the
body-name diff between the two full runs: **3 added, 0 removed, 0 flipped
pass→fail.** 401 bodies / 1 failed at base → **404 bodies / 0 failed**
with the fix.

### The drill

Mutated `tools/e2e/scripts/brief.mjs`'s last statement back to
`process.exit(code)` — one side only, nothing else touched — and re-ran
the three new bodies. **All three red, each naming the defect:**

- proof body: spawnSync received **65,733** of **90,721** bytes
- margin guard: `--dispatch` spawnSync received **65,536** of **69,288**
- sweep: `brief.mjs` rejoined the derived set

Restored and proved by sha256 over the file, identical before and after:
`87272f4698fc2e0527869db8d1074b304834e960dc93284b4e4256e9b42c087a`.

### For the verifier

- **The proof body carries a POSITIVE CONTROL and it is load-bearing.**
  A green means "the writer no longer drops the tail" only if the readers
  CAN drop one on this machine, and this card records CI passing at
  `5e36a0b` with the brief 928 bytes past the `| cat` line. The control
  is a writer of the OLD shape, run through the SAME two readers, in the
  SAME run, asserted to lose. Delete it and the file becomes a check that
  cannot tell an absence from a refusal.
- **The `| cat` reader recovers the writer's exit status through a FILE,
  not through `PIPESTATUS`.** `PIPESTATUS` is a bash/zsh array and CI's
  `/bin/sh` is `dash`, which does not carry it — the dialect hazard
  `docs/CONVENTIONS.md` already prices. The spelling used is POSIX.
- **The margin guard compares SIZE for the live arms and BYTES for the
  synthesised one**, for finding 2 above. If the size comparison ever
  fails by a small delta with no `process.exit` in `brief.mjs`, suspect
  the worktree list moving between the two invocations before suspecting
  the flush; the failure message says so.

### Gates and what is routed

- **`capabilities:check` is STALE and this lane cannot fix it.** Adding a
  spec body regenerates `docs/CAPABILITIES.md`, which a `[tools/e2e]`
  fence does not carry. Committed 32,841 B → fresh 33,163 B (**+322**,
  three test-name sentences). This is `T-201` exactly, already on the
  board with `status: planned`; it is cited rather than re-filed. **The
  integrator regenerates** (`npm run capabilities` from tools/e2e/), in
  the same commit per that command's own rule.
- Nothing else was found outside the fence. The whole diff is
  `tools/e2e/scripts/brief.mjs`, `tools/e2e/tests/brief-flush.spec.ts`
  and this card.

### Where the brief was wrong

Nowhere on the mechanism, the fence or the ceremony — every claim the
dispatch made was re-derived here and held. Two figures moved with the
tree, as the correction clause anticipates: the brief cited `5e36a0b`'s
66,464 bytes to a file, and at `209e5d3` the same command answers 69,288
(the board grew and both lanes are live); and the card's ~66,470 loss
point for `spawnSync` derived as 65,536 in this environment. Both are the
card's own point about a moving figure, not errors in it.

## Verdict — APPROVED (2026-08-31, claude-opus-5@subagent, verifier)

Measured at tip `ab873e0` against base `209e5d3`, in the detached
verification worktree `/Users/ujju/Projects/nputer-V197b`, Darwin 25.6.0,
node v22.22.0, `NPUTER_E2E_PORT=15197` (derived from the card id; `lsof`
zero rows on both stacks before each bind; 1420 never probed). Blind
two-phase: the attack set was written from the card at `209e5d3` and
hashed before any diff, notes or lane branch was opened —
`3b7da6de0ec538e5b396d66aa0516d2604993f1fb76e465fcc6935bf0f0fa8fe`.

**The fix is real, minimal, and in the TOOL rather than in the spec.**

### THE MERGE CONDITION — not a defect in the diff, and it must not be dropped

`capabilities:check` is **GREEN at base and RED at this tip**: exit 0
`CURRENT (32841 bytes)` at `209e5d3`, exit 1 `STALE — committed 32841,
fresh 33163` at `ab873e0`. **This lane caused it**, it is a CI step, and
the lane could not fix it: `docs/CAPABILITIES.md` is outside
`touches: [tools/e2e]` and a fence is not widened from inside the lane it
fences. The executor routed to `T-201` — which exists, is `status:
planned`, and is titled for exactly this conflict — and named the
discharge. That was the right call of the three my attack set anticipated.

**THE INTEGRATOR RUNS `npm run capabilities` FROM tools/e2e/ AND COMMITS
THE RESULT IN THE MERGE COMMIT.** If it is skipped, the next
docs-touching lane inherits a red layers from its cause — which is the
precise harm this card was filed to remove, re-created by its own fix.

### What was attacked, and what held

Every discriminator below was named in the pre-diff attack set.

- **B2, the highest-value probe — a real drain, not a widened window.**
  `--dispatch` at tip: 67,737 bytes to a file; 67,737 through `| cat`
  **10/10**; 67,737 through a 2-second-delayed reader; 67,737 through a
  reader burning 40 ms per chunk. A `setTimeout`/`sleep` fix fails here
  and this does not.
- **B4, the fix is not spec-side papering.** Reproduced from a bare shell
  with no spec involved.
- **B5/G1.** Base `209e5d3`: **401 bodies, exit 1, RED**. Tip: **404
  bodies, exit 0, GREEN**. Exactly +3, nothing skipped or renamed away —
  no hidden dependent on the truncation.
- **D1, the decisive removal mutant.** Restoring `process.exit(code)`
  reds **all three** new bodies, each on its own distinct assertion
  ("spawnSync lost bytes the file destination received"; "--dispatch:
  spawnSync received 65536 where the file destination received 67737";
  "brief.mjs is back in the class this card removed it from"). Tree
  restored clean.
- **D2, and this is the pair that matters.** Shrinking the synthesis reds
  with *"the synthesised invocation is no longer past one pipe buffer, so
  this body proves nothing"* — poison shape TEN refused mechanically, not
  rhetorically. Neutering the positive control reds **both** dependent
  bodies. **The control cannot be silently neutered**, which was the open
  question my brief raised about every guard.
- **D3.** The synthesis is **90,721 bytes**, clearing both the 65,536 and
  the ~66,470 boundary. The attack that a synthesis clears only the
  smaller boundary — real for `| cat`, vacuous for `spawnSync` — does not
  fire.
- **D4.** Exact equality (`toBe` on full text), not containment. A prefix
  matcher would have passed the truncation mutant; this does not.
- **D5.** The oversize input is a file the body writes, so its size is a
  property of the spec and not of the board. The COVERAGE line
  **discloses** which case the run was — on this run *"1 of 6 live arms
  are past the derived loss point"*, so it was not the vacuous one.
- **E.** The threshold is derived at run time (65,536; samples
  65536/65536/65536), **names its reader**, and is not self-referential:
  threshold from a control writer, measurement from each arm. It found a
  second near-boundary shape nobody had named — `--task <id> --state
  --full` at **798 bytes under** the line in my run.
- **F1/F2.** My independent census, taken at base before the diff was
  opened, matches `EXITS_AFTER_WRITING` exactly; `brief.mjs`'s three
  remaining `process.exit(` hits are all inside the new comment. The
  sweep asserts an **exact set**, so it cannot pass over absent input —
  the "assert empty" shape I expected, and which reports absence of INPUT
  rather than absence of BUG, was not used. Sizes verified independently:
  docs-gate 4,947 B, lint-tokens 105 B, health-bands-run 1,939 B.
- **C1–C4, my predicted regressions, all absent.** The converted call is
  the file's last statement (514/514) and all 13 error paths are `return
  EXIT.x` from inside functions, so no control flow changed. Exit-code
  matrix identical to the defect shape across five paths
  (0/2/2/2/1). No hang (443 ms vs 435 ms). **No EPIPE**: `| head -1`,
  `| head -c 100`, `| grep -m1 .` and an immediate-close reader all exit
  0 with **zero bytes on stderr** — the card's own named reading motions
  are intact.
- **Fence and hygiene.** Diff is `tools/e2e/scripts/brief.mjs`,
  `tools/e2e/tests/brief-flush.spec.ts` and this card (never part of its
  own fence). No temp residue; `mkdtemp` under the OS temp dir, cleaned
  in `finally`; repo status clean after every run. No new dependency, no
  new input path, no secret.

### Gates at this tip

e2e **404 bodies GREEN** (blessed gate-runner, ref `ab873e0`) · parser
**344 passed** · app **1105 passed** (after the documented `npm run
build`; the 14 `app/dist` staleness failures on an unbuilt tree are
CONVENTIONS' named trap, not this diff) · typecheck 0 · lint:tokens +
`--selftest` 0 · lint:docs 0 · `index --check` 0 CURRENT ·
**capabilities:check 1 STALE — the merge condition above.**

### The two executor findings, adjudicated rather than accepted

**Finding 1, "the loss is a property of the WRITE SHAPE" — TRUE AS
MEASURED, FALSE AS GENERALISED.** The observation reproduces exactly: 200
small `console.log`s carrying 115 KB lose nothing through either reader.
But that holds only against a **fast** reader. Measured here, 5/5 runs:
the same 200-write shape truncates to **65,536** against a
`(sleep 0.5; cat)` reader, and 2,000 tiny writes to **65,493**. Write
shape does not decide loss; it decides whether the pipe ever FILLS. The
invariant is: **loss occurs iff bytes are still queued in userland when
`process.exit()` runs.**

This does not weaken the diff — the synthesis uses one long line, which
is the most reliable reproduction, and the sweep's non-membership
arguments rest on measured SIZE, not on write shape. But the generalised
claim is written into the spec comment (*"harder to lose, never easier"*)
and into the card, where a future lane could use it to argue a genuinely
at-risk script into non-membership. Filed as a suggestion, not a block.

**Finding 2, "`--dispatch` cannot satisfy byte-identity BY
CONSTRUCTION" — TRUE OBSERVATION, TOO-STRONG CONCLUSION.** Confirmed: two
whole invocations both measure 67,737 here and differ at char 500 on live
`<- read <ISO> on <host>` stamps. But the stamps are **fixed-width**, and
normalising them makes the file and pipe outputs **byte-identical**. So
the criterion is satisfiable on `--dispatch`, not impossible — "not
directly, without normalisation" is the accurate statement. The
criterion is in any case **met** by the diff, byte-for-byte, on the
deterministic `--audit` arm, and choosing a tree-stamped arm for the
byte assertion is the better engineering. Suggestion, not a block.

### Two figures that differ from the executor's, with their refs

Both are the card's own moving-figure point and neither is an error.
(1) The base failure: the executor's tree failed on `Expected substring:
"critical path:"`; mine failed on `unstampedLines(...)`. Same defect, a
different cut point, because what falls past the buffer moves with the
board — the card predicts exactly this. (2) `capabilities.mjs --check` is
listed at 36 B; on the STALE path at `ab873e0` stdout is **0 B** with 107 B
on stderr. The 36 B is the CURRENT path. The non-membership conclusion is
unaffected; the table does not say which path it measured.
