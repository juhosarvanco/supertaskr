---
id: T-018-s2
title: The picker-rearm test races its own sequence counter on a Linux runner — one sighting, on a docs-only diff, in the suite that owns the watcher
feature: F-02
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
suggested_by: integrator nputer-4e @loop-sitting stamps push, CI run 33304351040 (2026-08-30)
touches: [app/src-tauri/src/docs_watch.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

`docs_watch::tests::picker_rearms_the_watcher_onto_the_new_root`
panicked on ubuntu-24.04 at `assertion failed: from_b.seq > picked.seq`
— the event sequence observed AFTER re-arming onto root B did not
exceed the `picked` event's sequence. The diff that triggered the run
(`1bcdb4c`) is four docs/tasks files: dispatch stamps and a preflight
ruling paragraph. Nothing in it touches the watcher, the runner, or
any Rust — the red is the TEST's own timing on that runner, the
inotify-cadence family T-153 documented (coalescing windows, fs-event
arrival order), one suite over. 199 of 200 lib bodies passed in the
same run; the rerun-as-measurement verdict is stamped beside this
sighting in the loop-sitting record's addendum.

One sighting. The ask, when promoted: read the assertion's two
sequence reads against the coalescing window's guarantees — whether
`picked.seq` can legitimately tie or lead when the pick lands inside
an in-flight debounce — and either derive the ordering the watcher
actually promises (and pin THAT) or make the test wait for the
convergence the CONVERGED state names. Joins `T-161` (stderr-drain)
on the push watch-list until then: two named intermittents, both
observation-side, neither a product defect on any evidence so far.

**PARKED at standing triage sitting #2 (2026-08-30, architect).** One sighting is a sighting, not a defect, and the loop-sitting record's own rerun-as-measurement verdict already stands beside it. Promoting it now would buy a lane to reason about a timing window from a single observation, which is the shape this project's own hazard list calls out: run the body alone before attributing anything to a diff.

**RESURFACES on either of two events, whichever comes first, and both are checkable by whoever meets them:**

1. **A SECOND sighting of `picker_rearms_the_watcher_onto_the_new_root` failing on `from_b.seq > picked.seq` in any run.** Two sightings make it a class; the seat that sees the second appends its run id here as a dated corroboration and unparks. Derive the history with `gh run list` against the runs since this park's date — this card does not carry a count, because a count here goes stale by the hour.
2. **`app-shell` is next dispatched.** That lane holds the watcher and its suite, so the ordering question — whether `picked.seq` may legitimately tie or lead when the pick lands inside an in-flight debounce — is one it can answer at no extra cost. The lane re-derives rather than trusting this body.

Joins `T-161` on the push watch-list until then: named intermittents, observation-side, no product defect on any evidence so far.

SECOND SIGHTING (2026-08-30, CI run on 2e4b76f — a docs-only diff again): same assertion, `from_b.seq > picked.seq`, same body. THE RESURFACING CONDITION IS MET. Promoted at this sighting: feature F-02, milestone 4, priority 5, size S, touches [app-shell] — the ask stands as filed (derive the ordering the watcher actually promises and pin THAT, or wait for the CONVERGED state). Two sightings, both on diffs that cannot touch the watcher; rerun-as-measurement pending on the second.

THIRD SIGHTING (2026-09-02, CI run 33566291111 on 4018a7b — a docs-only diff for the third time: three cards and a room): same body, same assertion `from_b.seq > picked.seq` at src/docs_watch.rs:2622, ubuntu-24.04, cargo suite 267 passed / 1 failed. Local battery at the same ref: rust 631 bodies GREEN. Re-run once as the measurement (attempt 2 of that run); whatever it reads, the class has three sightings on three diffs that cannot reach the watcher.

## TRIAGE, 2026-09-02 — PROMOTED, AND THIS TIME THE STAMP MOVED

The 2026-08-30 note above declared the promotion in prose and never
moved the frontmatter: the card sat at `status: parked` with no
placement fields through a second and now a third sighting — a
half-applied stamp, T-235's shape from the other side (a note without
its fields). Applied at the seat now: F-02, milestone 4, **priority 2
rather than the 5 the note named**, because each sighting reds main on a
push that cannot have caused it and costs a re-run and a seat's
attribution; size S; fence narrowed by path to the file that holds the
body, `app/src-tauri/src/docs_watch.rs`; `review: independent` because
the fix is to an assertion that must be shown able to fail on Linux
without being able to fail by clock — the ceremony row is "S touching
shipped code" either way. The ask stands as filed: derive the ordering
the watcher actually promises between the `picked` reply and the first
post-re-arm emit, pin THAT, and show the pin red under the mutant that
makes the tie legal.

