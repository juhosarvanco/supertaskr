---
id: T-153-s5
title: token-scan's clock-restore guard asserts an exact mtimeMs round-trip that Linux does not grant, so the e2e lane's first Linux run reds two bodies main cannot fix while the fence is held
feature: F-01
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [tools/e2e]
suggested_by: integrator nputer-4e @T-153-s2 checkpoint
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

**AND THE TWO TOOLCHAINS STILL DIFFER IN SHAPE** (corrected at merge —
the axis is the libuv VERSION, not the platform: v1.51.0 truncates
under one `#if` naming `__APPLE__` and `__linux__` together, v1.52.0
deletes the hack; verdict, correction 1). The uv-1.52.0 Mac samples
are bounded by **170 ns** and never approach the quantum; the
uv-1.51.0 CI samples — 24 over three runs, the third stamped in run
33266566174 — reach **1016** and cluster near it (correction 3). That
gap is the whole finding, and it is the gap an exact-equality
assertion sat on — and a runner-image bump moves it with no platform
changing, which is why `process.versions.uv` prints on every run.

**THE MECHANISM.** `utimesSync` takes SECONDS AS A DOUBLE and hands it to
libuv. In libuv v1.51.0 `uv__fs_to_timespec` truncates the nanosecond
field to a whole MICROSECOND (`ts.tv_nsec -= ts.tv_nsec % 1000`, a
deliberate compat hack carrying its own `TODO`) before the syscall sees
it — under ONE `#if` naming `__APPLE__` and `__linux__` together;
v1.52.0 deletes the hack (verdict, correction 1 — the axis is the
VERSION, and the CI runner ships 1.51.0 while the measuring Mac ships
1.52.0). So a 1.51.0 host stores a clock up to one microsecond BELOW the captured one, and
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
rather than at `mtimeMs`'s. CORRECTED AT MERGE (verdict, correction
2): only the INSTRUMENT is tighter — the read-back is nanosecond and
stamped — while the acceptance BAND is ~6x wider than the exact
equality it replaces (measured: deltas of 173-1296 ns pass the new
bound and failed the old). The widening is deliberate: the old
equality was green only where one toolchain round-trips exactly.

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
reasoned, **1016 ns** the largest of 24 Linux observations over three cycles (correction 3). Cycle 1
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

### 2026-08-29 — APPROVED WITH ASSIGNED CORRECTIONS

**verifier claude-opus-5@subagent, independent hand.** Base
`09504e8`, tip `2eaa8f0`, pair `git diff 09504e8..2eaa8f0`. Every figure
below is my own measurement at the ref it names; nothing is transcribed
from the executor's notes. Battery run in the lane worktree at `2eaa8f0`
with `NPUTER_E2E_PORT=14577` (lsof zero rows first); drill run in a
DETACHED scratch worktree at `2eaa8f0`, root `/private/tmp/nvt153s5`,
one stem `nvt153s5` on the worktree, its `CARGO_TARGET_DIR`, the driver
and the results file; CI read-only via `gh`, nothing pushed, no run
triggered.

**THE GUARD IS RIGHT AND I COULD NOT FALSIFY THE BOUND.** The three
corrections below are all PROSE, and each one is a sentence about the
MECHANISM that my own reading of the source says is false. They change
no behaviour, and I have assigned rather than rejected because the
assertion the lane ships is correct under both readings.

#### CORRECTION 1 — the axis is the libuv VERSION, not the platform

`tools/e2e/tests/token-scan.spec.ts` (the block headed *THE ASYMMETRY IS
libuv'S, NOT THE FILESYSTEM'S*), this card's *THE MECHANISM* paragraph,
and `T-153-s7`'s body and title all say the truncation is a LINUX path
and that *"the Darwin path carries the nanoseconds through"*. I read
libuv's own source rather than inferring it, via `gh api
repos/libuv/libuv/contents/src/unix/fs.c?ref=<tag>`:

- In **v1.51.0** — the version the CI stamp names — `uv__fs_utime` calls
  `uv__fs_to_timespec` under ONE `#if` whose condition names
  `__APPLE__` **and** `__linux__` in the same list (with the BSDs,
  `__sun`, `_AIX71`), ending `return utimensat(AT_FDCWD, req->path, ts,
  0);`. There is no second branch for Darwin: `uv__fs_to_timeval` does
  not exist in the file. **The truncation is not platform-conditional.**
