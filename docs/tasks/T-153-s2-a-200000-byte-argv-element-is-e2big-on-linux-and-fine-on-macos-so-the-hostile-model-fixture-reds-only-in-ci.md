---
id: T-153-s2
title: A 200 000-byte argv element is E2BIG on Linux and fine on macOS, so the hostile-model fixture reds only in CI — and the product hands that string to execve unbounded
feature: F-03
milestone: 4
priority: 20
size: S
status: building
blocked_by: []
touches: [app-agent]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
suggested_by: executor claude-opus-5 @T-153
---

Found by the T-153 lane's CI run `33252279564`, on the step behind the
red that card removed. **It is C-14's fence, not T-153's, so it was
routed rather than fixed** (`touches: [app-agent]` —
`app/src-tauri/tests/agent_runner.rs` is that component's by its own
`paths:` field).

    test a_hostile_init_line_model_is_refused_and_a_real_one_round_trips ... FAILED
    [nputer] agent: turn 1 failed: SpawnFailed { os: "Argument list too long (os error 7)" }
    thread '...' panicked at tests/agent_runner.rs:181:5:
    timed out waiting for completed; saw: [ Failed { seq: 1, ... } ]
    test result: FAILED. 79 passed; 1 failed; 1 ignored

## THE MECHANISM, AND IT IS A PLATFORM DIFFERENCE RATHER THAN A RACE

The body's first fixture is `("oversize", "M".repeat(200_000))`
(app/src-tauri/tests/agent_runner.rs, the `for (tag, model)` loop in
`a_hostile_init_line_model_is_refused_and_a_real_one_round_trips`). That
string becomes one `--model <value>` **argv element**.

Linux caps a SINGLE argv element at `MAX_ARG_STRLEN` = 32 pages =
131 072 bytes, independently of the much larger total `ARG_MAX`; over it
`execve` returns `E2BIG`. macOS has no per-element cap of that shape —
its limit is on the total, at 1 MiB — so 200 000 bytes in one argument
spawns cleanly there and has done on every local run this repository has
ever made. 200 000 > 131 072, so the fixture is over the Linux cap by
construction and this is a **deterministic** red on Linux, not the
1-in-22 flake STATE's standing hazard names for
`a_hostile_session_id…`. Nothing in the body is timing-dependent; the
spawn simply cannot succeed.

The test then fails at `wait_completed`, because the turn `Failed`
instead of `Completed` — three layers from the cause, in the shape the
DOCS GATE bullet warns about.

## THE PRODUCT HALF, WHICH IS THE PART WORTH ARGUING ABOUT

The test is refusable as a fixture bug. The behaviour underneath is not
obviously one: **the `model` option reaches `execve` unbounded.** The
runner already refuses a hostile model on the way OUT (the registry
never records it, which is what the rest of this body proves); it does
not bound it on the way IN. So on Linux a user or a config with a
>128 KiB model string gets `SpawnFailed` — a turn that never starts —
where macOS gets the designed outcome, a turn that stands with the model
refused. The typed-failure family this project built (T-069/T-101/
T-102/T-107/T-113) exists so a failure never costs an affordance
falsely, and this one costs the whole turn on one platform only.

## Disposal

`touches:` `[app-agent]`. Three arms, and the first two are cheap:

- **(a)** Bound `model` where the argv is BUILT, in
  `app/src-tauri/src/agent/**`, and let the existing refusal path
  handle the rest. Then the fixture passes on both platforms because
  the product stopped handing execve something it cannot take, which is
  the honest fix.
- **(b)** Move the fixture under the Linux cap — e.g. 100 000 — and say
  in the body WHY the number is what it is. Cheapest, and it leaves the
  product half unanswered.
- **(c)** Keep 200 000 and assert the platform-split outcome
  explicitly. Worst of the three: it writes the divergence down as
  intended behaviour.

**(a) plus (b)'s comment is the pair that leaves nothing owed.** Derive
`MAX_ARG_STRLEN` at your own ref rather than quoting this card — it is
`getconf ARG_MAX` for the total and a kernel constant for the element,
and the two are not the same number.

---

## Implementation notes (executor, lane `task/T-153-s2-e2big-model-bound`)

### Understanding, before any edit

