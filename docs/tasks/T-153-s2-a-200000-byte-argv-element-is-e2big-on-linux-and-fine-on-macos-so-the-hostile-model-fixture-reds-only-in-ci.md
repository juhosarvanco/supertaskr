---
id: T-153-s2
title: A 200 000-byte argv element is E2BIG on Linux and fine on macOS, so the hostile-model fixture reds only in CI — and the product hands that string to execve unbounded
feature: F-03
milestone: 4
priority: 20
size: S
status: done
blocked_by: []
touches: [app-agent]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

- **`T-153-s3`** (filed): a drill worktree's own `CARGO_TARGET_DIR`
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

### The DOCS GATE caught this lane's own red, which is worth recording beside the ledger

Filing `T-153-s3` re-fired the gate (2 paths under docs/ now), and the
re-run it owed came back **1 failed of 314** in lib/parser and **1012 of
1013** in app — because I filed it as **`T-153-s2-s1`**, and the parser's
vocabulary is `T-NNN` or `T-NNN-sN` with no second level. It surfaced as
`smoke.test.ts > finds zero issues in the live tree` expecting `[]`, four
packages away from the markdown file that caused it — the exact shape the
DOCS GATE bullet's two precedents (`9c64cd8`, `fede266`) describe. Filed
as the next free sibling of the lane's own id instead, and re-run green.
**The gate paid for itself inside one card**, and the ledger below is the
tip's, not the first attempt's.

| command | from | result | exit |
|---|---|---|---|
| `npx vitest run` at `33f61d7` | lib/parser/ | **314** passed, 15 files | **0** |
| `npm test` at `33f61d7` | app/ | **1013** passed, 47 files | **0** |
| `NPUTER_E2E_PORT=14564 npm test` at `33f61d7` | tools/e2e/ | **233** passed, 2.5m; tree clean afterwards | **0** |
| `node tools/e2e/scripts/docs-gate.mjs …` at `33f61d7` | repo root | FIRES on 2 paths; *"every live task card's frontmatter parses, with a legal status"* | **1** |

**And the finding was already half-known.** `T-153-s3` names the prior
sighting rather than claiming the discovery: T-154's verifier hit the same
collision hours earlier and routed it as item 5 of its verdict, with the
same twelve artifacts. The two seats saw opposite halves — that one a
false STALE at exit 1, this one a CURRENT at exit 0 over a poisoned graph
— and the card says so.

**Main moved under this lane while it ran** (T-154 merged and
checkpointed, `b650f62` → `0d82a60`). The gate derivation was re-run
against the new tip: `git merge-tree --write-tree 0d82a60 HEAD` exits 0
and the merge still adds the same **5** paths, so no gate's answer moves.

### CI cycle 2 — the delivered tip, and the same two answers

Run **33256467475** on `33f61d7`, `ubuntu-24.04`, job `99110974064`.

- **`cargo suite` — SUCCESS**, second consecutive green: **200 / 0**,
  **81 / 0** (+1 ignored), **188 / 0**, with
  `a_hostile_init_line_model_is_refused_and_a_real_one_round_trips ... ok`
  and `an_env_pair_past_the_execve_element_bound_is_dropped_and_the_turn_stands
  ... ok`.
- **`graph currency` — FAILURE**, `graph.json is STALE`, and steps 19–26
  skipped again. Unchanged and expected: the regen belongs to the
  checkpoint (GRAPH REGEN), and `docs/architecture/graph.json` is outside
  `[app-agent]`.

**Two of a cap of four cycles spent, and the cap was not the constraint.**
The card's own red is closed and reproduces closed. What is NOT closed by
this lane, and cannot be from inside it, is the rest of the job: **steps
19–26 have still never executed on Linux in any run this repository has
made**, on either branch. The regen at the checkpoint is what unblocks
them, and the FIRST push of main after it is the run that will say whether
"CI runs green end to end" is true. It should be watched as a first run,
not as a formality.

### Final verification, all four suites at `34856d0`

Re-run after the last notes edit, because the card body is a code input
and this lane already proved that the hard way. Exits from `$?`, unpiped.