- In **v1.52.0** the two truncation lines and their `TODO` are GONE:
  `diff` of `uv__fs_to_timespec` between the tags is exactly the removal
  of the `TODO(bnoordhuis)` comment and `ts.tv_nsec -= ts.tv_nsec %
  1000;`. Nothing else in the function changed.

The two samples the card contrasts differ in BOTH variables and the card
attributed the difference to the wrong one: CI is **node v22.23.2 / uv
1.51.0** (truncating) and this machine is **node v22.22.0 / uv 1.52.0**
(not), and the uv version is NOT monotonic in the node version. My own
Darwin probe writes sub-microsecond mtimes through `utimesSync` and reads
them back intact — `1700000000.000000123` stores as `mtimeNs
1700000000000000238`, residue 238, not 0 — which is what a reader will
find if they go looking for the Darwin exception the comment promises,
and will not find on a Darwin machine running uv 1.51.0.

**Assigned:** rewrite those three passages to say the quantum is present
in libuv **≤ 1.51.0 on every utimensat platform, Darwin included**, and
removed in **1.52.0**; that `CLOCK_QUANTUM_NS` is therefore an UPPER
bound that stays valid under both and unconditional in the code is
correct; and that the discriminating variable is the one the guard's own
stamp already prints, `process.versions.uv`. `T-153-s7` matters most
here: it is the card that will write this sentence into
`docs/CONVENTIONS.md`, and its title currently promises *"a Linux half"*.

#### CORRECTION 2 — the band WIDENED; only the instrument got tighter

*THE CHANGE* says the new form is *"STRICTLY TIGHTER than the delta it
replaces was able to express, not looser"*. The instrument half is true
and worth keeping. The band half is false, and measured false:

| achieved delta | old `toBe(clock.mtimeMs)` | new bound (1489 ns) |
|---|---|---|
| 81 ns | PASS | PASS |
| 173 ns | **FAIL** | PASS |
| 244 ns | **FAIL** | PASS |
| 526 ns | **FAIL** | PASS |
| 1107 ns | **FAIL** | PASS |
| 1296 ns | **FAIL** | PASS |
| 1504, 1556, 1946 ns | FAIL | FAIL |

Nine offsets driven through the real pipeline on darwin/APFS: **five
deltas are accepted by the new bound that the old assertion rejected,
and none the other way**. The largest divergence two equal `mtimeMs`
doubles can hide is ONE ULP of `mtimeMs`, **244.140625 ns** at this
epoch, so the accepted band went from under a quarter-microsecond to
1489 ns — about **six times wider**. That widening is what criterion two
REQUIRED, since 244 ns is not round-trippable under a 1000 ns quantum;
the honest sentence is *the instrument became exact and the band had to
widen*, and a reader who takes "strictly tighter" at face value will
derive the next bound wrong.

#### CORRECTION 3 — cycle 3 is knowable now, and the census moved

The card's *"sixteen Linux observations"* and *"cap 3, two spent"* are
true at the ref they were written at, and its cycle-3 row is a
placeholder because a commit cannot record the run it causes. Run
**33266566174** at `2eaa8f0` now exists. Folding it in, from the logs
themselves: **24 stamped samples over three runs**, min **-1016**, max
**+109**, max |Δ| **1016 ns** — the headline figure is UNCHANGED at the
larger sample. **Assigned:** stamp the third cycle's id and its eight
readings and correct the two figures, or ref-stamp the sixteen.

#### THE BOUND, ADVERSARIALLY — every term re-derived

- **The quantum.** `ts.tv_nsec -= ts.tv_nsec % 1000` truncates toward
  zero, so its contribution lies in `(-1000, 0]` — one-sided and
  negative, which is exactly the shape of the CI data: **23 of 24
  samples negative**, one `+109`.
- **The ULP terms.** `ulpOf` is CORRECT and it does double at the binade.
  Checked against a `nextafter` computed by bit manipulation: exact
  agreement at today's `mtimeMs`, at today's seconds, at `2**40`,
  `2**41 - 1`, `2**41`, `2**41 + 1`, `2**30` and `2**31 - 1`; the ratio
  `ulpOf(2**41) / ulpOf(2**41 - 1)` is **exactly 2**, 244.140625 ns
  becoming 488.28125 ns, and the tolerance a 2040 timestamp produces is
  **1977 ns**. It is not a typed constant and it must not become one.
  Its one imprecision is safe by direction: within the last ULP below a
  power of two `Math.log2` rounds up and `ulpOf` returns TWICE the true
  ULP — it never under-reports.
