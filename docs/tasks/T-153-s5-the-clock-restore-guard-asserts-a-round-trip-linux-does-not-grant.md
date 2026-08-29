---
id: T-153-s5
title: token-scan's clock-restore guard asserts an exact mtimeMs round-trip that Linux does not grant, so the e2e lane's first Linux run reds two bodies main cannot fix while the fence is held
feature: F-01
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [tools/e2e]
suggested_by: integrator nputer-4e @T-153-s2 checkpoint
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**PROMOTED AT FILING (2026-08-29, integrator, the T-153-s2 checkpoint's
CI watch)** on the same standing authorization that promoted T-153-s2:
it is a blocker on main's first-ever green CI run, and the block is
measured, not predicted.

## The evidence — CI run 33259394002, the e2e lane's FIRST Linux contact

229 passed / 5 failed. Three of the five are the shallow-clone class,
fixed at the same checkpoint by `fetch-depth: 0` in ci.yml (the specs
READ git history; depth-1 hands them a one-commit repository). The two
this card owns:

- `token-scan.spec.ts:106` — "one runtime-built control byte reds all
  seven first-party roots at exact byte offsets": red at the line-163
  guard, `app/package.json restored its MTIME too`.
- `token-scan.spec.ts:227` — "P6 reds a planted bare motion utility
  and leaves its motion-safe twin alone": red at the line-272 twin of
  the same guard, `tools/e2e/fixtures/shell.ts`.

Both guards assert `statSync(target).mtimeMs` EXACTLY equals the
pre-plant `clock.mtimeMs` after a byte-exact restore plus a
`utimesSync` clock restore. Green on every macOS run this repository
ever made; red on ubuntu-24.04 on first contact.

## Why this is the T-130-s1 family, not a new mystery

The amnesty absorbed T-130-s1 into `T-111-s10` carrying the
measurement that predicts this: mtime round-trips are PRECISION-FRAGILE
— on the measuring platform, fresh writes land on sub-millisecond
mtimes, the Date form round-trips 0 of 50 and the seconds form 50 of
50. The guard's exact-`mtimeMs` equality is a fourth spelling of the
same trap, and Linux's filesystem is the second platform the spelling
never met. Derive the exact divergence ON LINUX (CI is the only Linux
this project has): stamp what `utimesSync` wrote and what `statSync`
read back, at full float precision, into the run log.

## What the guard is FOR — do not delete it to fit

The spec's own comment (token-scan.spec.ts:166–172) records why the
clock restore exists: `git diff --quiet` answers from the index's
cached stat info, and a restore that moves the clock produced a
red-green-green intermittent (P6's history). The guard proves the
restore restored the clock. That intent survives; only the assertion's
precision is wrong.

## Acceptance criteria

- THE lane SHALL first MEASURE the divergence on Linux (one CI cycle
  with the stamped read-back is acceptable evidence) and record it on
  this card.
- THE guards at token-scan.spec.ts:163 and :272 SHALL assert the clock
  restore at a precision BOTH platforms round-trip (derived from the
  measurement, not guessed) — or, if the measurement shows no such
  precision exists, assert the restore's PURPOSE instead (the empty
  `git diff --quiet` plus the P6 exactness that follow) and record the
  demotion with the T-130-s1 lineage cited.
- THE load-bearing halves SHALL NOT weaken: byte-exact sha256 restore,
  the empty-diff proof, P6's exactly-one-hit and offset assertions all
  stand as written.
- THE fix SHALL be proven where the defect lives: a full-suite CI run
  green on Linux, cap 3 CI cycles, each cycle's read stamped.
- WHEN the fence is the question: this card's `touches: [tools/e2e]`
  is HELD by T-156's live lane at filing — dispatch AFTER that lane
  lands; the lane list is the authority, and reaching in from an
  unfenced seat is the T-154-s2 class this project refuses.

## Implementation notes

