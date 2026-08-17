---
id: T-042
title: Genesis switch truthfulness — the snapshot, the transitions, the echo, the change log
feature: F-03
milestone: 3
priority: 5
size: M
status: done
blocked_by: []
touches: [app-shell, app-interview]
builder: claude-opus-5
verifier: claude-opus-5
built_by: "claude-opus-5 @fresh"
verified_by: "claude-opus-5 @fresh"
review: same-model
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

2026-08-17 — claude-opus-5 @fresh, verifier — same-model review (the
builder was claude-opus-5 too; recorded so this is not read as an
independent-model check): **APPROVED**, with four CORRECTIONS to the
notes recorded below and one suggestion filed (s3). Every criterion was
re-derived on the branch — the ordering argument re-constructed rather
than read, both mutation directions re-run, the graph regenerated. The
numbers below are mine.

**Merge base re-derived, not accepted.** `git merge-base HEAD main` =
`8dadb59` — matching the notes. Main has since taken T-030 at `59558de`;
its changed set is `lib/parser/` + `docs/tasks/T-030*` and this branch's
nine files touch neither, so the overlap is empty.

**Suites (macOS 15/Darwin 25.6, from the branch worktree, ADR-011
order).** lib/parser `npx vitest run` **159/159 (10 files)**,
`npx tsc --noEmit` clean, and the diff to `lib/parser/` is **0 bytes**.
app: `npm run build` exit 0 then `npx vitest run` **546/546 (33 files)**
— the build first is genuinely required, and the emitted assets match
the notes exactly (`index-RXeeD2qB.css` **41.30 kB**, unchanged from
T-049/T-050; only `index-qJOlkERM.js` **445.29 kB** moved). src-tauri
bare `cargo test` **220 passed + 3 ignored, 0 failed — three consecutive
full runs, identical counts**; `cargo clean -p nputer && cargo build`
→ **zero warnings**, exit 0 (and a from-scratch build in a clean
`CARGO_TARGET_DIR` also emitted zero). tools/e2e **40/40 in 7.9 s** on
my own scratch port **14542** (1420 was OBSERVED with `lsof` only —
node pid 64249 — never bound, contacted or signalled; 14520 left to
T-045); `npm run typecheck` clean; `lint:tokens` **clean, 38 files**.
No `fake_agent` or `tauri-boot-check` process afterwards; 14542
released.

**THE BOOT CHECK WAS NOT RUN.** The trigger is present — the diff
touches `app/src-tauri/**` and `app/src/**` — and the dispatch fences
1420 and this session is headless. The builder declined correctly and
said so loudly; I decline for the same reason. **The merge owes it.**
Exit code: not obtained.

**C1 — the snapshot, and the ORDERING, re-constructed rather than
read.** I built the race in an isolated copy of the worktree (a
`#[cfg(test)]` hook that writes a file into each ordering's own window
between the two tree reads) and measured both:

&nbsp;&nbsp;&nbsp;&nbsp;A collect AFTER the ack (production)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ snapshot `["docs/ARCHITECTURE.md","docs/GAP.md"]` — the gap file rides
&nbsp;&nbsp;&nbsp;&nbsp;B collect BEFORE the arm
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ snapshot `["docs/ARCHITECTURE.md"]`, file on disk, and
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**no emit at all** in a 1.5 s window after `settle()`

**Ordering B loses it**, and the mechanism is the one
`open_as_project`'s own comment states verbatim ("the snapshot is never
older than the baseline — post-pick changes always diff"): `rearm` sets
`target.last` to the tree it saw, so anything written before that
baseline but after an earlier snapshot read is in the baseline, absent
from the snapshot, and its batch collects EQUAL and suppresses. The
double collect is therefore load-bearing, and the ordering the builder
chose is the one that survives. Reusing the arm-time collection loses
the same file by the other route: its tree would ride at the switch's
seq, which is HIGHER than the overtaken emit's, so it clobbers it.

T-026's verifier's own repro reproduced BOTH WAYS on the real folder
(`docs/ARCHITECTURE.md` + `docs/decisions/001-x.md`):