| command | from | result | exit |
|---|---|---|---|
| `cargo test` | app/src-tauri/ | 18 `test result: ok` lines, 0 failed anywhere — **200** lib · **81** agent_runner (+1 ignored) · **188** nputer-index; lib suite **4.14s** | **0** |
| `npx vitest run` | lib/parser/ | **314** passed, 15 files | **0** |
| `npm test` | app/ | **1013** passed, 47 files | **0** |
| `NPUTER_E2E_PORT=14566 npm test` | tools/e2e/ | **233** passed, 2.4m | **0** |

`34856d0` is the tip these were measured at; the only thing after it is
this table. The code has not moved since **`b5e3e4e`** — every commit
since is `docs/tasks/` — so CI cycles 1 and 2 tested exactly the source
that ships here.

### CI cycles 3 and 4, and where the branch is left

Cycle **3** (`33256856543`, tip `34856d0`) was **cancelled** by the
workflow's own `concurrency: cancel-in-progress` when cycle 4's push
superseded it — not a red, and not a signal about anything.

Cycle **4** (`33257012982`, tip `6f4205e`): **`cargo suite` SUCCESS**, the
third consecutive green cargo step, and the job stops at `graph currency`
for the third time. **THE ANSWER HAS NOT MOVED ACROSS THREE RUNS AND TWO
DISTINCT TREES**, which is what makes it a property rather than a run.

**THIS COMMIT IS DELIBERATELY NOT PUSHED.** The remote branch is left at
`6f4205e`, one commit behind, because pushing this paragraph would spend a
fifth CI cycle to re-measure a code diff that has not changed since
`b5e3e4e` — and the brief's cap is four. The lane's authority is the local
branch, which the merge is performed from; the PR exists for the runner
and nothing else.

---

## Verdicts

2026-08-29 — verifier `claude-opus-5@subagent` (independent hand; the
executor's notes were read only AFTER the attack set below was written,
and every figure stamped here is my own measurement at a named ref):
**APPROVED WITH ASSIGNED CORRECTIONS — one correction, named in §5.**

The mechanism is right, the card's own diagnosis of the CHANNEL is wrong
and the executor's replacement is correct, the guard FIRES rather than
merely passing, and the one instruction the executor refused is refused
correctly — I reproduced the impossibility rather than taking the
argument. What is not delivered is a body over the arm the change exists
to protect: the two PRODUCTION-shaped call sites are killed by nothing in
the tree.

### 1. What I attacked, written BEFORE the notes were opened

From the card (frontmatter through `## Disposal`) and
`git diff b650f62..5622db9` alone: that arm (a) says *bound `model` where
the argv is BUILT* while the diff bounds the ENVIRONMENT, so either the
card or the diff is wrong about the channel; that arm (a)'s promise
(*"then the fixture passes on both platforms"*) is testable by putting
200,000 back; the off-by-one, bound-removed and truncate-not-drop mutants;
whether the NUL in the pair arithmetic is pinned or shares a literal with
its test (the symmetric-mutation hazard); whether the bound-removed mutant
can red at all on macOS, where no per-element cap exists; whether the argv
body is parametrised by the constant it checks (T-063) and whether it
walks the adapter PLURAL (shape seven); whether a production path puts a
model on `execve` at all; whether `set_child_env`'s stderr line echoes an
attacker-controlled key; and whether a dropped `PATH` is a worse failure
than the `E2BIG` it replaces.

### 2. The card is wrong about the channel, and the executor is right

Derived from the tree before reading a word of the notes.
`--model` is **deliberately never argv** — `validate_model`'s own header
and `sessions.rs`'s `model` field both say so (ADR-003, the user's CLI
default IS the model), and the only `--model` in `adapter.rs` is a member
of the documented-flag catalogue. `AgentAdapter::argv` assembles a FIXED
template with exactly one substituted `SESSION_ID_SLOT`, and `ADAPTERS`
holds one entry. The channel is the child ENVIRONMENT:
`Options.model` → `NPUTER_FAKE_MODEL` in `RunnerConfig.extra_env` →
`apply_child_env` → the new `set_child_env`.