I am building arm (a) plus arm (b)'s comment on the ruled direction: the
runner must stop handing `execve` a string the kernel cannot take, so the
hostile-model fixture is refused by THIS PRODUCT'S OWN BOUND on both
platforms rather than by Linux's `E2BIG` on one, and the outcome stays
the designed one — a turn that STANDS with the model refused, never a
`SpawnFailed` that costs the whole turn. Concretely that is three things
inside `[app-agent]`: a per-element byte bound owned once beside the
existing validation family in `app/src-tauri/src/agent/adapter.rs` and
applied at the spawn-assembly site in
`app/src-tauri/src/agent/runner.rs`, refusing an oversized element by not
placing it (no coercion, no truncation, no second refusal
implementation); the `"oversize"` fixture in
`a_hostile_init_line_model_is_refused_and_a_real_one_round_trips` moved
under the Linux per-element cap with the derivation written in place; and
a new body pinning the bound at its boundary WITH a positive control, so
a refusal is distinguishable from an absence. I derive the cap's nature
at my own ref and host rather than quoting the card's digits.

### Where the card and the brief are wrong, named plainly

**The model is NOT an argv element, and this repository says so in three
places.** The card's mechanism section says the fixture's string "becomes
one `--model <value>` argv element". It does not. `adapter::argv`
assembles a FIXED template with exactly one substituted slot,
`SESSION_ID_SLOT`; `--model` appears in `adapter.rs` only inside
`KNOWN_CLI_FLAGS`, the denylist of shapes a VALUE may not take.
`validate_model`'s own header states the reason — *"A model name is never
argv (we never pass `--model` — ADR-003: the user's CLI default IS the
model)"* — and `sessions.rs`'s `model` field repeats it.

The channel is the child's **ENVIRONMENT**: the test harness's
`Options.model` becomes the `NPUTER_FAKE_MODEL` pair in
`RunnerConfig.extra_env`, which `apply_child_env` places on the child.
`MAX_ARG_STRLEN` bounds each string `execve` copies — argv strings and
envp strings alike — so the observed `E2BIG` is real and the card's
DIAGNOSIS holds; only its named channel is wrong. Two consequences the
card's "Product half" does not survive:

1. **There is no production path where a model reaches `execve` at all.**
   `extra_env` is a documented TEST SEAM (*"Always empty in production"*).
   What IS unbounded on the way to `execve` in production is every other
   child env pair — the `ENV_ALLOWLIST` values forwarded from the
   parent, and `PATH`, which on the production path is captured from a
   LOGIN SHELL. That is the real exposure of the card's shape, and it is
   what the bound now covers.
2. **The fixture cannot both cross the new bound and keep its own
   assertion.** Crossing it removes `NPUTER_FAKE_MODEL` from the child
   entirely, so the fake falls back to its default `fake-model-1` — a
   legal name that round-trips, and `registry.sessions[0].model == None`
   would red. So the fixture is moved under the bound (where the hostile
   value still rides the init line and `MODEL_MAX_LEN` refuses it,
   portably, which is what arm (b) buys), and the NEW bound is pinned by
   its own body with the positive control. The brief's "the fixture must
   still exercise your new bound" is the one instruction the repository
   refuses; it is recorded rather than worked around.

### The bound, and the derivation it carries

`adapter::SPAWN_ELEMENT_MAX_LEN = 65_536` bytes, with
`adapter::child_env_pair_fits` owning the `KEY=VALUE` plus NUL
arithmetic so a size rule is not counted twice. Derived at this ref, on
this host, rather than quoted from the card:

- **macOS, measured.** `exec`ing `/usr/bin/true` under a single oversized
  env pair on Darwin 25.6.0 arm64 (`perl -e '$ENV{BIG}="M" x $ARGV[0];
  exec("/usr/bin/true")'`): 200,000 bytes **succeeds**, 1,000,000
  **succeeds**, 1,040,000 **succeeds**, 1,048,000 **fails** with
  `Argument list too long`, 1,100,000 fails. `getconf ARG_MAX` = 1,048,576
  and `getconf PAGE_SIZE` = 16,384. So the only limit to find here is the
  TOTAL, and one 1 MB argument is fine — which is exactly why 200,000
  bytes was green on every local run this repository ever made.