&nbsp;&nbsp;&nbsp;&nbsp;before &nbsp;`Genesis(probe.architecture=true, has_plan=false)`, snapshot=**NONE**,
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;no emit in a 1.2 s window, later edit emits **2 files** at seq 2 > 1
&nbsp;&nbsp;&nbsp;&nbsp;after &nbsp;&nbsp;same outcome, snapshot=**SOME** `["docs/ARCHITECTURE.md","docs/decisions/001-x.md"]`,
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`snapshot.seq == outcome.seq` (**1 == 1**), `generated_at_ms > 0`,
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;and the 1.2 s quiet window and the 2-file edit BOTH still hold

So the watch really was armed throughout and nothing was loosened to
buy the fix. MUTATION DRILL re-derived: substituting
`let snapshot: Option<DocsSnapshot> = None;` → **106 passed; 2 FAILED**,
at `docs_watch.rs:2920` *"THE FIX: the tree rides the switch"* and
`:2879` *"an armed docs/ carries its tree, empty or not"* — the exact
lines and messages the notes claim.

**C2 — one rule, both directions, and ten attacks.** The five-step
sequence reproduces with the exact counts (appear 1 / quiet 0 / DELETE
1 / five further batches 0 / recreate 1 / quiet 0). I then attacked the
boundary with my own sequence through the same seam, counting every
emit — looking for a double emit or a silent transition:

&nbsp;&nbsp;&nbsp;&nbsp;plain docs/ appears &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-> 1, then 0 &nbsp;(armed)
&nbsp;&nbsp;&nbsp;&nbsp;docs/ REPLACED BY A SYMLINK &nbsp;-> 1, then 0 &nbsp;(refused, reads as gone)
&nbsp;&nbsp;&nbsp;&nbsp;symlink -> plain dir &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-> 1, then 0
&nbsp;&nbsp;&nbsp;&nbsp;docs/ REPLACED BY A FILE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-> 1, then 0
&nbsp;&nbsp;&nbsp;&nbsp;file -> dir WITH content &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-> 1, then 0 &nbsp;(transition AND content: still one)
&nbsp;&nbsp;&nbsp;&nbsp;chmod 000 on an armed docs/ &nbsp;-> 1, then 0 &nbsp;(no transition; the tree emptied)
&nbsp;&nbsp;&nbsp;&nbsp;chmod back to 755 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-> 1, then 0
&nbsp;&nbsp;&nbsp;&nbsp;create/delete/create in ONE batch -> 1, then 0
&nbsp;&nbsp;&nbsp;&nbsp;create/delete NETTING TO NOTHING &nbsp;-> **0** (nothing net changed)
&nbsp;&nbsp;&nbsp;&nbsp;swap-in, IDENTICAL bytes, new inode -> **0** (a replacement is not a transition)

Nothing double-emits, and nothing that should be news is silent. The
symlink and regular-file cases are the ADR-010 posture the notes flag:
the app refuses to follow them, so from its view docs/ is gone, and it
now says so — correct, and new. MUTATION DRILL, narrowing side:
`!was_armed && target.docs.is_some()` reds **exactly one** test,
`a_deleted_empty_docs_emits_on_the_armed_to_unarmed_transition` at
`docs_watch.rs:2582`, *left: 0, right: 1*.

**The suppression invariant, counted independently.** Driving the seam
myself rather than trusting the committed test: 20 batches over an
unchanged tree → **0**; three content changes each followed by five
quiet batches → **exactly 1 per change, 3 total** (asserted after each);
a wholesale replacement carrying IDENTICAL bytes on a provably different
inode → still **3**. OVER-WIDENING DRILL: forcing the return to `true`
reds **5 tests** — `the_suppression_invariant_stays_exactly_as_narrow_as_it_was`,
`an_empty_docs_dir_emits_exactly_once_on_the_unarmed_to_armed_transition`,
`a_deleted_empty_docs_emits_on_the_armed_to_unarmed_transition`, and
BOTH of T-018's additive-only pins
(`a_dead_sentinel_leaves_the_existing_watch_fully_working`,
`a_vanished_root_never_panics_the_batch_handler`). Fenced from both
sides, exactly as claimed.