**And `extra_env` is a test seam, so the card's "product half" as written
does not exist.** The only production construction is
`RunnerConfig::default()` (`lib.rs`, the `app.manage(AgentState::new(...))`
site), whose `extra_env: Vec::new()` is itself pinned by a unit assert in
`runner.rs`. No production path puts a model on `execve`. The exposure
that IS real is the one the executor names: `ENV_ALLOWLIST` values read
from the parent with `std::env::var_os`, and `PATH` captured from a login
shell by the `NPUTER_LOGIN_PATH=$PATH` probe. Both now pass through the
bound. **The diagnosis holds, the named channel did not, and the
substitution is legitimate.**

### 3. `MAX_ARG_STRLEN`, and the macOS half re-measured by hand

The Linux claim — that the per-element cap bounds envp strings exactly as
argv strings — is correct from the kernel's own structure: `copy_strings`
is the single routine called for BOTH vectors and it carries the
`MAX_ARG_STRLEN` check, which is `PAGE_SIZE * 32` and independent of the
far larger total `ARG_MAX`. No Linux was reachable from this seat either,
so I did not restate it as a measurement — but CI settles it
behaviourally (§6).

macOS, my own probe, Darwin 25.6.0 arm64, `exec`ing `/usr/bin/true` under
one oversized env pair: **200,000 → 0 · 1,000,000 → 0 · 1,040,000 → 0 ·
1,048,000 → fails · 1,100,000 → fails**, against `getconf ARG_MAX`
1,048,576 and `getconf PAGE_SIZE` 16,384. There is no per-element cap to
find here; the only limit is the sum. The executor's figures reproduce
exactly.

**The bound's VALUE (65,536) is a judgement and it is not indefensible** —
half the smallest per-element cap, 512× the longest legitimate value
(`SESSION_ID_MAX_LEN` / `MODEL_MAX_LEN` = 128). I record that mutants M1
through M4 below red on the MECHANISM and not on the number: every
assertion derives its inputs from the constant, so moving the value
re-derives rather than reds. That is the right property for a judgement
call and it is why I do not contest the number.

### 4. The drill — the guard is shown to FIRE

Detached worktree `/Users/ujju/Projects/v153s2-drill` at **`5622db9`**,
33-character root, `CARGO_TARGET_DIR` inside it at `.v153s2-target`; one
stem `v153s2` on the worktree, the target dir, the driver and every
results file, with a guard that recognises MY drill and not the shared
prefix. Every mutation one-sided and read back with `git diff` before the
run. **Baseline 200 / 81 (+1 ignored) / 188, exit 0, lib suite 4.06s.**

| # | mutated (one side) | exit | bodies killed |
|---|---|---|---|
| M1 | `child_env_pair_fits` `<=` → `<` (off by one, refusing) | **101** | 2, one per binary: `a_child_env_pair_fits_up_to_the_bound_and_not_one_byte_past_it` (199/1) and `an_env_pair_past_the_execve_element_bound_is_dropped_and_the_turn_stands` (80/1) — **the positive control dies** |
| M2 | the bound removed (`true \|\| …`) | **101** | the same 2, 199/1 and 80/1 — **and it reds on macOS**, which was the open question |
| M3 | TRUNCATE the value instead of dropping it whole | **101** | **1** — `an_env_pair_past_…`; lib stays 200/0. The refused-WHOLE discriminator is real |
| M4 | the NUL dropped from the pair arithmetic | **101** | **1** — the adapter unit body (199/1). The arithmetic is pinned; the two sides are NOT symmetric |
| M5 | the `ENV_ALLOWLIST` loop bypasses `set_child_env` | **0** | **NONE — whole suite green** |
| M6 | `PATH` bypasses `set_child_env` | **0** | **NONE — whole suite green** |
| M7 | `MODEL_MAX_LEN` → `60_000` | **101** | **1** — `a_hostile_init_line_model_is_refused_and_a_real_one_round_trips` (80/1); the moved fixture still earns its band |
| M8 | `SESSION_ID_MAX_LEN` → `70_000` | **101** | 3, incl. `every_argv_element_an_adapter_can_assemble_fits_the_spawn_bound` |
| M9 | a 70,000-byte literal into `CLAUDE_V1.spawn_args` | **101** | 3 (197/3), incl. the same argv body |
| M10 | the card's ORIGINAL `200_000` fixture restored, bound in place | **101** | `[oversize] registry model` — `left: Some("fake-model-1")` / `right: None` |