- **The arithmetic.** `2 * ulpOf(capturedMs)` = 488.28 ns covers the two
  half-ULP roundings (122.07 of `mtimeMs`, 119.21 of the seconds double)
  with room; and it stays covering at the worst binade alignment, where
  the seconds ULP can reach 1.95x the `mtimeMs` ULP and the pair sums to
  360 ns against the allowance of 488.
- **THE TWO-ULP TERM IS LOAD-BEARING, NOT DECORATION**, and the CI data
  proves it: **3 of the 24 samples exceed the bare quantum** (-1016,
  -1016, -1005). A bound of exactly 1000 would have REDDED CI.
- **The float terms are corroborated by their own extreme.** Across 64
  darwin/uv-1.52.0 samples of my own — one suite run's eight, two
  mutant runs' eight each, a 40-sample synthetic probe — the widest
  delta is **240 ns**, against a reasoned two-half-ULP worst case of
  241.3. Observed and reasoned agree to a nanosecond.
- **The stamp is a real instrument.** It reads every target BEFORE the
  first assertion, and I confirmed it reaches the log on FAILURE as well
  as on success: M1a, M1b and M3-fresh all printed their stamps while
  redding. In CI it is present in all three runs, complete, unwrapped.

#### THE DRILL — my own mutants, at `2eaa8f0`, `/private/tmp/nvt153s5`

Committed first (detached at a named commit), every mutation READ BACK
with `git diff -U0` before its suite ran, every restoration proved by
`git show HEAD:… | shasum -a 256` against the working file —
`63a765c0a0d693c679d818349760cc19fbc2510ab674e06976ac3c61aac73688`,
matched after each of the eleven. No graph regen inside the worktree.

| mutant | one side | observed |
|---|---|---|
| B0 baseline | — | **281 passed, exit 0** |
| M1a restore removed, seven-roots body only | code | **1 failed / 280 passed of 281** — failing-body count exactly ONE, delta stamped at 322 701 430 804 ns |
| M1b restore removed, P6 body only | code | **1 failed / 280 of 281** — exactly ONE, delta 482 441 606 683 ns |
| M2a restore 900 ns late (achieved 953–1030) | code | GREEN, 10 passed |
| M2b restore 1400 ns late (achieved **1430–1431**) | code | GREEN — the bound exercised to 96% of itself |
| M2c restore 1600 ns late (achieved 1669) | code | **2 failed / 8** |
| M2d restore 2000 ns late (achieved 1907–1908) | code | **2 failed / 279 of 281** |
| M2e restore 2000 ns EARLY (achieved -1907/-1908) | code | **2 failed / 279 of 281** — the negative side is guarded |
| M3-trap tolerance forced to 0, targets left as B0 restored them | assertion | **SURVIVED — 281 passed, exit 0**, every stamp reading `0ns of 0` |
| M3-fresh the identical mutant, all eight `touch`ed first | assertion | **2 failed / 279 of 281** |
| M4b two-ULP term dropped, targets touched fresh | assertion | GREEN (deltas -240..+172 of 1000) |
| M5b `Math.abs` removed, targets touched fresh | assertion | GREEN (deltas -200..+79) |

**M2b/M2c is the discriminating pair, and it is sharper than one
quantum.** 1431 ns green, 1669 ns red: the guard discriminates at the
scale of the bound itself, not merely at the microsecond.

**THE FIXED-POINT TRAP REPRODUCED, AND IT CAUGHT ME TOO.** M3-trap is a
cleaner isolation than the executor's: it follows a CLEAN BASELINE rather
than a prior mutant, so the fixed point is the only available
explanation, and the surviving run stamps `0ns` for all eight targets in
its own log. Then I walked into it a second time — M4 and M5 were first
run without touching, came back green with every stamp reading `0ns`,
and those greens were worthless; M4b and M5b are the informative
re-runs. **The corrected discipline is: an ASSERTION-side mutant of this
guard must be preceded by a `touch` of all eight targets, because the
previous run of the same suite wrote the state the assertion reads.**
That is `T-153-s7`'s subject and it is right to route it.

#### WHAT NO BODY KILLS — filed, not blocking

M4b and M5b are green with real deltas: on the measuring platform NO
BODY kills the two-ULP term (the Linux runner does — 3 of 24 samples)
and NO BODY kills `Math.abs` (a code-side early restore does — M2e).
`expectClocksRestored` also has no non-empty floor, shape TEN's one-line
remedy, though both callers are pinned today by `toHaveLength(7)` and by
a one-element literal. All three are improvements, not failures; filed as
`T-153-s10`.

#### THE BATTERY — lane worktree at `2eaa8f0`, exits read unpiped

