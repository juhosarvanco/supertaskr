---
id: T-018-s2
title: The picker-rearm test races its own sequence counter on a Linux runner — one sighting, on a docs-only diff, in the suite that owns the watcher
feature: F-02
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
suggested_by: integrator nputer-4e @loop-sitting stamps push, CI run 33304351040 (2026-08-30)
touches: [app/src-tauri/src/docs_watch.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### The battery re-run at the code-final tree

The table above records the battery at `3858ddc`, before the comment
amendment. **RE-RUN IN FULL at `5aadb2329fb38e8be4f953e67d21c4b7141e2ab8`**
— the commit immediately before this paragraph, and the last one
carrying any code — so the verdict tokens name the tree the merge takes.
All four GREEN, exits `0/0/0/0`, counts read rather than codes:
`parser bodies=349 targets=1` · `app bodies=1131 targets=1` ·
`rust bodies=634 targets=18` · `e2e bodies=548 targets=1`
(`NPUTER_E2E_PORT=15018`). Those three of the four are also the suites
the DOCS GATE named for this card's own path, so the gate is discharged
at the ref it was derived on. `npm run capabilities:check` exits **0**,
`CURRENT (45968 bytes)`.

**A COMMIT CANNOT MEASURE ITSELF**, so this paragraph's own commit is
docs/tasks-only and moves no suite input but the two card files the gate
already named. The integrator re-derives at its own ref.

## VERDICT — APPROVED at `4e85b4d`, 2026-09-02, blind verifier claude-opus-5@subagent

Bench `/Users/ujju/Projects/nputer-V-T-018-s2`, detached, cut at the
lane's BASE `69a8477` alongside the lane (orchestrator 5c). Phase 1 was
sealed before the diff was opened:

    attack-V-T-018-s2.md  32e90b59311aaf87085cbbca6fd4a6f8689fa1d51b414b8a6ad84020230ae822
    ground-V-T-018-s2.md  3dc1d2acc18f4824101834276862173c9cffa39668d22615de1171940c36d0c3
    sealed 2026-09-02T02:27Z, stamps rewritten 02:28Z (both hashes unchanged)

**MY BLINDNESS WAS DISCIPLINE-SHAPED, NOT CLOCK-SHAPED, AND THE BRIEF
SAID OTHERWISE.** The dispatch said the lane's work did not yet exist.
Inventorying my OWN scratch files at the seal, the shared scratchpad
listing showed eighteen carrying the LANE's suffix — `base-body`,
`after-body`, `drill-d1/d2/d3`, four gate logs, a fence, a preflight —
so work existed while I wrote. I opened none of them, did not open
`/Users/ujju/Projects/nputer-T-018-s2`, and did not fetch, list or read
the branch until phase 2. The listing alone told me a drill and a
battery had been run; it told me nothing about what the diff does, and
the attack set was already written when it printed. **A SECOND
DISCLOSURE, OWED BY THE SAME RULE:** the phase-2 dispatch relayed the
executor's own account — the chain, the three drill names with their
kill counts, the suite figures — so my phase-2 reading was NOT innocent
of the rationale. Phase 1 was, and every measurement below is my own.

### What the diff is

`git diff 69a8477 4e85b4d` — three paths, all in fence (`docs/tasks` is
`alwaysWritable`, pinned by `lane-fence.spec.ts`'s *"docs/tasks is
always writable, and the hook takes that set from the parser"*):
`app/src-tauri/src/docs_watch.rs` (+78 -2), this card, and `T-018-s5`.
**BOTH RUST HUNKS FALL INSIDE `mod tests`** — the diff changes no
production line, which retires my whole A7 arm (a production change
trading one hazard for another) by inspection rather than by argument.

### The pin, checked against the code rather than against the notes

The claim is narrower than what it replaced and the narrowing is right:
`next_seq` (`fetch_add(1, SeqCst) + 1`) promises UNIQUENESS and order of
DRAWS, and its own doc-comment says the draw precedes the collect on
every path — so a stamp dates the start of a collection, never its
content, and the arm-before-commit overtake pinned by
`the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`
is legal. I derived exactly that in phase 1, from the code, before the
diff existed, and my sealed ground truth names the same remedy the lane
took (`barrier`, placed after the pick's draw and before the write).

**THE ONE EDGE EVERYTHING RESTS ON, VERIFIED RATHER THAN ACCEPTED.**
`spawn_watcher_thread` does `let fs_tx = tx.clone();` — one `mpsc`
channel for fs batches and control messages — and `run_watcher`'s
`for msg in rx` drains it on one thread, synchronously. I also derived
that **`sink(&snapshot)` has exactly ONE call site**, inside
`handle_fs_batch`, so no second emitter can route around the queue. Both
arms then hold with no clock in either: a batch enqueued BEFORE the Ping
has finished its collect before the ack, hence before `beta v2` exists,
so it cannot carry those bytes; a batch enqueued AFTER the Ping draws
after the Ping was handled, hence after `picked.seq`. No interleaving of
the two threads violates it — a concurrent `send` either completes
before the Ping's or after it, and either case lands in one of the two
arms.

### The drill — six mutants, landings read from `git diff`, restores by hash

All run in this bench at `4e85b4d`, one side only, whole `cargo test
--lib` each. `git restore --source=4e85b4d --staged --worktree --
app/src-tauri/src/docs_watch.rs` after every one, and the worktree file
hashed back to
`4d2fb9f648f5fb39fc95f11610ca2ba0a4c86994a8f5eace091774a3de929df6`
**six times for six mutants**.

| mutant | landing | result | kill set |
|---|---|---|---|
| **M2** = the lane's D1 | `handle_fs_batch`: `next_seq(seq)` → `seq.load(SeqCst)` | **RED 101**, 267/3 | `picker_rearms` **at the CHANGED line 2681**, `rearm_baseline` 2730, `a_genesis_switch…` 4305 — and `seq_is_monotonic_from_one` **SURVIVES** |
| **M6** = the lane's D3 | `open_as_project`'s no-docs return also commits the dir | **RED 101**, 267/3 | `picker_rearms` 2603, `picking_a_folder_without_docs…` 2481, `picking_a_root_whose_docs_is_a_symlink…` 2499 — `rearm_baseline` **SURVIVES** |
| M1 | `next_seq`: `fetch_add(1)+1` → `load()+1` | RED 101, 266/4 | `picker_rearms` **at 2611**, `rearm_baseline` 2730, genesis 4305, `seq_is_monotonic` 2392 |
| M3 | `open_as_project`: the seq draw hoisted ABOVE the re-arm ack | **GREEN 0**, 270/0 | empty — a SURVIVOR, see note 2 |
| M4 | `rearm`: the emit-baseline reset deleted (3 sites) | RED 101, 267/3 | `a_dead_sentinel…`, `the_suppression_invariant…`, `index_cmd::reindex_is_snapshot_silent…` — `picker_rearms` survives |
| **M5** | the new `barrier(&state)` deleted | **GREEN, 30 runs of 30** | empty — **and that is the point**, see below |

**M2 IS THE MUTANT THE CARD ASKED FOR AND IT LANDS WHERE THE PROPERTY
LIVES.** It reds the changed assertion by name, printing the tie in its
own words: *"from_b.seq=2 must exceed picked.seq=2"*. **CONTAINMENT,
MEASURED IN BOTH THE DIRECTIONS THAT MATTER:** `seq_is_monotonic_from_one`
survives M2, so this body's kill set is not contained in the counter's
own unit test; `rearm_baseline_…` survives M6, so it is not contained in
its sibling's either. The lane's remaining direction is argued rather
than measured and IS DISCLOSED as such on this card — I checked that
disclosure is accurate and did not run that mutant either.

**AND THE OBVIOUS MUTANT IS THE WRONG ONE, WHICH IS WORTH THE INK.** M1
— break the counter itself — reds this body at line **2611**
(`picked.seq > still_a.seq`), an assertion this diff never touched. So a
reader who reaches for the counter to prove the new pin load-bearing
proves something else. Only a mutant on the EMIT's own draw (M2/D1) dies
at 2681.

### THE M5 REFUSAL, AND ITS OWN CONTROL

My sealed attack set pre-committed to REFUSING one class of evidence:
*deleting the barrier restores nondeterminism, it does not create a
defect.* **I OWED THAT REFUSAL A DEMONSTRATION AND HERE IT IS.** With
`barrier(&state)` removed at `4e85b4d`, the body passed **30 runs out of
30** on this darwin host — the same score the UNFIXED body scored at the
base (**30 of 30**, measured in phase 1 before the diff existed). So no
darwin drill can show the barrier is load-bearing, and none was offered:
the lane rests it on the happens-before chain, which is the only thing
that could carry it, and which I verified line by line above. **A green
re-run count on this host is worth zero here in either direction, and I
priced my own the same way** — the 12-of-12 under load below is a sample
that could only have refuted, not confirmed.

### Measured in this bench, each figure at its ref

- `cargo test` (app/src-tauri) at **`4e85b4d`**: exit **0**, summed over
  18 binaries, **630 passed · 0 failed · 4 ignored** — identical to my
  phase-1 baseline at `69a8477`, which is what a test-only diff should
  read. (The lane's `bodies=634` is the same tree counted with the four
  ignored included; both figures are honest and they are not the same
  number.)
- `npx vitest run` (lib/parser) at `4e85b4d`: exit **0**, **349 passed**
  in 16 files. Its smoke test parses the live `docs/` tree, so the new
  `T-018-s5` card parses.
- `node tools/e2e/scripts/docs-gate.mjs <the three paths>` **from the
  repository root** at `4e85b4d`: exit **1 — FIRES**, naming `npm test`
  from app/, `npm test` from tools/e2e/ and `npx vitest run` from
  lib/parser/; **0 frontmatter issues in the live tree**, *"every live
  task card's frontmatter parses, with a legal status"*. (Run from
  tools/e2e/ it exits **2** and refuses plain relative paths — called
  wrong, never a clean gate. Worth knowing.)
- `index --check --root ../..` at `4e85b4d`: exit **1, STALE**, and it
  is the REAL red, not the `committed: MISSING` false one — both sides
  print `1168002 bytes · 200 files · 2501 symbols · 2388 edges` and the
  file diff is `files +0 -0 ~1`,
  `~ app/src-tauri/src/docs_watch.rs (content, loc 4662 -> 4738)`.
  **The regeneration is the INTEGRATOR'S, in the merge commit** — the
  lane's routing of it is correct and its numbers reproduce here exactly.
- The body 12 times under 6 spinning burners at `4e85b4d`: **12 of 12**.
- The host asymmetry, re-measured rather than taken: three
  `--nocapture` runs at `4e85b4d` printed **4 `docs-changed` lines,
  `fs_events=1` each** — ONE batch per write on darwin, so no residual
  batch is ever in the loop when the pick draws. Against CI run
  `33566291111` attempt 1, where `alpha v2` split into `seq=2` and
  `seq=3` one millisecond apart with `fs_events=3`. **That asymmetry is
  the whole account of why three sightings are Linux-only**, and the
  lane's refusal to widen a window to reproduce it locally is the right
  call, not a gap.

### Security sweep (mandatory, step 3)

Clean. No production line changes; no `unsafe`; no dependency; no
traversal, symlink, `MAX_FILES` or `is_plain_dir`/`has_plain_docs_dir`
relaxation; no new fixture path (the body's `TempTree` names keep their
pid-and-timestamp stems, so two concurrent runners cannot collide); no
process spawn, no environment read, no secret. The only `/tmp` strings
in the diff are prose naming the removed drill worktree, and
`/private/tmp/nd-T-018-s2` is gone from disk — I checked.

### Claims I re-derived rather than accepted

- The three CI transcripts, read myself with `--attempt 1` (plain
  `--log-failed` is EMPTY on all three; each was re-run green). Sighting
  two's run id, which this card carries only as a sha, is
  **`33321774720`**. All three fail by exactly one draw: the emit is
  `seq=5`, the pick's draw is 6 or more.
- The sweep of the class. I derived it independently in phase 1 and
  reached the same answer the lane did: three bodies make the
  "emit outranks a pick" claim (2622/2681, 2654/2730, 4229/4305) and
  **only the picker body crosses a re-arm from a PREVIOUSLY ARMED
  watch**; the other two open with `live_state(None)`, so nothing can be
  in flight. The comment recording that at the sibling's own site is the
  right place for it.
- `T-018-s5`'s premise, which I checked in the frontend it names:
  `genesisSwitchIsOvertaken` is defined at `watcher-store.ts:550` and
  consulted in the `"genesis"` branch at `:606`, while the `"picked"`
  branch at `:586` calls `reduceDocs(prev.docs, outcome.snapshot)` with
  no guard at all. **The card is true.** I record that my sealed ground
  truth reached the same question before the diff existed and parked it
  as out-of-fence — so this is corroboration by two seats that could not
  see each other, not a verifier agreeing with a report.

### Findings

**NONE at REJECTED level.** Every arm of my sealed attack set is
discharged: the pin was not weakened (the assertion is the same
comparison, now with a message); it is not folded into `recv_until`'s
predicate, so a violating emit FAILS rather than being skipped; there is
no sleep, settle, retry, `#[ignore]` or platform `cfg`; no assertion the
body had at the base was lost; the fence holds; nothing passes on darwin
by construction that would race on Linux.

Three notes, none blocking:

1. **The card's ask names the wrong mutant for its own pin.** "The
   mutant that makes the tie legal" is satisfied at the changed line
   only by D1/M2. A future reader reaching for `next_seq` gets a red at
   2611 instead and may conclude the new pin is drilled when it is not.
   Recorded here so the next reader of this card does not repeat it.
2. **M3 is a live survivor, and it is PRE-EXISTING rather than this
   diff's.** Hoisting `open_as_project`'s seq draw above the re-arm ack
   — the ordinary pick stamping itself before the arm — leaves the lib
   suite **270 of 270 green**. The genesis path's equivalent IS pinned,
   by arm A of
   `the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`;
   the ordinary path has no such body. This diff adds only test code, so
   it cannot have created the survivor. Not filed as a card by me — the
   ordering it would pin is exactly what `T-018-s5` is about to move.
3. `barrier` blocks on an unbounded `recv()`, so an ALIVE-but-stuck
   watcher hangs it with no message, where `recv_until` would have named
   itself at `SILENCE_BACKSTOP`. Pre-existing and deliberate — its
   doc-comment argues the case (*"a watcher that is merely SLOW makes
   this call slow, which is the entire point"*) — and `live_state`
   already calls it on every live body. Noted, not charged to this diff.

### Gates at MY OWN tip, not at the commit I was sent

This verdict is a write to a card that the docs gate names as a code
input, so the three suites it named are owed at the tip this commit
creates, and they are recorded in the commit that follows this
paragraph rather than in it — a commit cannot measure itself.

**APPROVED.** The card asked for three things and got all three: the
ordering the watcher actually promises, derived from the code; that
ordering pinned rather than the wish; and the pin shown red under the
mutant that makes the tie legal, at the line that moved, in a run I made
myself.
### The verdict's own gates, measured at the verdict commit `3f7b43b`

**A COMMIT CANNOT MEASURE ITSELF**, so these were read at the tip the
verdict created and are recorded by the commit after it, which is
docs/tasks-only and moves no input the gate has not already named.

- `gate-run.mjs parser` — exit **0**, `bodies=349 targets=1 ref=3f7b43b verdict=GREEN`
- `gate-run.mjs app` — exit **0**, `bodies=1131 targets=1 ref=3f7b43b verdict=GREEN`
- `NPUTER_E2E_PORT=25018 gate-run.mjs e2e` — exit **1**, `bodies=548 verdict=RED`,
  **544 passed / 4 failed — AND NOT THIS DIFF'S.** Attributed rather
  than assumed: the SAME four bodies fail at `69a8477`, the lane's base,
  where neither the diff nor this verdict exists (73 passed / 4 failed
  over those three spec files). One cause under all four —
  `checkout-currency.mjs` judges the checkout the command runs in and
  answers `verdict: stale`, `STALE [guard-surface-behind] ... 28
  commit(s) behind main`, because **a verifier bench is detached at the
  lane's BASE by design** (orchestrator 5c) and is therefore behind
  `main` by construction. Filed as **`T-240`**, `status: suggested`; it
  is `T-216-s4`'s shape one layer over. The rust leg is not owed (no
  docs/tasks reader in that suite) and read 630/0/4 at `4e85b4d`
  regardless.
- `docs-gate.mjs` over both card paths, **run from the repository root**:
  `0 frontmatter issue(s) in the live tree`, *"every live task card's
  frontmatter parses, with a legal status"*, governing-document budgets
  hold. `npx vitest run` from lib/parser — **349 passed**, and its smoke
  test parses the live `docs/` tree, so `T-018-s5` and `T-240` both
  parse.