**C3 — provenance, not seq.** Both directions verified off the
`model-updated` channel captured where Rust would receive it, through
the real App by real clicks: snapshot-less switch → `[]`; docs-bearing
switch → exactly 1 echo at `seq: 7`, `generatedAtMs: 1700000000007`;
ordinary `picked` → still echoes (`seq: 4, taskCount: 1`); `cancelled` /
`busy` / `noDocs` / `error` → nothing, all four. THE TELL, REPRODUCED:
restoring `next.docs.seq > before.docs.seq` reds **exactly one** case
and the received payload is T-026-s6's, field for field —
`{"seq":7,"generatedAtMs":0,"taskCount":0,"featureCount":0,"issueCount":0,"taskIds":[],"parseFailures":[],"skippedTotal":0,"truncated":false}`
(plus an `appliedAtMs` wall stamp s6 did not record). Reverted;
`git diff --quiet` clean. **The third comment is confirmed**: the card
named two, and `reducePickOutcome`'s genesis-case comment ("No snapshot
rides a genesis switch (there is nothing there yet)") was a third,
false for exactly the docs-bearing shape and absent from s6. All three
now describe what the code does, and the note that the guard moved to
`commitPickOutcome` at T-041 is correct.

**C4 — ratified, and nothing moved, proven not asserted.**
`ShellState` **1424 bytes** and `ShellHarnessSnapshot` **612 bytes**
extracted from both revisions and `diff`ed → **ZERO DIFF** (2036 bytes
combined, matching the notes); `DocsModelState` **2455 bytes** → **ZERO
DIFF**; `app/src/lib/docs-model.ts` and
`app/src/genesis/genesis-derive.ts` are **0-byte diffs**; both store
modules contain **0** occurrences of `ChangeLog`, `observeDocsChange`
and `changedAtMs`. The three identity pins pass BY NAME (my first `-t`
run missed the third only because `(no false pulse wall)` is read as a
regex — escaped, it passes), and `genesis-derive.test.ts` is 24/24. The
three stated conditions hold of the code they describe:
GUARDED — `genesis-derive.ts:206-208`, two `return prev` covering the
empty, already-observed and stale cases (the project-switch branch
returns a new object, but it is a baseline that records and stamps
nothing, so a doubled render produces a deep-equal log);
BOUNDED — `log.changedAtMs` is read at exactly ONE place,
`writingSince` (`:347`), which feeds only `isWriting` and the transition
horizon, both inside `WRITING_WINDOW_MS`;
DERIVED FROM PROPS — `docs` is the prop and the only state input; the
one non-prop read is `clock()`, which is injectable and which the
wording ("no I/O, no subscription, no second source of truth") covers
in substance. The CONVENTIONS gotcha lands in § Gotchas in the
established shape and says the same three things.

**C5 — changed, never loosened.** 217→220 cargo and 535→546 app with
every pre-existing assertion intact; the three strengthened ones are
additions inside existing bodies. Both mutation directions above are
what proves it rather than the counts.

**Fence.** `git diff 8dadb59..HEAD --name-only` is **exactly nine
files** — six code/docs plus the card and two suggestions. ZERO bytes
under every sibling lane and fenced surface, checked as one command:
`crates/`, `app/src-tauri/crates/` (T-014), `lib/parser/` (T-030),
`tools/e2e/` and `.github/` (T-045), `app/src/architecture/` (T-034),
`App.tsx`, `components/`, `lib.rs`, `acl_pin.rs`, `capabilities/`,
`tauri.conf.json`, `Cargo.toml`, `docs/architecture/`, `method/`,
`app/src/styles/`, `index.css`, `docs-model.ts`, `genesis-derive.ts`,
and **every lockfile and manifest**. The whole diff over
`app/src-tauri/src` and `app/src` adds or removes **zero**
`#[tauri::command]`, `invoke_handler`, `invoke(`, `listen(` or `emit(`
call sites (the single grep hit is a test-local `let emit`).