| command | cwd | exit |
|---|---|---|
| `npm run build` | lib/parser | 0 |
| `npx vitest run` | lib/parser | 0 — **314 passed** |
| `npx tsc --noEmit` | lib/parser | 0 |
| `npm run build` | app | 0 |
| `npm test` | app | 0 — **1013 passed, 47 files** |
| `npm run typecheck` | tools/e2e | 0 |
| `npm run lint:tokens -- --selftest` | tools/e2e | 0 |
| `npm run lint:tokens` | tools/e2e | 0 — TOKEN 150, CONTROL **852** |
| `npm run lint:docs` | tools/e2e | 0 |
| `npm test` | tools/e2e | 0 — **281 passed**, 2.9m |
| `npm run capabilities:check` | tools/e2e | **1 — STALE** |

CONTROL is **852** here and the notes say 849 at `5970bf6`: the lane's
own three suggestion cards moved it, which is this file's FIGURE CASE
arriving inside the very card that documents it. Derive it at your ref.

**The staleness is not this lane's, measured rather than argued.** Same
scratch worktree, same `node_modules`, `git checkout --detach` to each
ref in turn: `capabilities:check` exits **1** at `09504e8` and **1** at
`2eaa8f0` with a BYTE-IDENTICAL message, *committed 21886 bytes, a fresh
generation is 21992*. Independently: the `test("` census over
`tools/e2e/tests/` is **255 lines, identical** at both refs, and
`docs/CAPABILITIES.md` is untouched by the pair — so the check's two
inputs did not move and its verdict could not. `T-153-s8` owns it; the
regen is the integrator's at merge.

#### CI, READ-ONLY — the two bodies pass, the 31 are not this card's

| run | ref | the two bodies | lane |
|---|---|---|---|
| 33264083542 | `5970bf6` | PASS at `:210` and `:341` | 31 failed / 250 passed |
| 33265405734 | `cb216a1` | PASS at `:215` and `:346` | 31 / 250 |
| 33266566174 | `2eaa8f0` | PASS at `:220` and `:351` | 31 / 250 |

I classified the 31 at `2eaa8f0` from the failure blocks rather than
from the summary: **28 quote `fatal: ambiguous argument 'main'` inside
their own block**; a **29th**, `brief.spec.ts:679`, is the SAME call site
wearing a different face — `dispatch-brief.mjs --task T-133` returns
**exit 3** where the body expects `[0, 1]`, because the script CATCHES
the throw the other 28 let escape. **`T-153-s9`'s fix has to cover both
surfaces**, and a reader grepping for the fatal will find 28 of 29.
The remaining **2** are `T-153-s6`'s.

The cross-check is the strong one: against main's own `push` run
**33260414204** (`8f7b58c`, 4 failed / 254 passed of 258), **all 31
failing titles exist, 29 are GREEN there, and exactly 2 are RED** — the
`docs-input-gate.spec.ts:906` / `range-rule.spec.ts:91` pair. Title-keyed,
so no line number is doing the work.

**On criterion four.** It asks for *"a full-suite CI run green on
Linux"*, and no run is green. I judge it met in substance and unmeetable
in letter from this seat: the two bodies this card owns pass on
ubuntu-24.04 in all three cycles, the cap of 3 was respected, every cycle
stamped its read, and the 31 reds are two other cards' — one of which the
fence forbids this lane to touch. The residual is the INTEGRATOR's to
carry, not this lane's: main's first green Linux run now needs `T-153-s6`
AND `T-153-s9`.

#### THE REST OF THE ATTACK SET

- **Load-bearing halves.** Untouched, proved by ABSENCE from the pair:
  every hunk in `git diff 09504e8..2eaa8f0 -- tools/e2e/tests/token-scan.spec.ts`
  is clock-related, and the sha256 loop, the `git diff --quiet` over the
  seven targets, P6's `[P6:` `toHaveLength(1)` and its two line
  assertions, `toHaveLength(7)` and `(0 TOKEN, 7 CONTROL)` are outside
  all of them.
- **The class sweep, re-run by me.** At the tip the pattern finds **no
  exact fs-timestamp equality**: four `toBeGreaterThanOrEqual` ordering
  sites under `app/test/` and one hit inside the new comment. Shown
  capable of failing: the same pattern at `09504e8` returns both pre-fix
  sites, `token-scan.spec.ts:164` and `:273`.
- **Security.** No new dependency, no manifest or lockfile in the pair,
  no new input path, no endpoint, no secret, no network, no shell
  interpolation. The added `console.log` emits relative paths and
  integers.