- **Linux, the constraint.** The cap that fires is per-ELEMENT:
  `MAX_ARG_STRLEN`, the kernel's `PAGE_SIZE * 32` in `binfmts.h`,
  enforced by the one routine that copies argv strings AND envp strings,
  and INDEPENDENT of the far larger total `ARG_MAX`. On the 4 KiB-page
  x86-64 the `ubuntu-24.04` runner uses that is 131,072, and the kernel's
  own length includes the terminator, so a string of exactly the cap does
  not fit. No Linux was reachable from this seat — no daemon behind the
  installed `docker`, no VM — so the Linux half is confirmed
  BEHAVIOURALLY by the CI runs recorded below rather than by a local
  probe, and this note says so instead of implying a measurement it did
  not make.
- **The margin.** 65,536 is half the smallest per-element cap in use. It
  survives a page size smaller than any shipping kernel, and it costs
  nothing: the longest value this runner legitimately places is 128 bytes
  (`SESSION_ID_MAX_LEN`, `MODEL_MAX_LEN`), so the bound sits 512× above
  everything real.

### Changes

- **`app/src-tauri/src/agent/adapter.rs`** — `SPAWN_ELEMENT_MAX_LEN` and
  `child_env_pair_fits`, beside the validation family that already owns
  `SESSION_ID_MAX_LEN` and `MODEL_MAX_LEN`, with the derivation above in
  the doc comment. Two unit bodies: the boundary one byte either side
  (including a longer KEY, which proves the bound is on the ASSEMBLED
  string rather than on the value), and
  `every_argv_element_an_adapter_can_assemble_fits_the_spawn_bound`.
- **`app/src-tauri/src/agent/runner.rs`** — `set_child_env`, through
  which every child env pair now passes: the allowlist, the Linux XDG
  additions, the forced `TERM`, `PATH` and the test seam alike. An
  oversized pair is dropped WHOLE, named on stderr with its key and size
  but never its value, and the turn stands.
- **`app/src-tauri/tests/agent_runner.rs`** — the `"oversize"` fixture
  200,000 → 50,000 with the three bounds it now sits between written in
  place, and
  `an_env_pair_past_the_execve_element_bound_is_dropped_and_the_turn_stands`.

**WHY NO SECOND CHECK INSIDE `adapter::argv`.** Every argv element is a
literal from a fixed template except the one substituted
`SESSION_ID_SLOT`, and `validate_session_id` has already refused anything
past 128 bytes before assembly begins — so a length check there is
unreachable code, and an unreachable bound is a second owner of a rule
rather than a safeguard. What the new adapter body pins instead is the
RELATION the argument rests on: that the id gate's bound stays UNDER the
spawn bound, and that no template literal has grown past it. Raise
`SESSION_ID_MAX_LEN` above `SPAWN_ELEMENT_MAX_LEN` and it reds by name
instead of becoming a `SpawnFailed` on Linux only.

### Drill ledger

Detached scratch worktree `/Users/ujju/Projects/t153s2-drill` at
`b5e3e4e` (33-character root) with `CARGO_TARGET_DIR` inside it at
`.t153s2-target` — one stem, `t153s2`, on the worktree, the target
directory and every results file. **Baseline: 200 / 81 (+1 ignored) /
188, exit 0.** Every mutation was one-sided, read back with `git diff`
before running, and restored with a sha256 proof against `b5e3e4e`.

| # | mutated (one side) | expected red | measured |
|---|---|---|---|
| 1 | `child_env_pair_fits` → `<= usize::MAX` (the bound removed) | the two negative asserts, and the oversized pair reaching the child | exit **101**; lib 199/1 FAILED, and the boundary body `an oversized pair must not be handed to execve at all; the child saw Some(65518)` |
| 2 | `child_env_pair_fits` → `<` (off by one, refusing direction) | **the positive control** | exit **101**; `left: None / right: Some(65517)`, plus the lib body — 199/1 and 80/1 |
| 3 | `SESSION_ID_MAX_LEN` → `70_000` | the argv relation | exit **101**; `the id gate is what keeps the substituted element inside the execve bound; at 70000 vs 65536 it no longer does` |
| 4 | `MODEL_MAX_LEN` → `60_000` | the MOVED fixture, which must still exercise the model bound at 50,000 | exit **101**; `[oversize] registry model` — and the boundary body PASSED, since 65,517 is still over 60,000 |
| 5 | `fake_agent`'s `"fake-model-1"` fallback → `"drilled-default-9"` (producer side only) | the discriminator that proves the pair was refused WHOLE, not coerced | exit **101**; `left: Some("drilled-default-9") / right: Some("fake-model-1")` |
| 6 | the element loop's own comparison → `<= 3` (assertion side) | that the loop is REACHABLE and asserts on real elements | exit **101**; `argv element "--output-format" is 15 bytes, past the …-byte bound` |