## Implementation notes

**2026-09-02, executor claude-opus-5@subagent, lane
`task/T-018-s2-picker-rearm-ordering` in `/Users/ujju/Projects/nputer-T-018-s2`,
base `69a8477cc9c6a5aba2422cb49b812fe7e8bfbfd9`.** Every figure below
carries the ref it was measured at; live-environment facts carry the
time and host.

### What the watcher actually promises, derived

`WatchState::next_seq` draws from ONE shared `AtomicU64`
(`fetch_add(1, SeqCst) + 1`) and its own doc says the draw happens
BEFORE the files are collected, on every path — `open_as_project` draws
after the `Rearm` ack and the commit, `handle_fs_batch` draws before its
`collect_docs_tree`. **So a stamp dates the START of a collection and
never its content.** A batch that drew a lower stamp can still be
collecting when a later write lands, and it then ships the newer bytes
under the older stamp.

**AND THE MODULE ALREADY BLESSES THE OVERTAKE BY NAME.**
`the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`
pins arm-before-commit as DESIGNED, precisely because an emit for the
new root may reach the webview ahead of the invoke reply, and
`genesisSwitchIsOvertaken` in `app/src/lib/watcher-store.ts` is the
frontend guard that exists for it. So *"every post-re-arm emit outranks
the pick's reply"* is **not** a property of this watcher, and the old
flat `assert!(from_b.seq > picked.seq)` contradicted that body. **This
lane did not make the overtake illegal; it stopped asserting that it
cannot happen.**

What the code DOES promise, and what is now pinned: **an emit whose
batch BEGAN after the pick drew its stamp outranks it.** The
happens-before edge is the one the module has — `spawn_watcher_thread`
hands the debouncer a CLONE of the control sender
(`let fs_tx = tx.clone();`), so fs batches and control messages share
ONE `mpsc` queue that `run_watcher`'s loop drains strictly in order.

### What was written, and where

One file, inside the fence: `app/src-tauri/src/docs_watch.rs`.

1. **`picker_rearms_the_watcher_onto_the_new_root`** — a `barrier(&state)`
   (the `WatchCtl::Ping` rendezvous `live_state` already uses for the
   startup arm) between the successful pick of B and the write of
   `beta v2`, with the derivation above written above it, and the
   assertion given a message that prints both stamps. **THE CHAIN:**
   `picked.seq` is drawn before the barrier sends its Ping; the loop
   answers the Ping only after every message queued ahead of it, so each
   such batch has FINISHED its collect before the ack — therefore before
   `beta v2` exists on disk, so none of them can carry it — and every
   batch queued after the Ping draws its stamp after the Ping was
   handled, hence after `picked.seq`. Both arms hold, so the emit the
   wait converges on always outranks the reply. **No sleep, no retry, no
   widened window**: `barrier`'s two exits are the ack arriving and the
   watcher being gone, both events of the system under test.
2. **`rearm_baseline_makes_the_first_post_pick_change_emit`** — a comment
   only, recording the sweep at the site.

### The sweep of the class

**CLASS: an `emit.seq > <a stamp drawn on the command thread>` assertion
in this file.** `command grep -nE '\.seq *[<>=!]|seq *[<>] '
app/src-tauri/src/docs_watch.rs` at `69a8477` returns **4** members and
the sweep's honest answer is **one at risk**:

- `assert!(from_b.seq > picked.seq)` — **AT RISK, and the subject of
  this card.** It is the only member that crosses a re-arm from a
  PREVIOUSLY ARMED watch, so a batch can already be in the loop when the
  pick draws.
- `assert!(picked.seq > still_a.seq)`, same body — **not at risk.**
  `still_a` is fully received before `apply_pick` is called, so the two
  draws are ordered by this thread's own program order.
