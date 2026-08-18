# State

Updated: 2026-08-18 by integrator (T-062 recovered and checkpointed),
gpt-5.6 @fresh

## Just completed

**T-062 — the frame holds everywhere: one scroll model, a canvas that
scrolls, a card that fits.** F-02, milestone 4, size M, nine acceptance
criteria, absorbing T-048-s1 through T-048-s4. `touches: [app-shell,
app-map]`. Built by `claude-opus-5 @fresh`, APPROVED by
`claude-opus-5 @fresh`, `review: same-model`, no rejection. Approved
branch tip **`09b9af3`**. Merge **`149ce47`**.

T-062 settles what the shell is. T-048 had bounded the genesis column
with `h-screen` while every other screen stayed a growing
`min-h-screen` page. The conditional is gone: `main` and the content
column are bounded on every screen, `PaneRail` carries its own
`h-screen`, and each screen owns its overflow. The board scrolls inside
`board-scroll`; the front door and startup card scroll inside their own
regions; the genesis pane retains its existing scroll region; the map
canvas is `overflow-auto` instead of `overflow-hidden`.

The map change is load-bearing, not cosmetic. Bounding the old canvas at
800x600 produced **446px of graph inside a 392px box with
`overflow-y: hidden`**: 54px was unreachable, and no pre-T-062 test named
the loss. The new lane asserts the class of failure across all five
screens and separately proves that the last pixel of the map is
reachable. The frame is measured on the served bundle at 1280x840,
1024x700 and 800x600: **15 of 15 screen/viewport pairs have page height
equal to viewport height**.

T-062 also corrected T-051's min-height story. The old floor probe read
document height and therefore reported **302px** for the already-bounded
genesis screen even though its content was **1082px**; it could not see
the board's 4989px content either. The **700px** minimum survives, but
not because every screen fits. It survives because every screen now owns
a scroll region, and the tightest non-form region at 1024x700 is 580px,
well above T-048-s5's measured 250px collapse floor. ROADMAP and
ARCHITECTURE now state that correction rather than carrying the false
premise forward.

### The interrupted integration, recovered without re-merging

The previous background integrator did not fail at the merge. It merged
T-062 successfully as **`149ce47`** and then stopped during checkpoint
work, leaving four intended files dirty:

- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/architecture/graph.json`
- `docs/tasks/T-062-the-frame-holds-everywhere.md`

The recovery preserved those edits, audited them against the task and
verdict, completed the missing integration gates, corrected the task's
fence and graph forecast, rewrote this snapshot, and committed one
checkpoint. **T-062 was not merged twice.**

The task fence now names the real ranges. `f94dd9c..09127fa` is seven
code files; `f94dd9c..d40d76a` is ten files including the card and two
findings; `f94dd9c..09b9af3` is **13 files, +1780 / -149**, including all
five findings. The old “eight files” sentence was false for every range
that included the card and is retired.

## Integration evidence

### Graph gate — fired, regenerated, deterministic, current

The merge diff touches seven TypeScript/TSX files outside `docs/`, four
of which the indexer walks. The committed graph was regenerated twice
from merged main. Both runs produced byte-identical output:

    sha256 4bd19d87732e999a6b697ee42829d30a8033cb9d06cea4117262d174761852f1

`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri` exits **0**:

    graph.json is CURRENT
    558780 bytes · 115 files · 965 symbols · 1476 edges

The graph moved from 115 / 964 / 1477 to **115 / 965 / 1476**. The
branch forecast got the file count and component-level result right but
missed one source symbol: `expectBoundedFrame` is a new function and
adds one call edge. Removing `cn` from `App.tsx` removes one file import
edge and one symbol call edge, so the measured net is **+1 symbol / -1
edge**. No component relation row moved and none of the three dogfood
fixtures required an edit.

The repository still has **no remote**, so the graph-currency CI step is
written but dormant. The integrator ran the exact CI command locally;
the currentness claim does not depend on a runner that has never existed.

### Full suite on merged main

ADR-011 order was respected. No model was called. No `npm install` or
`npm ci` was run in the main checkout; existing lockfile-resolved
installations were used, and the branch's executor had already performed
the cold-install proof in its isolated worktree.

- `lib/parser`: build and `tsc --noEmit` green; **225/225 tests in 11
  files**.
- `app`: `tsc --noEmit` and production build green; **821/821 tests in
  42 files**. Bundle: `index-tsWZtfZi.js` 498.88 kB and
  `index-BeT5MY7f.css` 43.90 kB.
- `app/src-tauri`: bare `cargo test` green; **318 passed + 3 intentional
  ignores**, zero failures. The real-model smoke remains ignored.
- `tools/e2e`: typecheck green; **82/82 Playwright executions**, one
  worker, retries 0, no skips. Scratch port 17640 was used; the sandbox
  initially refused the bind with `EPERM`, then the same lane passed
  with local-port permission.
- token lint: **clean over 117 files**, zero allowlist;
  `--selftest` **49 samples + 14 walk-policy checks** green.

The graph check was re-run after all suites and remained current.

### Boot gate — fired and passed

The trigger was derived against the merge range
`f94dd9c..149ce47`, never against the branch point plus unrelated main
history:

    app/src/** = 3
    app/src-tauri/** = 0
    app/package.json = 0
    app/src-tauri/Cargo.toml = 0

`NPUTER_BOOT_PORT=17641 npm run boot:check` exited **0** and detected both
required lines:

    [nputer] project folder: /Users/ujju/Projects/nputer
    [nputer] window "main" created

The gate stopped its process tree. Scratch ports 17640 through 17644
were empty after their runs. Port **1420** was only observed read-only;
the human's existing node pid 82549 remained its sole listener and was
never connected to, signalled or reused.

### Poison discipline — all nine changed/new bodies discriminated

Six independent, one-sided source reverts were run inline against merged
main. Each mutation changed only the producer and every run was restored
before the next:

| revert | red evidence |
|---|---|
| `main`: `h-screen` back to `min-h-screen` | **3 of 4 app frame tests red** |
| column: `h-screen` back to `min-h-screen` | **3 of 4 app frame tests red** |
| map canvas: `overflow-auto` back to `overflow-hidden` | **1 app + 2 focused E2E red**; the lane named `map-canvas` as hidden content and read `hidden` instead of `auto` |
| rail loses its own `h-screen` | **1 app frame test red** |
| board loses `min-h-0 flex-1 overflow-y-auto` | **1 app + 7 focused E2E red** across `interview`, `shell-frame` and `window-contract` |
| front door loses its scroll region | **1 app + 3 focused E2E red** across the same three files |

Together those reverts observed all **nine** changed or new test bodies
red: three app frame bodies, three shell-frame lane bodies, one
interview reconcile and two window-contract reconciles. The unchanged
chain-walk body was not owed a drill.

Restoration was proved by SHA-256 on all seven code/test files and an
empty `git diff HEAD -- <seven files>`. The hashes matched their
pre-drill values; the focused app frame file then returned **4/4 green**.
Only the checkpoint documentation and graph remained modified.

## Documentation and decision judgment

- **ROADMAP edited.** T-062 changes a user capability: a user can reach
  the bottom of a tall board or map while the application chrome remains
  present. It also corrects T-051's false min-height premise in the same
  narrative where that premise was recorded.
- **ARCHITECTURE edited.** C-05 changed its shell-wide overflow model.
  The component row now records the unconditional bounded frame, per-
  screen scroll ownership, the map clipping trap, zero IPC/grant
  movement, and the filed parse-error exception.
- **Registry not edited.** No component, ownership path or component
  relation changed.
- **No ADR.** The scroll-model choice is an implementation decision
  inside C-05 under existing architecture. No dependency, IPC command,
  capability grant, manifest, lockfile, method contract or cross-
  component interface moved.
- **Task stamped done.** Builder/verifier stamps and the APPROVED verdict
  were already committed on the branch and were preserved. The only
  lifecycle edit is `status: verifying` to `status: done`.
- **No token or colour movement.** The stylesheet hash changes because
  Tailwind emits a different layout-utility set, not because a new token
  or arbitrary value was introduced. Both schemes are structurally
  unaffected.

## In progress / broken right now

### T-060 is still the one live lane

`../nputer-T-060`, branch `task/T-060-resolver`, is clean at
**`99bfc49`** (`T-060: complete second-executor rejection handoff`) and
its card remains `status: verifying`.

Its history matters:

- **`33b249a`** records the first verifier's REJECTED verdict. The
  process-global `NPUTER_NO_REAL_CLI` mutation flaked the guard's own
  parallel tripwire at realistic Rust test thread counts.
- **`3fbb04b`** moves the guard-lift proof into a child process with an
  explicit receipt, adds the doctest-directory arm, and reports repeated
  green runs across thread counts.
- **`99bfc49`** commits the previously stranded documentation handoff.

A fresh adversarial verifier is active against `99bfc49`. The rejected
record must remain intact. Do not merge T-060 on the first verifier's
old approval fields or rebuild it from scratch; the next state change is
a new verdict on the rejection fix. `app-agent` remains held until that
verdict and integration complete.

### T-062 worktree

`../nputer-T-062` remains at approved tip `09b9af3`. The branch is kept.
This recovery was explicitly restricted to the main worktree, so sibling
worktree removal is left to the architect after the checkpoint rather
than performed from this lane.

## Findings created by T-062

Five suggestions remain `status: suggested`; the integrator did not
triage them:

- **T-062-s1:** T-051's min-height criterion was never capable of
  measuring genesis. The false justification is corrected in durable
  docs; any further floor/design decision remains open.
- **T-062-s2:** vertical wheel input now both pans the graph and consumes
  the canvas's small native overflow.
- **T-062-s3:** the parse-error strip is outside `board-scroll`; with 20
  unparsable files it pushes the page to 896/840 and reopens the exact
  chrome-scroll failure by another door. This is the sharpest functional
  hole in the set.
- **T-062-s4:** the wheel double-move is not small on the X axis; at
  800x600 horizontal overflow can add a full 300px native scroll to a
  300px pan.
- **T-062-s5:** widening exact-array equality to `arrayContaining`
  makes the clipping sweep vacuous, a fourth relation-preserving poison
  shape.

T-063-s2 remains a high-value adjacent item: `startup-failed` is still
two independent cross-language string literals with no join, and a
one-sided rename remains invisible to the current suites.

## Next up

1. **Finish T-060's fresh verification.** Reproduce the original failure
   at realistic thread counts, prove the child-process receipt prevents
   a vacuous zero-test pass, run the complete Rust suite, preserve the
   rejection record, and append a new verdict. A second rejection parks
   the lane for the human.
2. **Integrate T-060 only after approval.** Enumerate both sides and run
   `merge-tree` before touching main. Its base predates T-063 and T-062;
   T-063 changed `lib.rs`, and T-060 is a security-sensitive resolver
   change. Its merge fires the boot gate and, if still Rust/docs only,
   does not fire graph regeneration.
3. **Triage T-062's five findings.** Start with s3 (the frame invariant
   can still fail) and s4 (the actual horizontal interaction cost), then
   fold s1's durable correction rather than reopening the now-correct
   700px rationale.
4. **Select new non-overlapping lanes only from this checkpoint.** The
   standing queue still favours T-055 in `lib-parser`, with T-057/T-058,
   T-065 and the promoted cross-language event-name contract as nearby
   candidates. Do not dispatch from merge `149ce47`; dispatch from this
   checkpoint so the branch inherits the current graph.

## Human-owned evidence and decisions

The task pipeline cannot supply these:

- **T-062 visual judgment:** whether one bounded frame feels right in
  light and dark at 1280x840 and 1024x700. The board now has an internal
  scrollbar and keeps the header/rail fixed; that is intentional and
  daily-visible.
- **Relaunch the desktop app.** The long-running process on 1420 predates
  T-051, T-063 and T-062's Rust/frontend checkpoint history. A relaunch
  is required to load the current Rust binary and the declared 1280x840
  window contract together.
- **Real genesis run:** run `claude login`, then perform one timed,
  end-to-end genesis on a toy idea, target <=30 minutes, with light and
  dark completion screenshots. No real planner turn has yet succeeded
  on this machine; all runner evidence is fixture-driven.
- **Startup-failure judgment:** after relaunch, provoke one failure and
  judge whether the stderr line is useful and whether the first silent
  eight seconds are acceptable.
- **Repository remote:** there is still no remote. CI, including graph
  currency and xvfb boot, has never run on a real runner. Only the human
  can choose where to push.

Milestone 3's named task list is complete, but the milestone is **not
claimed** until the real timed genesis run exists. The product has a real
conversation surface, file-evidence join, board handoff, recovery path
and honest startup failure; whether it is a good interview with a model
that can misunderstand the user remains unknown.

## Health of the tree

At the T-062 checkpoint:

- main has T-062 merge `149ce47` plus this checkpoint;
- parser, app, Rust, E2E, token lint, boot and graph-currency gates are
  green;
- committed graph: **115 files / 965 symbols / 1476 edges**, deterministic
  SHA-256 `4bd19d87732e999a6b697ee42829d30a8033cb9d06cea4117262d174761852f1`;
- board on main: **125 task files — 45 done / 20 planned / 16 parked /
  44 suggested / 0 building / 0 verifying**, plus **9** files under
  `docs/tasks/rejected/`;
- branch work is not reflected in that board count: T-060 is verifying
  in its own worktree;
- **44** merge commits match `^Merge T-`, representing **44 distinct
  task IDs**; there are **45 done cards** because T-040 is done without a
  matching task merge. The prior “T-014 merged twice” count does not
  reproduce on current main and is withdrawn rather than carried.

Security posture for T-062 is unchanged: zero dependencies, zero
lockfile lines, zero Rust files, zero IPC commands, zero capability
grants, zero model calls. The open resolver-security work is T-060 and
remains in verification.

## Open questions

- Should the shell-frame invariant be universal over failure states, and
  should T-062-s3 become the immediate repair card?
- Should map wheel input pan, natively scroll, or choose one by axis?
  T-062 made hidden graph reachable but now the two mechanisms compose.
- What gate owns a contract spelled independently across Rust and
  TypeScript? T-063's `startup-failed` event remains the live example.
- Should graph regen be written as an explicit measure -> fixture edit ->
  final regen procedure? This checkpoint needed no fixture edit, but the
  ordering remains oral tradition.
- Should poison guidance say explicitly that one-sidedness is necessary
  but insufficient, and require the mutation to break the asserted
  relation? T-062-s5 is the fourth observed widening shape.
- Does the shared main worktree need a formal rule for what reaches a
  human's running app before a relaunch? T-063 demonstrated a split
  frontend/backend state; T-062 is frontend-only and hot-reloadable.
- What does the pipeline require when a builder or integrator disappears
  mid-flight? T-062 recovery shows the durable answer in practice:
  inspect the commit graph and dirty tree, resume from evidence, and do
  not repeat an operation that already succeeded.