**ACL — re-derived independently, not accepted.** `gen/schemas` is
gitignored, so I rsynced the worktree to a scratch copy and built BOTH
ENDS there with separate `CARGO_TARGET_DIR`s — HEAD, then again with
`8dadb59`'s `docs_watch.rs` swapped in — `rm -rf gen/schemas` before
each. `diff -r` across the two regenerations: **ZERO DIFF, all four
artifacts byte-identical**, at the same three sha256 the notes and
T-026's verifier record: `capabilities.json`
`4fca70b5437f720b9a72c727c0663349aa9e8b31917dcc0a870012de02406b07`
(146 B), `acl-manifests.json`
`d3eace193b1e453756736eaf27bb156df62c7a41b2fe101403ee92ef93e69699`
(68210 B), `desktop-schema.json` = `macOS-schema.json`
`2a16f62c90a059a1b67e4501216bb3476f402087e99ba659dd38c9d0521f3b07`
(120083 B). `acl_pin.rs` is a **0-byte diff**, which subsumes the grant
claim entirely; all 6 acl_pin tests pass on every run.

**Execution sweep.** `panic!("VERIFIER-CANARY")` into all **3** new
cargo test bodies → **3 failed**, canary in the output;
`throw new Error("VERIFIER-CANARY")` into all **11** new frontend
`it()`s (7 in `genesis-switch-truth.test.tsx`, 4 in
`watcher-store.test.ts`) → **11 failed / 28 passed (39)**. **14
poisoned bodies, 14 red.** Every revert verified with
`git diff --quiet`. No `.only`, `.skip` or `.todo` in the diff.

**Graph forecast — regenerated and CONFIRMED, including the hidden
row.** `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
self_graph -- --ignored`: files **94 → 95** (adds exactly
`app/test/genesis-switch-truth.test.tsx`, **nothing removed**), symbols
**667 → 686**, edges **1063 → 1075**. Running the dogfood suites
against it reds three assertions — `:608`, `:790` and
`map-dogfood-render.test.tsx:220` — and the fourth is the trap: I
patched ONLY the file count at `:607`/`:608` and re-ran, at which point
`:613` went red and the received value at `:639` was
`["C-05", 44]` → **45**, exactly as forecast and derived from the
added-file list rather than from a failure. A registry sweep confirms
`docs/architecture/components/C-05-app.md` (`- app/test/**`) is that
glob's only claimant. The relation row at `:815` is
`["C-05","C-10","confirmed",24]` → **25**. Across BOTH arrays those are
the **only two numbers that move** — no other row, no new component
pair, no renumbering. `docs/architecture/graph.json` restored to the
committed bytes (sha256
`a6ede920c34beb867c6e856fbcdf9099a458de766d22e6fa066220b68236933e`),
the patched fixture reverted, and both dogfood files green again
(17/17).

**The TS/Rust asymmetry — RULED SOUND, on one of its two reasons.**
Rust always sends the key: the wire test pins BOTH shapes, `"snapshot":
null` and a full object, so Rust's emitted set is {null, object} and TS
accepts {absent, null, object}. The one extra shape is the absent key,
it is defined to mean exactly what `null` means (`?? null` in both
`reducePickOutcome` and `outcomeCarriesSnapshot`), and it has its own
test. The looseness runs in the SAFE direction — TS accepting more than
Rust sends; the dangerous direction, Rust sending a shape TS rejects, is
impossible here. So: no shape TS accepts is one Rust can never send in a
way that can mislead, and the T-018 additive-payload precedent is
correctly applied. It DOES widen T-041-s2's mirror problem, and now
asymmetrically — the third copy is missing a field the other two have,
so the lane can no longer express the shape criterion 1 introduced.
Saying that plainly, as the dispatch asks: **the mirror problem is
widened again**, s1 names it, and the deeper fix stays T-041-s2's.

**CORRECTIONS to the notes** (none of them a criterion failure):