- **Adjacent features.** 281 passed locally and 250 of the same 281 on
  Linux with the 31 accounted for; the four sibling mtime readers are
  ordering comparisons and were not touched.
- **Vacuity.** Neither guard can pass without running: M1a and M1b each
  red exactly one body, so neither is a duplicate of anything else in the
  suite (shape six, answered the way `T-072-s2` prescribes).

#### ASSESSMENT for the integrator — the 1.5x margin on 24 samples

I could not falsify it and I would not widen it. The executor's own
framing is the right one and its arithmetic survives an independent
derivation: 1489 computed, 1241 reasoned, 1016 observed — 1.47x over the
extreme and 1.20x over the reasoning, which is thin only if the reasoning
is wrong, and the reasoning is a sum of three terms I re-derived from
libuv's source and from IEEE-754 rather than from the samples. That is
the part that makes 24 samples enough: the bound is not an extrapolation
from a distribution, it is a closed-form worst case that the distribution
happens to sit inside, and the samples are corroboration rather than
evidence. My own 64 darwin samples land at 240 ns against a reasoned
241.3 — the same agreement one binade down. **The residual risk is not
the sample count; it is the assumption that the quantum is 1000 and not
something coarser**, and Correction 1 makes that risk BIGGER than the
executor thought, not smaller: the truncation is a property of a libuv
version rather than of a kernel, so a runner image change moves it
without any platform changing. The right answer to that is the one
already shipped — the bound is an upper bound over both known libuv
behaviours, and the stamp prints `process.versions.uv` on every run, so
the next surprise arrives as a number beside the version that caused it.
A guard that reds is what a bound is FOR; a bound widened to stop redding
is a comment.

#### DISCLOSURE — the two-phase blindness was not enforceable

My brief carried the executor's report below a marker in the same
message, so phase-1 blindness was a discipline and not a guarantee. My
attack set was derived from the card at its base ref and from the raw
diff, and the three findings above are things the report does not say —
Correction 1 contradicts it. But I cannot claim I was blind, and the
integrator should read this verdict knowing that. `T-159` already owes
this; recorded here as a second sighting rather than a fourth card.

#### GATES AT MY OWN TIP — a role that writes owes the tree's gates

**Measured at `403c26b`**, the commit this verdict and `T-153-s10`
created — not at `2eaa8f0`, which is a different tree. Verifier's range
per the RANGE RULE's second row, against main as read here, `268f544`
(main has MOVED since the executor read `95cf2d0`):
`TREE=$(git merge-tree --write-tree 268f544 HEAD)` exits **0**, tree
`54012b4`, and `git diff --name-only 268f544 "$TREE"` is **6 paths** —
five `docs/tasks/*.md` and `tools/e2e/tests/token-scan.spec.ts`.

- **GRAPH REGEN — FIRES** (a `.ts` outside `docs/`, unchanged from the
  executor's read; my own two paths are docs-only and could not move it).
  ASKED, not predicted: `index --check` exits **0, CURRENT** — 1021562 of
  1040000 bytes (98.2%), 189 files, 2157 symbols, 2111 edges. No regen
  owed.
- **BOOT GATE — NOT OWED.** No `app/src/**`, no `app/src-tauri/**`, no
  manifest.
- **METHOD EVAL GATE — NOT OWED.** No path under `method/**`.
- **DOCS GATE — FIRES**, both halves run. WHOLE-TREE `npm run lint:docs`
  exits **0** (every live card parses with a legal status, four
  governing-document budgets hold), so `T-153-s10`'s frontmatter and this
  verdict's prose break nothing. DIFF HALF, fed the RANGE RULE's own path
  list, exits **1 — FIRES**, naming 22 derived readers across 4 suites and
  five docs paths, and owing THREE commands. All three RUN and GREEN at
  `403c26b`:

  | owed | result | exit |
  |---|---|---|
  | `npm test` from app/ (after `npm run build`, exit 0) | 1013 passed, 47 files | 0 |
  | `npx vitest run` from lib/parser/ | 314 passed | 0 |
  | `npm test` from tools/e2e/ | 281 passed, 2.6m | 0 |

- Also at `403c26b`: `npm run typecheck` **0**, `lint:tokens --selftest`
  **0**, `lint:tokens` **0** — and CONTROL is **853** here against 852 at
  `2eaa8f0` and 849 at `5970bf6`. One figure, three refs, three values,
  moved each time by the prose that quoted it. That is why every number in
  this verdict names a commit.