- `assert!(emit.seq > picked.seq)` in
  `rearm_baseline_makes_the_first_post_pick_change_emit` — **not at
  risk.** `live_state(None)` arms nothing, so no fs event can exist
  until the pick itself arms one; every batch is drawn after
  `picked.seq` by construction. Commented at the site, because arming
  that body over an already-watched tree would owe the rendezvous too.
- `assert!(emit.seq > seq, "and ordered after the switch")` in
  `a_genesis_switch_onto_a_folder_whose_docs_holds_files_carries_that_tree`
  — **not at risk**, same reason (`live_state(None)`), and it is
  additionally separated from its write by a `settle()` and a 1200 ms
  `recv_timeout` that asserts quiescence.

### Every command, in order, with its exit read unpiped

| # | command (cwd) | exit | what it said |
|---|---|---|---|
| 1 | `cargo test picker_rearms_the_watcher_onto_the_new_root` (app/src-tauri), at base `69a8477` | **0** | 1 passed, 269 filtered out |
| 2 | `gh run view 33566291111 --log-failed` | 0 | **EMPTY** — the run was re-run green |
| 3 | `gh run view 33566291111 --attempt 1 --log-failed` | 0 | 314 lines; the panic and its stdout |
| 4 | `cargo test picker_rearms_…` after the edit | **0** | 1 passed, 269 filtered out |
| 5 | `git commit` (the fix) | 0 | `3858ddcbfc2f19b7f3bfc7005aad02dae48a96d0` |
| 6 | `git worktree add --detach /private/tmp/nd-T-018-s2 3858ddc` | 0 | drill tree cut at this lane's own commit |
| 7 | DRILL D1 + `cargo test --lib` (drill tree) | **101** | 267 passed, **3 failed** |
| 8 | DRILL D2 + `cargo test --lib` (drill tree) | **101** | 268 passed, **2 failed** |
| 9 | DRILL D3 + `cargo test --lib` (drill tree) | **101** | 267 passed, **3 failed** |
| 10 | `cargo test … --nocapture \| grep -c docs-changed` x3 (drill tree) | 0 | **4, 4, 4** |
| 11 | `git worktree remove --force` | 0 | drill tree gone |
| 12 | `npm ci` (app) | 0 | 0 vulnerabilities |
| 13 | `npm run build` (app) | 0 | built in 874 ms |
| 14 | `npm ci` (tools/e2e) | 0 | 0 vulnerabilities |
| 15 | `lsof -nP -iTCP:{1420,15018,16018} -sTCP:LISTEN` | 1 each | no rows: nothing listening |
| 16 | `node tools/e2e/scripts/gate-run.mjs parser` | **0** | `bodies=349 targets=1 verdict=GREEN` |
| 17 | `… gate-run.mjs app` | **0** | `bodies=1131 targets=1 verdict=GREEN` |
| 18 | `… gate-run.mjs rust` | **0** | `bodies=634 targets=18 verdict=GREEN` |
| 19 | `NPUTER_E2E_PORT=15018 … gate-run.mjs e2e` | **0** | `bodies=548 targets=1 verdict=GREEN` |
| 20 | `cargo test picker_rearms_…` after the comment amendment | **0** | 1 passed, 269 filtered out |
| 21 | `git commit` (the amendment) | 0 | `41525d262fbb2d29c0c39b3fc262e7ce50c7f06c` |
| 22 | `cargo run -p nputer-index -- index --check --root ../..` | **1** | **STALE**, `files +0 -0 ~1` — see GRAPH REGEN below |
| 23 | `NPUTER_BOOT_PORT=16018 npm run boot:check` (tools/e2e) | **0** | both `[nputer]` lines — see BOOT GATE below |
| 24 | `git merge-tree --write-tree main HEAD` | **0** | tree `93a6feb`; forecast **1** path |

Rows 16-19 were measured at `3858ddc`; the only tracked change between
that ref and row 24's is a COMMENT block in the same Rust file plus this
card. **A LOCAL BATTERY AND CI ARE DIFFERENT MEASUREMENTS** — this lane
asserts nothing about CI, and the whole point of the card is that this
darwin host does not reproduce the runner's behaviour (row 10).

### The drills — one side only, read back with `git diff`, restored by hash

