---
id: T-042
title: Genesis switch truthfulness — the snapshot, the transitions, the echo, the change log
feature: F-03
milestone: 3
priority: 5
size: M
status: building
blocked_by: []
touches: [app-shell, app-interview]
builder: claude-opus-5
verifier:
built_by: "claude-opus-5 @fresh"
verified_by:
review:
---

Absorbs: T-024-s3, T-026-s4, T-026-s5, T-026-s6. Triage 2026-08-16:
four findings on one seam — `apply_genesis_folder`/`arm_genesis`/
`rearm`/`ensure_docs_watch` in docs_watch.rs and
`reducePickOutcome`/`runPicker` in watcher-store.ts — every one of them
the T-018 family's shape, a claim outliving the truth. Three were
reproduced first-hand by T-026's verifier with exact counts. Landing
them separately would rebuild the same batch-seam fixtures three
times. Serialize app-shell with T-041/T-022 at dispatch.

CORRECTED 2026-08-17 by T-027's planning pass, which read both sides:
**T-027 is NOT the second consumer** and this card's original premise
was wrong. T-024's log answers "what changed in the last 5 seconds"
(the writing pulse); T-027's banked chips need "what changed since
this turn began" — a per-turn baseline diff. Same evidence, different
window, no shared log; T-027 reads T-024's log not at all and
introduces no second rolling log of its own. So criterion 4's forcing
function has evaporated.

STILL LAND BEFORE T-027, for a different and better reason: criterion
1. A genesis switch onto a folder whose `docs/` already holds files
sends no snapshot, so T-027's turn-1 baseline would be empty and every
pre-existing file would chip as if the planner had just written it.
T-027's plan chose to accept that lie and tripwire it rather than lose
every interview's turn-1 scaffold chips. Landing this first removes
the case by construction and DELETES a tripwire instead of adding one.

## Acceptance criteria
- WHEN a genesis switch lands on a folder whose docs/ already holds
  files but no plan THE outcome SHALL carry the collected tree as a
  snapshot, so the pane renders what is actually there instead of
  `docs/ · nothing written yet` over a non-empty docs/. The path
  already collected the tree; this costs one `build_snapshot`. The
  verifier's repro is the failing→passing pin: a folder with
  docs/ARCHITECTURE.md + docs/decisions/001-x.md yields
  `Genesis (probe { architecture: true, .. })` and then NO emit at all
  in a 1.2 s window after `settle()`, while a subsequent real edit
  emits 2 files — proving the watch was armed the whole time
  (T-026-s4).
- WHEN an armed docs/ becomes unarmed (an EMPTY docs/ deleted) THE
  watcher SHALL emit on the transition, exactly as T-026's criterion 4
  made the (unarmed → armed) transition emit — ONE rule ("a
  watch-state transition is news the tree cannot carry"), not two
  special cases, and the suppression invariant stays exactly as narrow
  as today. Pinned by the verifier's five-step sequence: appears →
  emits once; next batch silent; DELETED → emits; recreated → emits
  once; next batch silent (T-026-s5).
- THE `model-updated` echo SHALL fire only for a payload a real
  snapshot produced — the guard reads provenance, not the seq — and
  `runPicker`'s two comments SHALL say what the code does. Today the
  genesis case deliberately advances the watermark
  (`docs: { ...resetDocsForProjectSwitch(prev.docs), seq: outcome.seq }`)
  so late emits are provably stale, Rust's seq is global and
  monotonic, and the guard is therefore ALWAYS true: a real probe
  emitted `model-updated {"seq":7,"generatedAtMs":0,...}` — the zero
  timestamp is the tell. A test SHALL assert a snapshot-less switch
  emits no echo AND that a real snapshot still does (T-026-s6).
- THE render-phase ref stamp SHALL be RATIFIED rather than relocated
  — the architect's pick, recorded here before dispatch as the
  criterion requires (T-024-s3). Rationale: the arm that moved the log
  into the watcher store existed to serve a second consumer, and
  T-027's planning pass proved there is no second consumer. Moving
  state across a component boundary to serve nobody is cost without
  benefit, and `observeDocsChange` is already a pure fold whose
  identity guarantees are pinned. So: the pattern is recorded in
  `GenesisPane.tsx`'s header AND as a CONVENTIONS gotcha (a
  render-phase ref stamp is legitimate HERE because it is guarded,
  bounded to a few-ms pulse window, and derives from props the render
  already has — the T-012 precedent), `observeDocsChange`'s identity
  guarantees for the empty / already-observed / stale-seq cases keep
  their pins, and NOTHING moves into the store. IF a future second
  consumer appears THEN the relocation is a change of source, not of
  mechanism — recorded so the option stays open rather than lost.