**Restoration proved, not asserted.** All four touched files sha256-MATCH
`5622db9` (`adapter.rs` `027955f4…`, `runner.rs` `13ed6cc4…`,
`agent_runner.rs` `58af342d…`, `fake_agent.rs` `b0bd0728…`);
`git status --porcelain` showed only my own `.v153s2-target/`; **restored
run 200 / 81 (+1) / 188, exit 0**, identical to baseline. Worktree
removed; nothing from the drill was ever committed and no graph was
regenerated inside it (`T-153-s3`'s hazard, respected).

**M10 settles two things the executor asked to be taken on argument.**
First, the refused brief instruction: a fixture that crosses the new bound
CANNOT keep `registry.model == None`, because crossing removes
`NPUTER_FAKE_MODEL` and `fake_agent`'s `unwrap_or_else` reports the legal
default `fake-model-1`, which round-trips. That is now measured, not
reasoned. Second — and the card should carry this — **arm (a)'s own
sentence is false**: bounding the runner does NOT make the 200,000 fixture
pass on both platforms, it makes it red on both. Arm (b) was NECESSARY,
not the cheap alternative the Disposal section presents it as. The
executor reached the right pair; the card's stated reason for it was wrong.

### 5. ASSIGNED CORRECTION (one)

**M5 and M6 are the finding.** Reverting either production-shaped call
site — the `ENV_ALLOWLIST` loop, or `PATH` — from `set_child_env` back to
`command.env(…)` leaves the ENTIRE cargo suite green at exit **0**. The
only body driving the bound drives `extra_env`, which §2 establishes is
empty in production. So the arm the change EXISTS to protect is killed by
nothing in the tree: POISON DRILL **shape seven**, a mutant no body kills
because the mutant set followed what the seam can drive rather than the
criterion. The executor disclosed this himself under "Least confident" §4
and named the seam — it is an unclosed gap, not a concealed one, which is
why this is a correction and not a rejection.

**The correction, precisely.** Add ONE body to
`app/src-tauri/tests/agent_runner.rs`, two arms one byte apart, shaped
exactly like `an_env_pair_past_the_execve_element_bound_is_dropped_and_the_turn_stands`
but driving a channel `set_child_env` reaches in production. The cheapest
vehicle already exists: `RunnerConfig.path_override` is the FIRST branch
of `apply_child_env`'s `PATH` chain, so
`path_override: Some("P".repeat(SPAWN_ELEMENT_MAX_LEN - "PATH".len() - 2))`
must arrive in the child's `env.json` at its exact byte length (the
positive control), and the same value one byte wider must be ABSENT with
the turn still `Completed`. If the integrator wants the allowlist loop
covered too rather than only `PATH`, the harness already plants a parent
variable (`CANARY` at `agent_runner.rs`'s `harness`) and a body already
asserts the child's environment against it, so an oversized `HTTPS_PROXY`
is the same shape one line over. **The acceptance test for this correction
is mechanical: mutants M5 and M6 above must red.** Everything else in the
diff stands as delivered.

### 6. Suites and gates — my own runs, at the refs named

Lane worktree at **`5622db9`**, working tree carrying only my own card
edit. Exits read from `$?` unpiped, into files under `/private/tmp`.

| command | from | result | exit |
|---|---|---|---|
| `cargo test` | app/src-tauri/ | 18 `test result: ok` lines, 0 failed anywhere — **200** lib · **81** agent_runner (+1 ignored) · **188** nputer-index; lib suite **4.19s**, under the cache cliff's 9.5s | **0** |
| `npm ci` + `npm run build` + `npx vitest run` | lib/parser/ | **314** passed, 15 files | **0** |
| `npm install` + `npm run build` + `npm test` | app/ | **1013** passed, 47 files | **0** |
| `NPUTER_E2E_PORT=16218 npm test` | tools/e2e/ | **233** passed, 2.5m; tree clean afterwards but for my card | **0** |
| `NPUTER_BOOT_PORT=16219 npm run boot:check` | tools/e2e/ | both lines — `[nputer] project folder: …/nputer-T-153s2` and `[nputer] window "main" created` | **0** |

Both scratch ports were `lsof -nP -iTCP:<port> -sTCP:LISTEN`-read at ZERO
ROWS immediately before binding. **1420 was read once with the one
permitted command and nothing else**, and it is HELD — `node` pid 19746,
`TCP [::1]:1420 (LISTEN)`, the human's app on IPv6 loopback exactly as the
PORT RULE records. It was never probed, bound or contacted; the lane's
`npm install` ran in this worktree, not in the checkout the app serves
from.

**Standing gates**, derived by the RANGE RULE's pre-merge form against the
CURRENT main tip `3ff7f30` (`git merge-tree --write-tree` exit **0**, tree
`66977a08`, **5 paths**; never `main..HEAD`):

- **GRAPH REGEN — FIRES** (3 `.rs` outside docs/). **ASKED, not
  predicted**: `index --check --root ../..` exits **1** and it is the REAL
  red, not the `--root` false one — it prints both sides (committed
  **1,020,023 B · 189 files · 2,152 symbols · 2,111 edges** against fresh
  **1,021,184 · 189 · 2,156 · 2,111**) and names `~3` files, which are this
  lane's own three. **NOT A LANE DEFECT**: CONVENTIONS' GRAPH REGEN bullet
  commits `docs/architecture/graph.json` *with the CHECKPOINT*, for the
  stated reason that the checkpoint edits indexed fixture files and a
  regen committed earlier is stale again by the time it lands; and that
  path is outside `[app-agent]`, whose fence is C-14's `paths:`.
- **BOOT GATE — FIRES** (3 paths under `app/src-tauri/**`). Run by me,
  exit **0**, both lines above.
- **DOCS GATE — FIRES**, exit **1**, on the two `docs/tasks/T-*.md` paths,
  owing app/, tools/e2e/ and lib/parser/ — all three run green above. It
  also reports *"every live task card's frontmatter parses, with a legal
  status"*, which covers my own `building` → `verifying` flip.

**CI, read-only via `gh`; nothing pushed and no run triggered.** All three
lane runs — **33255912812**, **33256467475**, **33257012982** — show
`cargo suite` **✓** on `ubuntu-24.04` and then **X** at
`graph currency (nputer-index index --check)`, with steps 18–26 (`cargo
audit`, the whole-tree docs gate, the e2e types/browser/lane steps and the
xvfb boot step) skipped. Read from run 33257012982's own log:
`a_hostile_init_line_model_is_refused_and_a_real_one_round_trips ... ok`,
`an_env_pair_past_the_execve_element_bound_is_dropped_and_the_turn_stands
... ok`, **200 / 81 (+1 ignored) / 188**, then
`graph.json is STALE`. Run 33256856543 is `cancelled`, not red. The prior
card's run 33253673074 fails AT `cargo suite` with graph currency never
reached, so the executor's "no run has reached this step before" holds.

**That Linux log is the strongest evidence in this verdict** and it is
worth naming as such: on the platform that HAS the per-element cap, a
65,517-byte env pair crossed `execve` and a 65,518-byte one was refused by
this runner before it tried, both green. The Linux half of the derivation
is confirmed behaviourally, which is exactly the claim macOS cannot make.

### 7. Security sweep — clean, and the class sweep is recorded

No dependency additions and no manifest movement (the pair is three `.rs`
and two `.md`, nothing else). No secrets, no new IPC surface, no endpoint,
no authz change. `set_child_env`'s stderr line echoes the KEY and never
the value — and the key is never attacker-controlled on any production
path, being an `ENV_ALLOWLIST` literal, `TERM`, `PATH`, or an `extra_env`
entry that production never writes.

**Class named, sweep run, result recorded even though it is nearly
empty** — the class is *a string handed to `execve` without a bound*, and
the sweep was `Command::new` / `.env(` / `.envs(` / `.arg(` / `.args(`
over `app/src-tauri/src/**/*.rs` from the repo root. Four production
sites: the turn spawn (covered on both vectors), and the login-shell and
version probes, which set no environment at all and inherit the parent's
whole — theoretical only, since the parent was itself `execve`d through
the same cap. Filed as `T-153-s4` rather than folded in here.

### 8. Judged and not raised as defects

- **Dropping rather than failing the turn** (the executor's "Least
  confident" §2) is the right call and I decline to reopen it: the typed
  failure family exists so a failure never costs an affordance falsely,
  and a typed `TurnError` here would cost a turn that works on macOS
  today. The drop is loud on stderr and names the key.
- **An oversized `PATH` is now dropped rather than `E2BIG`**, so on macOS
  a >64 KiB `PATH` changes from "forwarded and working" to "absent". At
  ~600 hundred-character entries this is pathological, the program itself
  is resolved absolutely so the spawn survives, and the drop is announced.
  Noted, not charged.
- **`every_argv_element_an_adapter_can_assemble_fits_the_spawn_bound`
  kills no mutant uniquely** — 3 bodies under M8, 3 under M9. That is
  shape SIX, whose own catalogue entry says a redundant body costs
  nothing; its diagnostic value is real, because the bodies that red
  beside it red with unrelated messages. Not charged.
- **The bound's value** — §3. A judgement, defended in the constant's own
  doc comment, and not contested.

### 9. Routed rather than judged

- **`T-153-s4`** filed by me: the two probe spawn sites the bound never
  reaches, and the argv body walking `CLAUDE_V1` where the file's own
  house style walks `ADAPTERS`.
- **`T-153-s3`** (the executor's) parses and is correctly shaped; its
  hazard was respected in my drill and nothing was committed from it.
- **Housekeeping for the integrator, not a defect**: the executor's drill
  worktree `/Users/ujju/Projects/t153s2-drill` is still on disk at
  `b5e3e4e`. It is detached, holds no fence and is not a lane, but it is
  the litter the scratch-collision bullet warns about; mine was removed.
- **A method conflict I did not resolve.** `method/roles/verifier.md`
  states that this seat does NOT read `docs/ROADMAP.md`, with its reason;
  the dispatch brief instructed reading it. **I followed the role file and
  did not open ROADMAP** — nothing in this verdict rests on it — and route
  the disagreement to the orchestrator rather than settling it in a
  verdict.

### 10. The gates at the tip THIS verdict created

A verdict is a commit, and every figure in §6 was measured at `5622db9`,
which is not the tip a reader of this page is standing on. So the
obligation was discharged rather than assumed. At my own verdict tip the
RANGE RULE's pre-merge form against main `3ff7f30` returns **6 paths**
(the three `.rs`, and now three `docs/tasks/T-*.md`), `merge-tree` exit
**0**. The **DOCS GATE** fires at exit **1** owing the same three suites
and reports *"every live task card's frontmatter parses, with a legal
status"* — which is what clears my `verifying` flip and the new card's
frontmatter. Run twice, because amending this section moved the tip the
first set was measured at: once at **`36edfda`** and again at
**`1f5e139`**, identical both times.

| command | from | result at `1f5e139` | exit |
|---|---|---|---|
| `npx vitest run` | lib/parser/ | **314** passed, 15 files | **0** |
| `npm test` | app/ | **1013** passed, 47 files | **0** |
| `NPUTER_E2E_PORT=16221 npm test` | tools/e2e/ | **233** passed, 2.4m | **0** |

Ports 16220 and 16221 were `lsof`-read at zero rows immediately before
binding; the tree was clean after each. GRAPH REGEN and BOOT GATE cannot
be moved by a docs-only commit and were not re-run — their answers stand
at §6, where they carry their ref. **`1f5e139` is the ref those three
were measured at, and the only thing after it is this paragraph** — the
same honest ceiling the executor's own final ledger states, and the
reason no count on this page appears without the commit it was taken at.