All three ran in a DETACHED worktree at this lane's own commit
`3858ddc`, `/private/tmp/nd-T-018-s2`, with
`CARGO_TARGET_DIR=/private/tmp/nd-T-018-s2/target` — inside itself, at
the one name `.gitignore` covers (`git check-ignore -v target/x` →
`.gitignore:4:target/`). The subject of every restoration proof is
`app/src-tauri/src/docs_watch.rs`;
`git show 3858ddc:app/src-tauri/src/docs_watch.rs | shasum -a 256` is
**`8ee8a77950209348115676635e89d37a5fea988377c456f6d85e0980b05a44f6`**,
and after each restore
(`git restore --source=3858ddc --staged --worktree -- <path>`) the
worktree file hashed to that same value with an empty per-path diff
beside it.

**D1 — THE TIE MADE LEGAL (the mutant this card asked for).** In
`handle_fs_batch`, `let seq = next_seq(seq);` → `let seq =
seq.load(Ordering::SeqCst);`: the emit reuses the last-issued stamp
instead of drawing a new one. **RED, exit 101**, and the message is a
literal tie — *"from_b.seq=2 must exceed picked.seq=2"*. **Kill set (3):**
`picker_rearms_the_watcher_onto_the_new_root`,
`rearm_baseline_makes_the_first_post_pick_change_emit`,
`a_genesis_switch_onto_a_folder_whose_docs_holds_files_carries_that_tree`
— exactly the three members the sweep enumerates, killed as a class.