- THE existing suppression, stale-drop and project-switch invariants
  SHALL keep their current tests green — changed, never loosened.

Verification: headless — cargo tests driving T-018's batch seam with
exact emit counts; vitest on the store; jsdom on the pane. IF T-041 has
landed THEN its genesis spec renders the non-empty-docs shape too.
@human: none NEW — criterion 1 ANSWERS the T-026-s4 question currently
on the visual list ("does 'nothing written yet' read right over a
non-empty docs/"): after this task the screen never makes that claim,
so the item retires rather than being judged.

## Implementation notes

Executor claude-opus-5 @fresh, 2026-08-17, branch `t042-switch-truth`
(worktree ../nputer-t042). Branch point: **main@8dadb59** (the criterion-4
ruling commit). **Main moved during the build** — T-030 merged at 59558de,
`lib/parser/` only — so every diff and baseline below is stated against
**8dadb59**, not against `main`'s tip. `comm`-style check: T-030's changed
set is entirely under `lib/parser/` + `docs/tasks/T-030*`, and this
branch's is six files with none in either place, so the overlap is empty.

**Baselines, DERIVED at the branch point in this worktree, not inherited**
(fresh `npm ci` in lib/parser, `npm install` in app, `npm ci` in
tools/e2e): lib/parser **159/159 (10 files)**; app **535/535 (32 files)**
— and note the app suite needs `npm run build` FIRST, because four tests
in `shell-harness.test.ts` and `genesis-mount.test.tsx` assert against the
built bundle and red with a staleness message on a fresh worktree;
src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**, exit 0,
zero warnings, 11 test binaries; tools/e2e **40/40 in 8.0s**. Every one of
the four matches the dispatch's estimate exactly.

### What was built — four findings, one seam

**Criterion 1 — the switch carries the tree it found.**
`PickOutcome::Genesis` gains `snapshot: Option<DocsSnapshot>`
(docs_watch.rs:180-197). The mechanism is a one-bit widening of the
rendezvous: `WatchCtl::ArmGenesis`'s ack becomes
`Result<bool, String>` and `arm_genesis` answers `Ok(true)` exactly when
it delegated to `rearm` — i.e. when a plain `docs/` was there and the
ordinary recursive watch armed over it. The arming thread is the only
place that knows this for certain, so it SAYS so rather than letting
`apply_genesis_folder` re-stat and guess across the validate→arm window.

The snapshot is then collected **after the ack**, and that ordering is
load-bearing rather than incidental — it is the same rule
`open_as_project` has followed since T-007, for the same reason stated in
its own comment: the arming thread resets `target.last` to the tree it
saw, so a snapshot taken from THAT collection could be older than the
emit baseline, and a file written in the gap would never diff and would
be suppressed forever. The cost is one extra `collect_docs_tree`, which
is exactly what the card priced ("this costs one `build_snapshot`").

`snapshot.seq == outcome.seq` by construction — one stamp for the switch
and its tree — which is what lets the frontend apply the tree and advance
the stale-drop watermark in a single step.

**Criterion 2 — ONE rule, not two special cases.** `ensure_docs_watch`
used to `return true` from inside the (false,true) arm. It now MEASURES:
`let was_armed = target.docs.is_some();` at the top and
`target.docs.is_some() != was_armed` at the bottom (docs_watch.rs:1011-1081).
The rule is stated once, in the doc comment and in `handle_fs_batch`'s
gate: **a watch-state transition is news the tree cannot carry.** Both
directions fall out of the same expression, and three properties fall out
with them, none of them written as a case:
- a wholesale REPLACEMENT (armed→armed, new inode) stays silent — the
  content diff is its news, and it is asserted silent for equal content;
- a docs/ that appears but whose `watch()` FAILS reports no transition
  (still unarmed), so nothing is claimed that did not happen;
- a docs/ that is replaced and whose RE-ARM fails now reports
  armed→unarmed, which is true and was previously invisible.
The local in `handle_fs_batch` was renamed `just_armed` →
`watch_state_changed` so the name states the rule too.

**Criterion 3 — the echo reads provenance.** The guard
`next.docs.seq > before.docs.seq` was never provenance: the genesis case
advances the watermark DELIBERATELY (that is the T-007 stale-drop
invariant kept without a snapshot) and Rust's counter is global and
monotonic, so a switch seq is always greater and the guard was always
true. Replaced by an exported, named predicate
`outcomeCarriesSnapshot(outcome)` (watcher-store.ts) — provenance is a
property of the OUTCOME, so it is read from the outcome. The identity
check `next.docs !== before.docs` stays, because a stale or duplicate
snapshot reduces to `prev` by identity and must not echo twice.

THREE comments that disagreed with the code now agree with it:
`runPicker`'s doc comment ("a genesis switch carries no snapshot, so it
echoes nothing"), the echo guard's own comment ("Only a real snapshot
advances the docs seq"), and — found while fixing criterion 1 —
`reducePickOutcome`'s genesis-case comment ("No snapshot rides a genesis
switch (there is nothing there yet)"), which the card did not name.
Recorded because the comment was, as T-026-s6 put it, the only place the
invariant was written down. Note the echo guard has lived in
`commitPickOutcome` since T-041 split it out of `runPicker`; the card
says "runPicker's two comments" from s6's older reading.

**Criterion 4 — RATIFIED, and nothing moved.** The architect's ruling is
recorded in two places, as the criterion requires: `GenesisPane.tsx`'s
header (the three conditions — guarded / bounded / derived-from-props —
plus why it was not relocated and what a future second consumer would
change), and one CONVENTIONS gotcha in the established shape. The
in-body comment at the write itself now says "RATIFIED rather than
relocated at T-042 criterion 4" so a reader at the line finds the ruling.
`genesis-derive.ts` is a **zero-byte diff**, so `observeDocsChange`'s
identity pins are green unmodified.

### Criteria → evidence map

| criterion | code | evidence |
|---|---|---|
| 1 snapshot on a docs-bearing switch | docs_watch.rs:177-197 (variant), :212-224 (ack), :778-874 (`apply_genesis_folder`, the snapshot at :859), :1282-1296 (`arm_genesis`); watcher-store.ts (`PickOutcomePayload` genesis, `reducePickOutcome` genesis case) | cargo `a_genesis_switch_onto_a_folder_whose_docs_holds_files_carries_that_tree`, `a_genesis_folder_that_already_has_an_empty_docs_dir_arms_the_docs_watch` (strengthened), `genesis_pick_opens_a_docsless_folder_and_arms_the_root_sentinel` (strengthened: `snapshot.is_none()`), `genesis_and_no_docs_wire_shapes_are_pinned` (both shapes); vitest `genesis-switch-truth.test.tsx` cases 1–3, `watcher-store.test.ts` two new reducer cases |
| 2 the unarmed transition emits, one rule | docs_watch.rs:1011-1081 (`ensure_docs_watch`), :1087-1132 (`handle_fs_batch` gate) | cargo `a_deleted_empty_docs_emits_on_the_armed_to_unarmed_transition` (the five-step sequence), `an_empty_docs_dir_emits_exactly_once_on_the_unarmed_to_armed_transition` (unchanged, still green), `the_suppression_invariant_stays_exactly_as_narrow_as_it_was` |
| 3 echo on provenance; comments true | watcher-store.ts `outcomeCarriesSnapshot` + `commitPickOutcome` + `runPicker` doc comment | vitest `genesis-switch-truth.test.tsx` criterion-3 block (4 cases), `watcher-store.test.ts` `outcomeCarriesSnapshot` block (2 cases) |
| 4 ratify the ref stamp, move nothing | GenesisPane.tsx header + in-body comment; docs/CONVENTIONS.md § Gotchas | the three `observeDocsChange` pins green BY NAME (below); `ShellState`/`ShellHarnessSnapshot`/`DocsModelState` byte-identical to the branch point; `genesis-derive.ts` zero-byte diff |
| 5 existing invariants green, changed never loosened | — | 217→220 cargo with every pre-existing test unmodified except three STRENGTHENED assertions; 535→546 app with zero pre-existing assertions edited |

### The eight proof obligations

**1. Criterion 1's failing→passing pin, on the T-026 verifier's own
repro.** `a_genesis_switch_onto_a_folder_whose_docs_holds_files_carries_that_tree`
builds exactly the verifier's folder — `docs/ARCHITECTURE.md` +
`docs/decisions/001-x.md` — and keeps BOTH halves of the original
observation, because only one of them was ever the bug:
`Genesis (probe { architecture: true, .. })` with `has_plan()` false;
then `settle()` and **no emit in a 1.2 s window** (an unchanged tree
emits nothing — the watch is quiet, not dead); then a real edit emits
**2 files** with `seq > switch seq`, proving the watch was armed
throughout. What is NEW is the assertion between them: the outcome now
carries a snapshot whose files are exactly
`["docs/ARCHITECTURE.md", "docs/decisions/001-x.md"]`, whose
`project_dir` is the canonical root, whose `generated_at_ms > 0`, and
whose `seq` equals the switch's.
FAILING→PASSING, measured: with `let snapshot: Option<DocsSnapshot> =
None;` substituted for the production line, `cargo test --lib` → **106
passed; 2 FAILED**, at `docs_watch.rs:2920` *"THE FIX: the tree rides the
switch"* and `:2879` *"an armed docs/ carries its tree, empty or not"*.
Reverted; `git diff` empty; 108 passed.
The DOM half, same drill on the store (`reducePickOutcome` ignoring
`outcome.snapshot`): **4 failed**, the two criterion-1 cases reporting
`expected 'docs/ · 0 files written' to contain '2 files written'` — the
exact string the pane put on screen over a non-empty docs/. Reverted;
`git diff` empty.

**2. Criterion 2's five-step sequence with exact counts.** Driven through
T-018's `handle_fs_batch` seam, counting every emit rather than sampling
one: appears → **exactly 1**; next batch → **0**; DELETED (while empty) →
**emits 1**, files empty, handle dropped; five further batches → **0**
each ("one transition, one emit"); recreated → **exactly 1**; next batch
→ **0**. Then two extensions the card did not ask for: a real file lands
→ 1, quiet → 0; and deleting a NON-empty docs/ (transition AND content
change together) → still **exactly 1**, because the rule adds a REASON to
emit, never a second emit.
MUTATION DRILL: narrowing the rule back to appear-only
(`!was_armed && target.docs.is_some()`) reds exactly one test —
`a_deleted_empty_docs_emits_on_the_armed_to_unarmed_transition` at
`docs_watch.rs:2582`, *"the disarm transition is news the tree cannot
carry: left: 0, right: 1"*. The new emit is load-bearing.

**3. The suppression invariant, as a POSITIVE assertion.**
`the_suppression_invariant_stays_exactly_as_narrow_as_it_was` holds the
watch armed throughout and asserts the emit count EQUALS the number of
content changes: 20 batches over an unchanged tree → **0**; then three
content changes each followed by five quiet batches → **exactly 1 per
change, 3 total**, asserted after each; then a wholesale docs/
replacement carrying IDENTICAL bytes → still **3**, with
`target.docs_id` proven to be a different inode. That last case is the
one that would break if the rule had widened from "the armed state
changed" to "we re-armed".
MUTATION DRILL, the over-widening direction: forcing the return to `true`
reds **5 tests**, including this one at `docs_watch.rs:2672` with
*"an unchanged tree never emits, ever: left: 20, right: 0"* and both
T-018 additive-only pins (`a_dead_sentinel_leaves_the_existing_watch_fully_working`,
`a_vanished_root_never_panics_the_batch_handler`). The invariant is
fenced from both sides.

**4. Criterion 3 both ways, off the real `model-updated` channel.** The
test mocks `@tauri-apps/api/event`'s `emit` and records every payload
where Rust would receive it, then drives the REAL App by REAL CLICKS.
- snapshot-less switch → **`[]`**, and the tell is named in its own
  assertion (`echoes.some(e => e.generatedAtMs === 0)` is false);
- docs-bearing switch → **exactly 1 echo**, `seq: 7`,
  `generatedAtMs: 1700000000007` (a real collection stamped it),
  `taskCount: 0`, `parseFailures: []`;
- ordinary `picked` → **still echoes** (`seq: 4, taskCount: 1`) — the
  guard was narrowed, not merely tightened;
- `cancelled` / `busy` / `noDocs` / `error` → **nothing, all four**.
THE TELL, REPRODUCED: restoring the old seq guard reds exactly the first
case, and the received value is T-026-s6's payload almost character for
character —
`{"seq":7,"generatedAtMs":0,"taskCount":0,"featureCount":0,"issueCount":0,"taskIds":[],"parseFailures":[],"skippedTotal":0,"truncated":false}`.
Reverted; `git diff` empty.

**5. Criterion 4's evidence.** The header comment and the CONVENTIONS
gotcha are in the diff. The three identity pins are green BY NAME:
`observeDocsChange semantics > returns identity for the pre-project empty
state and observed/stale seqs`; `observeDocsChange semantics > a project
switch re-baselines instead of stamping every path`; `the writing window
… > the baseline snapshot never reads as writing (no false pulse wall)`
— run by name (`-t`) and in the full file (24/24).
NOTHING MOVED INTO THE STORE, proven three ways rather than asserted:
`ShellState` + `ShellHarnessSnapshot` extracted from both revisions and
`diff`ed → **ZERO DIFF** (2036 bytes); `DocsModelState` likewise → **ZERO
DIFF**; and `grep -c 'ChangeLog|observeDocsChange|changedAtMs'` over both
store modules → **0** in each. `app/src/genesis/genesis-derive.ts` is a
zero-byte diff.

**6. Every new test executes.** Canary injection, then revert.
`panic!("EXECUTOR-CANARY")` into all **3** new cargo test bodies → all 3
FAILED, all 3 canaries in the output. `throw new Error("EXECUTOR-CANARY")`
into every new frontend `it()` — **7** in `genesis-switch-truth.test.tsx`
and **4** in `watcher-store.test.ts` — → **11 failed / 28 passed**.
Every revert verified with `git diff --quiet` (byte-identical, not
"looks right"), and the suites re-run green after each. No `.only`,
`.skip` or `.todo` anywhere in the diff.

**7. Suites, against the baselines above.**
- lib/parser: `npx vitest run` **159/159 (10 files)**, `npx tsc --noEmit`
  clean — and the diff to it is **0 bytes**, so untouched is literal.
- app: `npx tsc --noEmit` clean; `npm run build` exit 0;
  `npx vitest run` **546/546 (33 files)** = baseline 535 **+11** (7 in
  the new `genesis-switch-truth.test.tsx`, 4 in `watcher-store.test.ts`).
- app/src-tauri: bare `cargo test` **220 passed + 3 ignored, 0 failed —
  three consecutive runs, identical counts** (baseline 217+3, **+3** in
  docs_watch); `cargo clean -p nputer && cargo build` → **zero warnings**,
  exit 0.
- tools/e2e (run, never edited): `npx playwright test` **40/40 in 8.1s**,
  headless, 1 worker, retries 0, no skips; `npm run typecheck` clean;
  `npm run lint:tokens` **clean, 38 files**.
- **NO NEW CSS**: the build emits `index-RXeeD2qB.css` at **41.30 kB** —
  the same content-hashed asset T-049 and T-050 built. Only the JS moved:
  `index-qJOlkERM.js` 445.29 kB (main's was `index-DYl_93aj.js` 445.14).

**8. Fence, proven.** `git diff 8dadb59 --stat` is **exactly six files**:
`app/src-tauri/src/docs_watch.rs`, `app/src/lib/watcher-store.ts`,
`app/src/genesis/GenesisPane.tsx`, `app/test/genesis-switch-truth.test.tsx`
(new), `app/test/watcher-store.test.ts`, `docs/CONVENTIONS.md`.
Zero-byte diff verified for every sibling lane and every fenced surface:
`app/src-tauri/crates/` (T-014), `lib/parser/` (T-030), `tools/e2e/` and
`.github/` (T-045), `app/src/architecture/` (T-034), and **T-027's three
files** — `App.tsx`, `components/` (which is where both `accelerators.ts`
and `GenesisScreen.tsx` live) — plus `app/src-tauri/src/lib.rs`,
`acl_pin.rs`, `capabilities/`, `tauri.conf.json`, `Cargo.toml`,
`Cargo.lock`, both package manifests and lockfiles, `docs/architecture/`,
`method/`, `app/src/styles/`, `app/src/index.css`,
`app/src/lib/docs-model.ts`, `app/src/genesis/genesis-derive.ts`.

**ACL / webview grants — ZERO, re-derived rather than asserted.**
`gen/schemas/` is gitignored, so both ends were genuinely rebuilt in this
worktree: `rm -rf gen/schemas && cargo clean -p nputer && cargo build`
with the branch point's `docs_watch.rs` checked in, then again at HEAD.
`diff -r` across the two regenerations: **ZERO DIFF, all four artifacts
byte-identical** — `capabilities.json`
`4fca70b5437f720b9a72c727c0663349aa9e8b31917dcc0a870012de02406b07`,
`acl-manifests.json`
`d3eace193b1e453756736eaf27bb156df62c7a41b2fe101403ee92ef93e69699`,
`desktop-schema.json` = `macOS-schema.json`
`2a16f62c90a059a1b67e4501216bb3476f402087e99ba659dd38c9d0521f3b07`
(the same three values T-026's verifier recorded, unmoved through six
merges since). `EXPECTED_GRANTS` byte-compared across revisions:
**identical, 7728 bytes**. All **6** acl_pin tests pass by name on every
run. And no IPC surface moved at all: the whole diff over `app/src-tauri/src`
and `app/src` contains **zero added or removed** `#[tauri::command]`,
`invoke_handler`, `invoke(`, `listen(` or `emit(` call sites (the single
grep hit is a test-local variable named `emit`). No new dependency, no
lockfile line.

### Hygiene, and what was deliberately not done

- Zero hits over the added lines for `dangerouslySetInnerHTML`,
  `innerHTML`, `eval(`, `localStorage`, `fetch(`, `WebSocket`, `unsafe`,
  `Command::`, `std::process`. The snapshot that now rides the switch is
  the SAME `DocsSnapshot` the `docs-changed` channel has carried since
  T-003 — same collector, same containment rules, same skip/symlink
  refusals, same camelCase serde — so no new content class crosses the
  boundary and no new path is disclosed.
- **Port 1420 was never bound, contacted or signalled.** It was OBSERVED
  once with `lsof`: vite pid 64249, `target/debug/nputer` pid 64276, both
  alive before and after. The e2e lane ran on its own 14520 and released
  it (`lsof` empty afterwards); `pgrep -fl tauri-boot-check` and
  `pgrep -fl fake_agent` are both empty.
- **THE BOOT CHECK WAS NOT RUN, and that is news rather than silence**
  (CONVENTIONS BOOT GATE, "the executor runs it too"). The dispatch
  fences 1420 and this session is headless; per the same override that
  applied at T-049 and T-050, **the merge owes it** — the diff touches
  `app/src-tauri/**` and `app/src/**`, so the trigger is present. Exit
  code: not obtained.
- No model call anywhere; the env-gated `#[ignore]` smoke was not run
  (one of the 3 ignored). No screen control, no screenshots, headless
  throughout.
- The served-bundle / real-input half is NOT extended here — `tools/e2e/`
  is T-045's lane tonight and was run, never edited. See the suggestion
  below for what that costs.

### For the integrator: the graph regen delta, MEASURED

The interim T-009-s1 rule triggers (this diff touches `*.ts/*.tsx`
outside docs/). I regenerated in-branch to measure, then restored
`docs/architecture/graph.json` to the committed bytes (`git diff` clean;
the ignored self-check is red on-branch exactly as it should be).

- files **94 → 95**: adds `app/test/genesis-switch-truth.test.tsx`.
  **Nothing removed.**
- content-changed: `app/src/lib/watcher-store.ts` (loc 841→910, symbols
  **45→46** — the new exported `outcomeCarriesSnapshot`),
  `app/src/genesis/GenesisPane.tsx` (loc 295→332, symbols unchanged — the
  edit is comment only), `app/test/watcher-store.test.ts` (loc 383→466).
- stats: symbols **667 → 686**, edges **1063 → 1075**. Languages still
  `["ts"]`, **zero `.rs` files indexed**, so all of docs_watch.rs is
  invisible to the map (Rust extraction is still T-010's) — which is why
  the biggest half of this diff moves no graph node at all.
- **FOUR assertions move**, and the third is DERIVED from the added-file
  list rather than from a failure, per the standing practice:
  1. `architecture-dogfood.test.ts:608` `toBe(94)` → **95**, and the test
     NAME at :607 (`all 94 files map` → `all 95 files map`);
  2. `architecture-dogfood.test.ts:815` relation row
     `["C-05","C-10","confirmed", 24]` → **25** (the new test file's
     edges into the store);
  3. `architecture-dogfood.test.ts:639` `["C-05", 44]` → **45** — derived
     BEFORE anything ran: the added file matches `app/test/**`, and a
     registry sweep confirms `docs/architecture/components/C-05-app.md`
     is that glob's **only** claimant. It sits behind the file count in
     the same `it()` and appears in no red, exactly as recorded;
  4. `map-dogfood-render.test.tsx:221` `committed graph · 94 files` →
     **95**.
  Every other dogfood assertion passes against the regenerated graph
  untouched — no finding added, removed or renumbered, no new component
  pair, `derived.issues` still `[]`. **The three-fixtures rule does not
  fire in its registry form**: no component is declared and no registry
  file changes, and `lib/parser/test/smoke.test.ts` is confirmed unmoved
  by a **0-byte** `git diff` over `lib/parser/`.

### Flags for the verifier

- **`snapshot` is OPTIONAL in the TS mirror, REQUIRED in Rust.** Rust
  always sends the key (`"snapshot": null` when there is no tree — pinned
  in the wire test so absence is never how the webview learns "no tree").
  The TS mirror declares it `snapshot?: … | null` deliberately, the T-018
  precedent for additive payload fields, and there is a second reason
  worth stating: `tools/e2e/fixtures/shell.ts` holds a hand-written COPY
  of `PickOutcomePayload` (T-041-s2's finding), and a required field
  there would have forced me to edit T-045's lane. A test pins that an
  older payload with no `snapshot` key at all reads as "no tree".
- **The double collect is deliberate and is `open_as_project`'s own
  rule.** If you think the arm-time collection should be reused, read the
  comment at the `build_snapshot` call: reusing it would let a file
  written between arm and commit be permanently suppressed.
- **What criterion 2 does NOT claim.** A replacement is not a transition,
  by design. A `docs/` swapped for a symlink still reads as "gone"
  (ADR-010 posture unchanged) and therefore now emits — correct, and
  worth an adversarial probe.
- **Attack surface worth probing:** a genesis switch onto a folder whose
  docs/ is deleted between the ack and `build_snapshot` (answers an empty
  snapshot — honest "what is there now"); a docs/ that appears between
  the pick's probe and `arm_genesis`'s check (arms, so a tree rides, and
  the probe in the outcome is then one moment stale — the probe describes
  the folder at decision time, the snapshot describes it at commit time);
  a genesis switch racing a `docs-changed` emit at an adjacent seq;
  repeated arm/disarm storms inside one debounce window.
- **Not covered by a test, stated rather than hidden:** the
  armed→unarmed transition produced by a FAILED re-arm after a
  replacement. I found no deterministic way to make notify's `watch()`
  fail on a plain existing directory (the same gap T-026 recorded for
  `arm_genesis`'s sentinel-restore path), so that limb is reviewed by
  reading. It cannot loop: the next batch is unarmed→unarmed.

### Suggestions filed

- `T-042-s1-the-lane-never-sees-the-carried-tree.md` — the real-input
  lane's genesis specs drive only the snapshot-less shape, and its
  hand-mirrored payload type has no `snapshot` field, so the whole of
  criterion 1 is invisible to the one lane that uses a real browser.
- `T-042-s2-the-probe-and-the-snapshot-describe-different-moments.md` —
  `Genesis` now carries a `probe` measured before the arm and a
  `snapshot` collected after the commit; nothing says which one wins if
  they disagree.

## Verdicts