**Restoration proved, not asserted.** After each drill `git checkout --`
then `git diff --stat` empty, and at the end all four touched files
sha256-matched `b5e3e4e`: adapter `027955f4…`, runner `13ed6cc4…`,
agent_runner `58af342d…`, fake_agent `b0bd0728…`. `git status
--porcelain` showed no tracked modification, only the `t153s2`-stemmed
artefacts. **Restored run: 200 / 81 (+1 ignored) / 188, exit 0** —
identical to the baseline.

### Suite ledger — lane worktree at `b5e3e4e`, exits read from `$?` unpiped

| # | command | from | result | exit |
|---|---|---|---|---|
| 1 | `cargo build --lib` | app/src-tauri/ | finished | **0** |
| 2 | `cargo test` (both workspace crates) | app/src-tauri/ | **200** lib · **81** agent_runner (+1 ignored) · **188** nputer-index · 10/3/16/3/3/9/3(+1)/4/1, 0 failed anywhere; lib suite **4.09s**, well under the cache cliff's 9.5s despite a **2.8G** `target/` | **0** |
| 3 | `npm ci` + `npm run build` + `npx vitest run` | lib/parser/ | **314** passed, 15 files | **0** |
| 4 | `npm install` + `npm run build` + `npm test` | app/ | **1013** passed, 47 files | **0** |
| 5 | `npm ci` then `NPUTER_E2E_PORT=14562 npm test` | tools/e2e/ | **233** passed, 2.5m; the seven tracked files it plants into came back restored (`git status` showed only my own card) | **0** |
| 6 | `NPUTER_BOOT_PORT=14563 npm run boot:check` | tools/e2e/ | both lines: `[nputer] project folder: /Users/ujju/Projects/nputer-T-153s2` and `[nputer] window "main" created` | **0** |
| 7 | `node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only b650f62 "$TREE")` | repo root | FIRES — 1 path under docs/ is a code input | **1** |
| 8 | `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri/ | STALE — fresh index **1,021,184 bytes · 189 files · 2,156 symbols · 2,111 edges** against a committed **1,020,023 · 189 · 2,152 · 2,111**; budget 98.2%, 18,816 left | **1** |

Ports were `lsof -nP -iTCP:<port> -sTCP:LISTEN`-read at ZERO ROWS
immediately before each bind (14562, 14563); 1420 was never probed,
bound or contacted.

### Standing gates, derived from the executor's own pair

The RANGE RULE's pre-merge form: `TREE=$(git merge-tree --write-tree
b650f62 HEAD)` — **exit 0**, tree `d72f32d` — then `git diff --name-only
b650f62 "$TREE"`, which returns **4 paths** (three `.rs` under
app/src-tauri, plus this card). Never `b650f62..HEAD`.

- **GRAPH REGEN — FIRES** (3 of 4 paths are `.rs` outside docs/). ASKED
  rather than predicted: `index --check` exits **1**, naming the three
  moved files (adapter loc 1707→1820 and symbols 31→33, runner 3536→3577
  and 70→71, agent_runner 5036→5158 and 125→126) and a `+2/-2` edge swap
  that is the `OsStr` and `adapter::self` imports arriving. **The regen
  is the INTEGRATOR'S, at the checkpoint, and `docs/architecture/graph.json`
  is outside `[app-agent]`** — the bullet rules the checkpoint over the
  merge because the checkpoint edits indexed fixture files, so a regen
  committed here would be stale again by the time it landed. **This is
  what CI now stops on** (below).
- **BOOT GATE — FIRES** (3 of 4 paths under `app/src-tauri/**`). Run, exit
  **0**, both `[nputer]` lines above.
- **DOCS GATE — FIRES** (this card is a flat `docs/tasks/T-*.md`, which
  the parser walks). Exit **1**, owing three suites, all three run and
  green: rows 3, 4 and 5.

### CI — cycle 1 of a cap of 4, and it is the first run in this repository's history to clear the cargo step

Draft PR **#2**, run **33255912812**, `ubuntu-24.04`, head `b5e3e4e`
merged onto the pushed `main` at `0423482` (an ancestor of `b650f62`, so
the merge is a fast-forward and the tested tree is this branch's).

- **`cargo suite` — SUCCESS.** `a_hostile_init_line_model_is_refused_and_a_real_one_round_trips
  ... ok` and `an_env_pair_past_the_execve_element_bound_is_dropped_and_the_turn_stands
  ... ok`; **200 / 0**, **81 / 0** (+1 ignored), **188 / 0**, every other
  binary 0 failed. **THE CARD'S RED IS CLOSED, and the Linux half of the
  bound's derivation is confirmed behaviourally**: 50,000 and 65,517-byte
  env pairs cross `execve` there, and 65,518 is refused by this runner
  before it ever tries.
- **`graph currency` — FAILURE, exit 1**, which is GRAPH REGEN above and
  is not this lane's to fix. Steps 19–26 did not run.
- **NO RUN OF THIS REPOSITORY HAS EVER REACHED STEP 18 BEFORE**, which is
  worth stating plainly because it changes what "CI can run green" is
  still resting on: T-153's four runs (`33252279564`, `33252985112`,
  `33253342892`, `33253673074`) all failed at the cargo suite with steps
  18–26 SKIPPED. So `cargo audit`, the whole-tree docs gate, the e2e
  types/browser/lane steps and the xvfb boot step have **never executed on
  Linux at all**. Every one of them is green LOCALLY on this branch (rows
  3–8 above, and `cargo audit` was not run here — it is a network fetch
  and no criterion of this card asks for it), but macOS green is exactly
  the evidence this card exists to distrust. One further cycle was NOT
  spent buying that signal, because buying it needs the regen committed
  and that commit belongs to the checkpoint.

### Least confident

1. **The bound's VALUE, not its existence.** 65,536 is a judgement — half
   the smallest per-element cap in use, 512× anything real. The arguments
   for it are all in the constant's doc comment, and a reader who
   disagrees should move the number, not the mechanism. Note what does
   NOT depend on it: every assertion added here derives its inputs from
   the constant, so a different value re-derives rather than reds.
2. **Whether DROPPING is the right refusal for an env pair.** The
   alternative — a typed `TurnError` naming the key — tells the user more
   and costs the turn, and on macOS it would cost a turn that works
   today. I chose the outcome the card's own product half argues for (the
   turn stands) and made the drop loud on stderr. A verifier who thinks a
   silently-missing `HTTPS_PROXY` is worse than a failed turn has a real
   case, and it is a one-line change.
3. **The Linux per-element cap's exact arithmetic is not measured here.**
   The mechanism is stated from the kernel's own definition and the
   BEHAVIOUR is confirmed by CI; what is not confirmed at this ref is the
   boundary byte (whether the terminator is inside the cap). The 2× margin
   is what makes that not matter, and the comment says so rather than
   implying a measurement nobody made.
4. **`extra_env` is the only channel this repository actually exercises**,
   and it is documented as empty in production. The production exposure
   the bound closes is the allowlist and the login-shell `PATH` — real,
   but never observed. If a verifier wants that pinned too, the seam
   exists: place an oversized value in the parent's `HTTPS_PROXY` and read
   the child's env dump.

### Routed, not built

- **`T-153-s2-s1`** (filed): a drill worktree's own `CARGO_TARGET_DIR`
  sits INSIDE the graph walk, because the ignore rules key on the name
  `target` and the drill convention requires a lane-derived stem that is
  not it. Found here by regenerating the graph inside the drill worktree
  as a probe — **201 files against the lane's 189**, twelve of them cargo
  build-script output, and `index --check` called the result CURRENT.
  Nothing was committed; the drill's graph was restored and sha256-proved.
  It needs `.nputerignore` and CONVENTIONS, neither of which is
  `[app-agent]`.

### Divergences from the brief, recorded rather than resolved

- The brief instructed `status: building` on exit. `method/roles/executor.md`
  step 6 says an executor stamps `verifying` in its own lane. The brief is
  followed here because this card is not finished — the graph regen and
  the merge are the checkpoint's — but the divergence is written down
  rather than quietly taken, per the same file's own rule that a brief is
  evidence and never authority.
- The brief's "the fixture must still exercise YOUR new bound" is refused
  by the repository, for the reason given at the top of these notes: the
  new bound and the fixture's own assertion cannot both fire. The bound
  has its own body instead.