**D2 — THE LEAD MADE LEGAL (the pick's stamp decoupled from the shared
counter's ordering).** In `open_as_project`,
`build_snapshot(&canon, seq)` → `build_snapshot(&canon, seq + 1000)`.
**RED, exit 101** — *"from_b.seq=5 must exceed picked.seq=1004"*.
**Kill set (2):** the same body and
`rearm_baseline_makes_the_first_post_pick_change_emit`.

**D3 — THE CONTAINMENT SEPARATOR, because D1 and D2 both kill a
sibling.** `method/roles/verifier.md` step 2b judges containment, not
count, so a mutant this body kills and the sibling does not is what
refutes *"this is a restatement of `rearm_baseline_…`"*. In
`open_as_project`'s no-docs early return, the refused pick also commits
the project dir — the failed-pick criterion this body uniquely
exercises. **RED, exit 101. Kill set (3):**
`picker_rearms_the_watcher_onto_the_new_root`,
`picking_a_folder_without_docs_is_no_docs_and_mutates_nothing`,
`picking_a_root_whose_docs_is_a_symlink_is_refused` — **and NOT
`rearm_baseline_…`.** So neither kill set contains the other in that
direction, measured. **THE OTHER DIRECTION IS ARGUED, NOT MEASURED, AND
IS DISCLOSED AS SUCH:** `rearm_baseline_…` writes a SECOND file into
the picked tree and pins the collected count at 2, which this body never
does, so a mutant confined to "a newly created file joins the collected
tree" would kill it and not this one — no such mutant was run.

### The reproduction that was attempted and did NOT land, and why that is the finding

**A local repetition proof is worth nothing here and was not relied on**
(the unfixed body is green on this host by the dozens). What was
attempted instead was a production-side stall to force the race locally;
row 10 is why it was abandoned rather than tuned. **This host emits
exactly ONE debounced batch per `fs::write`** — 4 `docs-changed` lines
for the body's 4 writes, three runs running, at `3858ddc` on
Mac.lan/darwin — so there is never a residual batch in the loop when the
pick draws, and the race has no window to open. **The ubuntu-24.04
runner splits one write into MORE than one batch**: in run
`33566291111` attempt 1 the single `alpha v2` write produced
`docs-changed: seq=2` and `seq=3` **one millisecond apart**. That
asymmetry — inotify splitting where FSEvents coalesces — is the whole
account of why three sightings are Linux-only and why no amount of
local re-running would have found it. Widening a timing window to
reproduce it locally would have been the exact defect this card
forbids, so it was not done.

### Standing gates, derived on the merge forecast

`TREE=$(git merge-tree --write-tree main HEAD)` exits **0** (read first)
and `git diff --name-only main "$TREE"` returns **1** path at
`41525d2`: `app/src-tauri/src/docs_watch.rs`. The tip this lane will
hand over adds this card, so the integrator's own derivation will
return **2**.

- **GRAPH REGEN — FIRES** (`*.rs` outside docs/). **ASKED, not
  predicted:** `index --check` exits **1**, STALE, and it is a REAL red
  and not the `committed: MISSING` false one — both sides print
  identical totals (1168002 bytes · 200 files · 2501 symbols · 2388
  edges) and the file diff is `files +0 -0 ~1`,
  `~ app/src-tauri/src/docs_watch.rs (content, loc 4662 -> 4738)`.
  Budget 54.4%, 977957 bytes left. **THE REGENERATION IS THE
  INTEGRATOR'S, IN THE CHECKPOINT** — `docs/architecture/graph.json` is
  outside this fence and a lane that re-pinned it would be asserting a
  total for a tree that does not exist yet.
- **BOOT GATE — FIRES** (`app/src-tauri/**`). Run on a derived scratch
  port, `NPUTER_BOOT_PORT=16018`, **exit 0**, both startup lines:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-018-s2` and
  `[nputer] window "main" created`. 1420 was read once with the one
  permitted command and holds nothing (Mac.lan, this sitting).
- **DOCS GATE — FIRES at the tip this lane hands over**, on this card's
  own path under `docs/tasks/`; not owed on the code commit alone. The
  gate's verdict is recorded in the executor's report, since the
  triggering commit is the one carrying these notes.
- **METHOD EVAL GATE — NOT OWED.** No `method/**` path in the forecast.
- **CENSUS CURRENCY — NOT OWED.** `docs/CAPABILITIES.md` is generated
  from the e2e spec names in `tools/e2e/tests/`; this diff adds, renames
  and removes no test body there. The one body it touches is a Rust unit
  test, which that census never reads.

### For the verifier

- The pin is **narrower** than what it replaced, deliberately. The
  question to attack is whether the happens-before chain above is
  complete — in particular whether `WatchCtl::Ping` and `WatchCtl::Fs`
  really share one queue (`spawn_watcher_thread`'s `tx.clone()`), since
  everything rests on that one edge.
- `arch_cmd.rs` carries a pre-existing `unused import: Path` warning.
  Measured at the **base** `69a8477` before this lane wrote anything —
  inherited, out of fence, not this diff's.

### Routed, not built

**`T-018-s5`** — the ordinary pick's reply overwrites an emit that
overtook it. `reducePickOutcome`'s `"genesis"` branch consults
`genesisSwitchIsOvertaken`; its `"picked"` branch consults nothing and
calls `reduceDocs` unconditionally, and `reduceDocs` applies any payload
whose `seq` exceeds the watermark — so a lower-seq emit carrying NEWER
bytes is overwritten by the reply's higher-seq OLDER snapshot, which
then advances the watermark past it. Found by taking this card's own
question seriously rather than by looking for it: once the overtake is
admitted to be legal on the ordinary path, the missing guard is the next
sentence. **Out of this fence** (`app/src/lib/watcher-store.ts` and
`app/test/watcher-store.test.ts`), so it is a card and not a commit.

### Where the brief was wrong

1. **Row 4's `base commit: 4a9c68cc9c13…` is wrong**, as the dispatch
   message itself warned (T-233's known defect). This lane's HEAD at
   dispatch was `69a8477cc9c6a5aba2422cb49b812fe7e8bfbfd9`, which is the
   commit that stamped this card `status: building`, and that is what
   every figure above is measured against.
2. **Row 4's `integration tip right now: 69a8477…` was already stale
   when read and moved twice during this lane.** `main` resolved to
   `bfc879c` early in the sitting and to
   `d272558331a826ae6a82a4ff91d6d82ea6f6fe1c` at the forecast. A tip is
   a live fact; the forecast above is stated against the second reading
   and the integrator must re-derive at its own.
3. **The dispatch message's `gh run view 33566291111 --log-failed`
   returns EMPTY.** Every one of the three sightings was re-run green,
   which discards the failed attempt's logs; `--attempt 1` is the
   spelling that answers.
4. **Nothing else in the brief was contradicted by the repository.** The
   fence, the ceremony row (S touching shipped code → a verifier is
   owed, so `verifying` and not `done`), the ports, the scratch naming
   and the setup order all held as written.