1. **`EXPECTED_GRANTS` is 6135 bytes / 92 grants, not 7728.** The
   notes carry T-026's figure ("7728 bytes, 129 grant lines") forward
   as if re-measured. The const spans `acl_pin.rs:54-147` at BOTH
   revisions and is byte-identical (sha256 `721174b1…f0c7`), so the
   load-bearing claim holds absolutely — `acl_pin.rs` is a 0-byte diff
   — but the number is inherited, not derived.
2. **"Suppressed forever" overstates it.** Measured, ordering B's lost
   file self-heals on the next UNRELATED content change: after the gap
   file was invisible for the whole 1.5 s window, writing
   `docs/OTHER.md` produced an emit carrying all three files. The loss
   is indefinite, not eternal — and T-007's own card already uses the
   accurate wording, "can be suppressed until the next change"
   (T-007:245-249). The ordering is still load-bearing; the pane still
   lies for as long as nothing else moves.
3. **The second reason for the optional TS field is false.** The notes
   say a required field "would have forced me to edit T-045's lane". It
   would not: `tools/e2e/fixtures/shell.ts` is a structural copy that
   imports only `DocsSnapshotPayload` from `./board` and never
   `PickOutcomePayload` from the app. Making the field required and
   running `tools/e2e`'s typecheck: **clean, exit 0**. The real cost is
   **5 sites in the app's OWN tests** (`shell-harness.test.ts` ×3,
   `watcher-store.test.ts` ×2). The FIRST reason — T-018's additive
   precedent, an older payload staying valid — is sound and sufficient
   on its own, and the ruling above rests on it.
4. **The canary count in the dispatch brief undercounts.** The notes'
   own 3 cargo + 11 vitest is right; 14 bodies were poisoned and 14 went
   red.

**Suggestions assessed.** **s1 — REAL, correctly scoped, not blocking.**
Every citation checks out: `shell.ts:51` declares the genesis variant
with no `snapshot`; the four `kind: "genesis"` literals are at
`genesis-screen.spec.ts:46, :71, :171, :276` and one at
`accelerators.spec.ts:135`; and `genesis-screen.spec.ts:165` really does
assert `not.toContainText("nothing written yet")` — passing today only
via the pre-T-042 `docs-changed` route, so the route criterion 1 added
has never been rendered by a real browser. Correctly deferred to T-045
or whoever next holds the lane, and correctly declining to re-file
T-041-s2. Its one imprecision is the same as correction 3: the field
was made optional to avoid an edit that was never required. **s2 —
REAL, and the right shape for a ruling rather than a patch.** Verified:
`probe_plan` runs before the rendezvous (`:798`), `build_snapshot` after
the commit (`:859`), `REARM_TIMEOUT` is 10 s, and option (c) is
factually available — the genesis case sets `resolvedProbe: null` and
never reads `outcome.probe`, so the field has no live consumer on that
path. Low urgency (ADR-017 keeps the app out of docs/), correctly
flagged as not a regression.

**NEW: s3 filed** — the tree the switch carries is dropped by its own
watermark when a `docs-changed` emit overtakes the switch. Measured
through the real reducers: in-order `switch@7` → fileCount 2; overtaken
by `emit@8` → the switch reduces to **fileCount 0** at seq 8, which is
the T-026-s4 symptom one layer down. NOT a regression (the branch point
produced the same empty model and additionally regressed the watermark)
and NOT a criterion-1 failure (the outcome demonstrably carries the
tree); filed because criterion 1 is what makes a fix cheap for the first
time. Explicitly not blocking T-027, whose turn-1 baseline is taken
before anything is writing.

**Nothing here makes T-027 unsafe to dispatch on this merge.** The case
it planned to tripwire — a genesis switch onto a non-empty docs/
carrying no tree — is removed by construction, verified on T-026's own
repro at the wire, at the reducer and on screen. The one residual (s3)
needs an emit to overtake the switch, which cannot happen at the moment
T-027's turn-1 baseline is taken. What the merge still owes is the boot
check, which no one has run.

All probes reverted; every revert proven with `git diff --quiet` or a
sha256, not by inspection. Mutation and race work was done in an
isolated rsync copy under the scratchpad so the worktree was never the
laboratory. Working tree clean apart from this verdict and s3.