**CONFIRMATION OF UNDERSTANDING, written before anything was touched.**
This lane owns one defect: the two plant-and-restore bodies in
`tools/e2e/tests/token-scan.spec.ts` assert `statSync().mtimeMs` EXACTLY
equal to a pre-plant reading after a byte-exact restore plus a
`utimesSync` clock restore — green on every macOS run this repository has
made, red on ubuntu-24.04 on first contact. The job is to MEASURE the
divergence on Linux first (CI being the only Linux this project has),
then assert the clock restore at a precision BOTH platforms round-trip
derived from that measurement, or demote to the restore's PURPOSE with
the T-130-s1 lineage cited; to leave the load-bearing halves (sha256
byte-exact restore, the empty `git diff --quiet` over all seven targets,
P6's exactly-one-hit and line-offset assertions) exactly as written; to
prove it where the defect lives inside a cap of three CI cycles with each
cycle's read stamped; and to work only inside `touches: [tools/e2e]` plus
this card and new suggestion cards. **The card and the standing docs did
not conflict anywhere**, and no criterion needed a path the fence does
not hold.

### THE MEASUREMENT — what Linux does, stamped into the run log

CI run **33264083542** (`pull_request`, PR #3, this lane, at `5970bf6`),
e2e lane step, verbatim from the log:

    T-153-s5 clock restore, seven first-party roots, on linux
    node v22.23.2 uv 1.51.0:
      app/package.json          -691ns of 1489
      docs/NORTH_STAR.md        -253ns of 1489
      lib/parser/package.json   -999ns of 1489
      tools/e2e/package.json    -359ns of 1489
      method/README.md          -409ns of 1489
      AGENTS.md                  -75ns of 1489
      .github/workflows/ci.yml   -75ns of 1489
    T-153-s5 clock restore, P6 plant target, on linux
    node v22.23.2 uv 1.51.0:
      tools/e2e/fixtures/shell.ts -359ns of 1489

The same code and the same commit on darwin/APFS/node v22.22.0/uv 1.52.0,
`NPUTER_E2E_PORT=14538` in this lane at `5970bf6`:

      app/package.json          -170ns    docs/NORTH_STAR.md   -63ns
      lib/parser/package.json   +112ns    tools/e2e/pkg.json  -130ns
      method/README.md          -100ns    AGENTS.md          -138ns
      .github/workflows/ci.yml   -25ns    shell.ts            +45ns

**READ THOSE DARWIN FIGURES WITH THEIR CONDITION, or you will think they
are wrong.** They are from the FIRST run in a freshly cut worktree, where
every target's mtime was written by `git checkout` and is kernel-fresh. A
SECOND run of the same suite over the same tree stamps **0ns for all
eight**, because the first run's restore already wrote those mtimes
through `utimesSync` and a value that came out of `utimesSync` is a fixed
point of it — measured again on this lane's final tree, 281 passed, all
eight at 0ns. The CI figures do not have this problem: a runner checks
out fresh every time, which is why both CI cycles measure a real restore
and a re-run in a warm worktree measures nothing at all. It is also the
whole of why drill mutant M3 missed below.

A SECOND Linux sample, CI run **33265405734** (cycle 2, at `cb216a1`),
same runner image, same eight targets:

    T-153-s5 clock restore, seven first-party roots, on linux
    node v22.23.2 uv 1.51.0:
      app/package.json         -1005ns of 1489
      docs/NORTH_STAR.md         -44ns of 1489
      lib/parser/package.json   -944ns of 1489
      tools/e2e/package.json    -316ns of 1489
      method/README.md          +109ns of 1489
      AGENTS.md                -1016ns of 1489
      .github/workflows/ci.yml -1016ns of 1489
    T-153-s5 clock restore, P6 plant target, on linux
    node v22.23.2 uv 1.51.0:
      tools/e2e/fixtures/shell.ts -316ns of 1489

**THE SECOND SAMPLE CORRECTS THE FIRST, AND THE CORRECTION IS THE
INTERESTING HALF.** From cycle 1 alone the honest reading looked like
*every Linux delta is negative and strictly inside one microsecond, the
largest -999 — one nanosecond short of the quantum*. **That reading is
FALSE**, and cycle 2 falsified it three ways at once: **-1005**, **-1016**
twice, and a POSITIVE **+109**. Sixteen samples in, the true statement is
the one the bound was computed from rather than the one the first sample
suggested — the error is the microsecond truncation PLUS two float terms
that are real, are signed, and can carry the total past the quantum in
either direction. Max |Δ| over both Linux cycles: **1016 ns**, against a
computed bound of 1489 and a computed worst case of 1241. Had this card
shipped on one sample it would have carried a sentence the very next run
disproved, which is this repository's own *a figure needs a keeper*
arriving as a near miss.

**AND THE TWO PLATFORMS STILL DIFFER IN SHAPE.** Darwin's eight are
bounded by **170 ns** and never approach the quantum; Linux's sixteen
reach **1016** and cluster near it. That gap is the whole finding, and it
is the gap an exact-equality assertion sat on.

**THE MECHANISM.** `utimesSync` takes SECONDS AS A DOUBLE and hands it to
libuv. On Linux `uv__fs_to_timespec` truncates the nanosecond field to a
whole MICROSECOND (`ts.tv_nsec -= ts.tv_nsec % 1000`, a deliberate
cross-platform compatibility hack carrying its own `TODO` in libuv)
before `utimensat` sees it; the Darwin path carries nanoseconds through.
So Linux stores a clock up to one microsecond BELOW the captured one, and
`mtimeMs` — whose own double steps in 244 ns at this epoch — cannot spell
that away. The old assertion was not measuring the restore; it was
measuring the measuring platform.

**THE LINEAGE.** This is the T-130-s1 family in its fourth spelling.
That finding lives in `T-111-s10`'s `Absorbs:` lines and carries the
measurement that predicted it — *50 of 50 fresh writes land on a
sub-millisecond mtime, the Date form round-trips 0 of 50 and the seconds
form 50 of 50* — all of it Darwin, and none of it saying so. The seconds
form is still the right form. What was wrong was the inference from
*round-trips 50 of 50 here* to *round-trips exactly*.

### THE CHANGE

One bound, one implementation, both bodies, at NANOSECOND precision
rather than at `mtimeMs`'s — which makes the guard STRICTLY TIGHTER than
the delta it replaces was able to express, not looser:

- `CLOCK_QUANTUM_NS` (1000) + two ULPs of the captured `mtimeMs`, and the
  ULP is COMPUTED from the value by `ulpOf` rather than typed, because it
  doubles at the next binade. 1489 ns at this epoch against a worst case
  of 1241 (122 + 119 + 1000, every term named in the comment).
- `expectClocksRestored` STAMPS the read-back for every target BEFORE it
  asserts, so the measurement reaches the log whether the guard passes or
  fails and whether or not the first target is the one that diverges. A
  standing instrument, not a one-run probe.
- The three load-bearing halves are untouched, byte for byte: the sha256
  restore loop, the `git diff --quiet` over all seven targets, and P6's
  `[P6:` count plus its two line assertions. Both bodies ran end to end
  on Linux in run 33264083542 and passed, so those halves are now proven
  on Linux for the first time as well.

### THE DRILL

Committed FIRST (`5970bf6`), then drilled in a DETACHED scratch worktree
at that commit, `/Users/ujju/Projects/nputer-T153s5-drill`, one stem
(`t153s5`) spent on the worktree, the driver and the results file. The
driver's guard checks HEAD, detachment and a clean tree — its OWN drill,
not the shared prefix. Every mutation was READ BACK with `git diff`
before its suite ran, and every restore proved before the next mutant.

| mutant | one side | expected | observed |
|---|---|---|---|
| M1 body 1's `utimesSync` removed | code under test | that body reds | **1 failed / 280 passed of 281** — WHOLE SUITE, failing-body count exactly ONE, which is the shape-six answer: no other body kills it |
| M2 body 2's `utimesSync` removed | code under test | P6 body reds | 1 failed / 9 passed |
| M3 tolerance forced to zero | assertion | both red | 1 failed — **and the miss is the finding**, see below |
| M3b the same, after `touch`ing all eight targets | assertion | both red | **2 failed / 8 passed** |
| M4 both restores land TWO microseconds late | code under test | both red | **2 failed / 8 passed** — the bound discriminates at the MICROSECOND scale, not merely at the plant's hundreds of milliseconds |
| margin probe: both restores ONE microsecond late | code under test | GREEN — one quantum is what the bound must tolerate | 10 passed, exit 0 |

**WHY M3 MISSED, AND IT IS NOT A DEFECT IN THE GUARD.** M2 had just run
with the P6 restore REMOVED, so that target's mtime was kernel-fresh
while the other seven had been written by M1's run THROUGH `utimesSync`
— and a value that came out of `utimesSync` is a FIXED POINT of it, so a
zero tolerance is satisfied and the mutant survives. The state the
assertion reads had been written by the previous run of the same suite.
Re-run as M3b with all eight `touch`ed first, the identical mutant redded
both bodies. Routed as `T-153-s7`, because the sentence belongs in
`docs/CONVENTIONS.md`'s POISON DRILL bullet and this fence cannot reach
it.

Restoration proof, drill worktree at `5970bf6e578a9fe4db57ad9e59a60e7eccbdc25f`:
`git status --porcelain` EMPTY, and
`git show HEAD:tools/e2e/tests/token-scan.spec.ts | shasum -a 256` ==
the working file at
`8d4175402d4046dfb0bc9e581b809d35d9c9fbfdbc5c5022fdefbebf77cb7234`.
`docs/CAPABILITIES.md` was generated once in the same worktree to measure
`T-153-s8` and restored to
`5a8a8e4c544bbc3506b306604556afa495f0fcf2309d9f922e693f46f1e06b6d`.

### THE SWEEP — A FIX NAMES ITS CLASS

Class: **an assertion comparing a filesystem timestamp for EXACT
equality**. Search, from the repo root at `5970bf6`, over `*.ts *.tsx
*.mjs *.js *.rs`:

    git grep -nE "(toBe|toEqual|===|assert_eq!)[^;]*(mtime|atime|ctime)|(mtime|atime|ctime)[A-Za-z]*[^;]*(toBe\(|toEqual\(|===|assert_eq!)"

Result at the tip: **no site remains**. Four hits, all
`toBeGreaterThanOrEqual` — ordering comparisons, tolerant by
construction — plus one hit inside this lane's own new comment. The Rust
`modified()` sites in `nputer-index` are ordering comparisons too.
**THE SWEEP IS SHOWN CAPABLE OF FAILING BEFORE ITS ZERO IS WRITTEN
DOWN**: the same pattern finds a planted
`expect(statSync(p).mtimeMs).toBe(clock.mtimeMs)` at exit 0, and finds
BOTH pre-fix sites (`:164`, `:273`) in
`git show 09504e8:tools/e2e/tests/token-scan.spec.ts`.

### CI CYCLE LEDGER — cap 3, two spent

**Cycle 1 — run 33264083542**, `pull_request` on PR #3 at `5970bf6`.
Verdict `failure` at the RUN level and **success at the body level, which
is this lane's stated condition**: `token-scan.spec.ts:210` and `:341`
(the bodies that were `:106` and `:227` before this diff) both **PASSED**,
with the read-back stamped above. e2e lane 31 failed / 250 passed of 281.
Every earlier step green, including `graph currency (index --check)`,
`docs gate (whole-tree half)`, `e2e types`, the cargo suite and
`cargo audit`.

**Cycle 2 — run 33265405734**, `pull_request` on PR #3 at `cb216a1`.
Same verdict shape and the same arithmetic: `token-scan.spec.ts:215` and
`:346` — the same two bodies, moved by two lines of comment — both
**PASSED**, all ten bodies in the file green, e2e lane **31 failed / 250
passed of 281**, and the failing set is byte-for-byte the same thirty-one
as cycle 1: twenty-nine `pull_request`-checkout, two `T-153-s6`. Its stamp
is the second Linux sample above and it is the reason a sentence in this
card was rewritten rather than shipped.

**Cycle 3 — the run this commit triggers**, on the tip below, whose only
difference from `cb216a1` is this card's prose. Its verdict is in this
lane's report rather than in this file, because a commit cannot record the
id of the run it causes. The cap is 3 and this is the third.

**THE 31 ARE THREE CLASSES AND NONE OF THEM IS THIS CARD'S.**
Two are `T-153-s6`'s, exactly as the dispatch predicted:
`docs-input-gate.spec.ts:906` and `range-rule.spec.ts:91`.
**Twenty-nine are a class nobody had seen**, and they are NOT a Linux
divergence — they are a `pull_request` CHECKOUT divergence:
`actions/checkout` leaves a PR at a detached merge ref with no local
`main`, and `dispatch-brief.mjs`/`card-figures.mjs` spend the integration
branch as a bare revision, so `git log --first-parent --format=%H %s
main` throws *"fatal: ambiguous argument 'main'"*. All twenty-nine are
**green at the same body indices** in run 33260414204, main's own `push`
run. Filed as `T-153-s9`, with the run pair, the body list and the two
call sites.

### COMMANDS, in the order run, each read from `$?` unpiped

| command | cwd | exit |
|---|---|---|
| `npm ci` then `npm run build` | lib/parser | 0 |
| `npm ci` | app | 0 |
| `npm ci` | tools/e2e | 0 |
| `npm run typecheck` | tools/e2e | 0 |
| `npx playwright test tests/token-scan.spec.ts` | tools/e2e | 0 (10 passed) |
| `npm test` | tools/e2e | 0 (**281 passed**, 2.6m) |
| `npm run lint:tokens -- --selftest` | tools/e2e | 0 |
| `npm run lint:tokens` | tools/e2e | 0 (TOKEN 150 files; CONTROL 849 tracked text files) |
| `npm run lint:docs` | tools/e2e | 0 |
| `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri | 0 — CURRENT, 1021562 of 1040000 bytes, 189 files, 2157 symbols, 2111 edges |
| `npm run capabilities:check` | tools/e2e | **1 — STALE**, and STALE identically at the base; routed as `T-153-s8` |

Every figure above is at `5970bf6` unless it names another ref. The
lane's final tree re-runs `npm test`, `lint:tokens`, `lint:docs` and
`typecheck` before the cycle-2 push; those exits are in the report.

### STANDING GATES, derived from the merge diff and not from habit

Executor's range, per the RANGE RULE's second row:
`TREE=$(git merge-tree --write-tree 95cf2d0 HEAD)` (exit **0**, tree
`b05ad1a3`), then `git diff --name-only 95cf2d0 "$TREE"` — **1 path** at
`5970bf6` (`tools/e2e/tests/token-scan.spec.ts`), and with this commit's
card files, paths under `docs/tasks/` besides. `95cf2d0` is main's tip as
read in this checkout, one commit AHEAD of this lane's base.

- **GRAPH REGEN — FIRES** (a `.ts` outside `docs/`). ASKED, not
  predicted: `index --check` exits **0, CURRENT**, here and in CI, which
  is the trigger being deliberately wider than the walk (`tools/` is
  `.nputerignore`d). No regen owed.
- **BOOT GATE — NOT OWED.** No path under `app/src-tauri/**` or
  `app/src/**`, and neither manifest.
- **DOCS GATE — FIRES**, on four `docs/tasks/*.md`. Both halves were run,
  not one. WHOLE-TREE: `npm run lint:docs` from tools/e2e, exit **0**
  (every live card's frontmatter parses with a legal status; four budgets
  hold) — CI runs the same step and it was green in both cycles. DIFF
  HALF, the one spelling, fed the RANGE RULE's own path list:
  `node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only 95cf2d0 "$TREE")`
  exits **1 — FIRES**, naming 22 derived readers across 4 suites and
  owing THREE commands. All three RUN and GREEN at this tip:

  | owed | result | exit |
  |---|---|---|
  | `npm test` from app/ (after `npm run build`, exit 0) | 1013 passed, 47 files | 0 |
  | `npx vitest run` from lib/parser/ | 314 passed, 15 files | 0 |
  | `npm test` from tools/e2e/ | 281 passed | 0 |

  The app and parser suites are the ones a card-only diff has twice taken
  red in this repository (`9c64cd8`, `fede266`), and three cards landed
  here — so this is the gate doing the job it was written for rather than
  a formality.
- **METHOD EVAL GATE — NOT OWED.** No path under `method/**`.

### WHERE THE BRIEF WAS WRONG, plainly

1. **The lane list was incomplete by the time work started, and it could
   not have been otherwise.** The brief named no live sibling; at
   `95cf2d0` the repository holds `../nputer-T-127s1` on
   `task/T-127-s1-cycle-fence-reaches-fixtures`, dispatched one commit
   AFTER this lane. Its `touches:` is
   `[docs/architecture/components/, app-shell, lib-parser]` — disjoint
   from `[tools/e2e]`, re-derived here rather than taken on faith. A lane
   list is a live-environment fact and this is that rule paying for
   itself.
2. **The brief's setup order is short by one package.** It says
   *lib/parser `npm ci` + build FIRST, then tools/e2e `npm ci`*. The lane
   spawns the app's vite dev server (`playwright.config.ts`'s `webServer`
   runs `npm run dev` in `appDir`), so `app/` must be installed too or
   the whole suite fails at the web server. `docs/CONVENTIONS.md`'s
   fresh-worktree bullet already says a fresh worktree has nothing
   installed in any of the three packages; the brief transcribed two of
   the three.
3. **"A run red ONLY on those two ... is YOUR SUCCESS CONDITION" was
   true of the bodies and wrong about the run.** The run reds
   THIRTY-ONE ways from the seat the brief gives a lane, twenty-nine of
   them the `pull_request` checkout class above. The advice under it —
   *read the per-body results, not the run's colour* — is what saved it,
   and is the sentence that should outlive this card.
4. **The suite size held.** The brief said 281 at the base; 281 is what
   ran locally and in CI. Recorded because it is the one figure that
   reproduced unchanged.

### WHAT WAS NOTICED AND NOT DONE — three routed suggestions

- **`T-153-s7`** — the clock sentence T-130-s1's measurement is missing
  (it is a Darwin measurement that does not say so) plus the poison shape
  M3 walked into. Wants `docs/CONVENTIONS.md`, and asks to be taken WITH
  `T-111-s10` rather than as a fourth pass over the same bullet.
- **`T-153-s8`** — `docs/CAPABILITIES.md` is STALE by one behaviour at
  this lane's base and at its tip (committed 21886 bytes, fresh 21992;
  census says 280, the suite runs 281), and `capabilities:check` appears
  in no CONVENTIONS command bullet, no ci.yml step and no spec. A figure
  with no keeper, which is what `CLAUDE.md` sends every session to read
  first.
- **`T-153-s9`** — the `pull_request` checkout class above, with both
  runs, all twenty-nine bodies and the two call sites.

None of the three was built. Each names the fence it needs.

### LEAST-CONFIDENT POINT

**The bound's margin is a factor of 1.5, not a factor of 10, and the
sample that would have made me overconfident arrived one cycle before the
sample that corrected it.** 1489 ns computed, 1241 ns worst case
reasoned, **1016 ns** the largest of sixteen Linux observations. Cycle 1
alone said 999 and looked like a clean law; cycle 2 said -1016 and +109
and turned it back into a distribution. Sixteen samples on one runner
image is not a lot of evidence about a bound, and the term I have least
purchase on is the one I did not measure: libuv's quantum is READ OFF ITS
SOURCE, not observed in isolation, so a platform that quantised at a
coarser grain — or a filesystem where `mtimeNs` and `mtimeMs` came from
different clocks — would put the bound on the wrong side of the truth. I
did not widen it to buy comfort, because a bound wide enough to be
certainly safe stops being a guard. **That is the whole reason the stamp
is permanent and prints on every run**: the next surprise should arrive
as a number in a log rather than as a red somebody has to reproduce, and
this card has already had one.

## Verdicts
