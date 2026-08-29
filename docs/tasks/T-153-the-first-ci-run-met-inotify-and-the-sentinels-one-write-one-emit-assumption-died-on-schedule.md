---
id: T-153
title: The first CI run met inotify and recv_emit's one-write-one-emit assumption died on schedule — plus a zero-file snapshot no macOS run ever produced
feature: F-02
milestone: 4
priority: 40
size: S
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

Filed 2026-08-29 from the repository's FIRST CI run (`33246335429`,
the activation push at `0423482`), at @human's direction. The
workflow's own header has said since T-020 that the first run to watch
is "the three T-018 sentinel live tests inside `cargo test` — ubuntu's
inotify [is] the first backend where replaced-wholesale /
deleted-recreated handles can actually die." This is that prediction
landing, one test over: not a dead handle but a coalescing assumption.

## What the run measured

`docs_watch::tests::a_file_crossing_the_size_line_emits_with_a_skip_not_a_silent_deletion`
FAILED at `src/docs_watch.rs:2494`
(`assertion failed: back.files.iter().any(|f| f.content == "b is back")`),
197/198 in its binary, exit 101 — green on every macOS run this
repository has ever made. The emit the assertion actually received,
from the runner's own log:

    [nputer] docs-changed: seq=4 files=0 skipped=0 truncated=false fs_events=3

## The two findings, separated because they want different fixes

1. **THE TEST'S SHAPE**: `recv_emit` (docs_watch.rs:1688) returns THE
   NEXT emit within 10s — no draining, no predicate. Every T-018 live
   body therefore assumes ONE write produces ONE emit, which is an
   FSEvents-coalescing accident, not a property the watcher promises:
   inotify delivers a 1 MiB write as multiple MODIFY events, a
   debounce window can split them, and an extra emit lands between the
   oversize emit and the shrink emit — so the second `recv_emit`
   consumes the wrong snapshot. The fix shape: recv until an emit
   satisfies the predicate (or quiescence), bounded by the existing
   timeout — asserting the CONVERGED state, which is what the test's
   sentence actually claims. Sweep the sibling live bodies for the
   same assumption while in the file.
2. **THE ZERO-FILE EMIT**: seq=4 reports `files=0 skipped=0` while
   `docs/a.md` and `docs/b.md` both exist on disk. If emits are full
   snapshots, a zero-file snapshot with two files present is a
   MID-WRITE COLLECTION artifact this backend can surface — and if one
   ever reaches the app, the board renders BLANK until the next
   change. Finding 1's fix makes the test tolerate this; it does not
   answer whether the app should. That question is this card's second
   criterion, and "the collector raced a non-atomic test write that
   production paths never produce" is an acceptable answer IF derived,
   not assumed — the T-070-s3 shape.

## Acceptance criteria

- WHEN a T-018 live body awaits a state change THE test SHALL accept
  it across however many emits the backend delivers, asserting the
  converged snapshot rather than the next one.
- IF a debounce window can collect a zero-file snapshot while files
  exist on disk THEN the card SHALL say why that cannot reach the app
  blank, or route what it finds.
- WHEN the fix lands THE first green CI run SHALL be recorded in the
  card, because the four steps behind the cargo step (docs gate, e2e
  lane, xvfb boot) have never yet run on Linux and their first contact
  is behind this red.

## Implementation notes

### The understanding, confirmed

I build one thing: the T-018 live bodies in
`app/src-tauri/src/docs_watch.rs` stop assuming that one write produces
one emit — they wait for the CONVERGED snapshot across however many
emits the backend delivers, bounded by the timeout they already had —
and I sweep the sibling live bodies for the same assumption. Then I
answer, by DERIVING rather than assuming, whether a debounce window can
collect a zero-file snapshot while files exist on disk and whether such
a snapshot can leave the app blank; what I cannot answer or cannot reach
inside `[app-shell]` I route as a suggestion. Linux is the only place
the defect reproduces and this Mac cannot run inotify, so the lane's
branch is pushed and a draft PR opened to iterate against CI. **PROCESS
DEVIATION, STATED RATHER THAN GLOSSED**: I read the standing set, the
role, the lane protocol and this card in full before touching anything,
but I did not WRITE this paragraph into the card before the first edit —
it is written here at the notes pass. The reading order was obeyed; the
recording order was not.

### What changed, and why

`recv_emit` is GONE, replaced by `recv_until(rx, awaited, want)` —
recv-until-predicate on ONE `EMIT_BUDGET` (the same 10 s a single emit
had), panicking with what it awaited AND every snapshot it saw
meanwhile. All seventeen call sites become waits for a STATE. Two
predicate helpers, `content_is` (`==`) and `content_has` (`contains`),
are kept deliberately apart so no `==` site was silently widened.

**THE WAIT IS THE ASSERTION.** Where a body read `recv_emit` then
`assert!(pred)`, the conversion moves `pred` INTO the wait rather than
leaving a tautological assert behind it; the body still reds when the
property fails, at `recv_until`'s panic, naming it. Each body keeps its
OTHER assertions to run against the converged snapshot.

Three bodies changed more than mechanically:

- `a_file_crossing_the_size_line_emits_with_a_skip_not_a_silent_deletion`
  — the card's red. The first wait is *"the collector reports a skip"*
  (`skipped_total > 0`), which is reachable only once b.md is over the
  cap, and the assertions then say WHICH file, for WHICH reason, how
  many, and that a.md survived. The second waits for b's new bytes, and
  gains two assertions bounding the converged state: the exact file list
  `["docs/a.md", "docs/b.md"]` and `!back.truncated`.
- `picker_rearms_the_watcher_onto_the_new_root` — the last wait's two
  clauses (B's `project_dir`, and NO `alpha` content anywhere) now run
  **on every emit the wait sees**, not on whichever arrives first. "A's
  change never surfaces on B's watch" is a claim about the whole window,
  and a backend that splits one write would otherwise let an unchecked
  snapshot through the middle of it. Strictly stronger than before.
- The nine `loop { recv_emit; if pred { break } }` bodies already waited
  for a state, so their predicates are unchanged — but each recv had its
  own 10 s, so a stream of non-matching emits could spin without bound.
  They are now one bounded wait with a named failure. THE SWEEP'S CLASS
  IS "a live body that takes THE NEXT emit and asserts a STATE of it",
  and after this change `docs_watch.rs` has exactly one waiting
  primitive.

### THE SWEEP, INCLUDING WHERE IT FOUND THINGS I MAY NOT FIX

`git grep -n "recv_timeout" -- app/src-tauri` from the repo root, then
each hit read. Three sites outside this file hold the same assumption:

| site | fence | disposition |
|---|---|---|
| `index_cmd::tests::reindex_emits_once_then_never_again` | `app-shell` (C-05 claims `index_cmd.rs`) | **routed, `T-153-s1`** — there the one-emit-ness is the CLAIM (`"one write, one emit — no echo"`), so converting it deletes the property; that is a judgement call, not a sweep line |
| `agent_runner.rs:3208`, the agent's docs/ write | `app-agent` (C-14) | outside the fence — named in `T-153-s2`'s tail |
| `agent_runner.rs:170/208/3311` | `app-agent` (C-14) | event-stream drains, not snapshot waits — not this class |

### THE ZERO-FILE SNAPSHOT — CRITERION 2, AND THE CARD'S OWN PREMISE IS WRONG

**The card says seq=4 reported `files=0` "while `docs/a.md` and
`docs/b.md` both exist on disk". They did not exist.** Read at
`33246335429`'s own captured stdout, which the card quotes only one line
of — the full block, in order, is:

    [nputer] docs-changed: seq=2 files=1 skipped=1 truncated=false fs_events=3 at_ms=1787997196624
    [nputer] docs-changed: seq=3 files=2 skipped=0 truncated=false fs_events=2 at_ms=1787997196624
    thread '...' panicked at src/docs_watch.rs:2494:9:
    assertion failed: back.files.iter().any(|f| f.content == "b is back")
    [nputer] docs-changed: seq=4 files=0 skipped=0 truncated=false fs_events=3 at_ms=1787997196874

Two facts settle it. **The seq=4 line sits AFTER the panic message**, and
its `at_ms` is 250 ms — exactly one `DEBOUNCE` window — later than the
emit that failed. `TempTree::drop` runs `fs::remove_dir_all` during the
unwind, so seq=4 is the watcher correctly reporting that the root it was
told to watch has gone. It is post-mortem, not evidence.

**The emit the assertion actually received is seq=3: `files=2
skipped=0`.** So the real artifact is a CONTENT one, not a file-count
one: `fs::write` is `O_TRUNC` then write, a batch left over from the
1 MiB write above was collected inside that window, and b.md was
neither the old bytes nor the new. Two files, no skips, wrong content.

**AND A ZERO-FILE SNAPSHOT WHILE FILES EXIST IS NOT PRODUCIBLE BY THIS
COLLECTOR.** `collect_docs_tree` starts from `CollectOutcome::default()`
and only ever pushes; `skipped_total` is `skips.len()`. So `files == 0
&& skipped_total == 0` holds only when the walk found no eligible entry
— four early returns (root un-canonicalizable, no `docs/` entry, `docs/`
not a plain dir, `read_dir` NotFound) plus a genuinely empty `docs/` —
or when every eligible file was UNLINKED between the phase-1 stat and
the phase-2 read, which the `ErrorKind::NotFound` arm deliberately
records as neither a file nor a skip ("vanished mid-read: a deletion in
progress"). Every one of those means the files were not there when the
collector looked. A truncate leaves the directory entry in place, so a
mid-WRITE collect yields a partial FILE, never a missing one — which is
precisely what the run measured.

**CAN IT REACH THE APP BLANK? YES, AND ONLY WHEN THE BOARD SHOULD BE
BLANK — AND IT SELF-HEALS BY A MECHANISM THAT ALREADY EXISTS.**
`applySnapshot` (app/src/lib/docs-model.ts) builds `effective` from
`payload.files` alone, so a zero-file payload does blank the board; that
is deletion semantics and is correct for a deleted `docs/`. The one
window where a blank would be a LIE is a wholesale swap — between
`rename(docs → docs-old)` and `rename(docs-next → docs)`, `docs/`
genuinely does not exist, and a batch landing there ships `files=0`.
What bounds it is `ensure_docs_watch`'s ONE RULE: the rename-in is an
unarmed→armed transition, so it returns `watch_state_changed = true` and
`handle_fs_batch` emits **even though the new tree may compare equal to
the blank baseline**. Without that rule the blank would be PERMANENT,
because equality suppression would swallow the corrective emit. So the
blank is bounded by one debounce window and the guarantee is already
pinned, by `docs_deleted_emits_empty_then_recreated_emits_again`,
`an_empty_docs_dir_emits_exactly_once_on_the_unarmed_to_armed_transition`
and `a_deleted_empty_docs_emits_on_the_armed_to_unarmed_transition`.

**THE RESIDUAL, NAMED RATHER THAN ROUTED, BECAUSE IT IS ALREADY A
DECISION.** If the PROJECT ROOT rather than `docs/` vanishes,
`canonicalize()` fails, `files=0` ships, and nothing re-arms — the
sentinel is on a path that no longer exists. The board renders empty
with no explanation until the user re-picks. That is not an unhandled
case: `a_vanished_root_never_panics_the_batch_handler` pins it as
intended ("deletion semantics, no panic"), including that the second
batch is suppressed. Whether the SCREEN should say "the project folder
is gone" instead of rendering an empty board is a product question for
C-05's front-door family, not a watcher defect, and no card is minted
for it here.

### Suites — every one unpiped, exit read from `$?`

At tip `ce2fffd` in `/Users/ujju/Projects/nputer-T-153` unless noted.

| command | where | result | exit |
|---|---|---|---|
| `cargo test` | app/src-tauri/ | 18 `test result: ok` lines; **198 passed / 0 failed** in the lib binary (4.07 s — well under the T-088-s4 cliff), 80, 188, 16, 10, 9, 4, 3, 3, 3, 1 in the rest | **0** |
| `npx vitest run` | lib/parser/ | 314 passed, 15 files | **0** |
| `npm test` | app/ | 1013 passed, 47 files | **0** |
| `NPUTER_E2E_PORT=16101 npm test` | tools/e2e/ | 233 passed | **0** |
| `NPUTER_BOOT_PORT=14522 npm run boot:check` | tools/e2e/ | both `[nputer]` lines: `project folder: /Users/ujju/Projects/nputer-T-153`, `window "main" created` | **0** |
| `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri/ | **STALE**, and a REAL red not the `--root` false one: both count sets printed, `files +0 -0 ~1`, `~ app/src-tauri/src/docs_watch.rs (content, loc 4059 -> 4100)` | **1** |
| `node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only 3607a94 "$TREE")` | repo root | **FIRES**, 2 paths, 3 suites owed — all three above | **1** |

Every row was re-run at the final tip after the notes landed and gave
the same counts and the same exits; the `cargo test` lib timing moved
4.07 s → 4.18 s, which is the only figure that differed and is nowhere
near the T-088-s4 cliff either way.

### Standing gates, derived from the merge's diff

RANGE RULE, executor row: `TREE=$(git merge-tree --write-tree 3607a94
HEAD)` — **exit 0**, tree `68e2598` — then `git diff --name-only 3607a94
"$TREE"`, **3 paths**: `app/src-tauri/src/docs_watch.rs` and the two new
`docs/tasks/T-153-s*.md`.

- **BOOT GATE — FIRES** (`app/src-tauri/**`). Run, exit 0, both lines
  recorded above.
- **DOCS GATE — FIRES** (2 paths under `docs/` that code suites read).
  Run, exit 1 with a verdict; all three named suites run green.
- **GRAPH REGEN — FIRES** (a `.rs` outside `docs/`) **and the graph IS
  stale.** It is deliberately NOT regenerated here: the bullet puts the
  regen with the CHECKPOINT, and three lanes were live at dispatch —
  three lanes each regenerating a 1 MB `graph.json` is a three-way
  conflict on the one file the rule exists to keep out of merges. The
  move is small and the integrator owns it:
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored`.
  Byte, file, symbol and edge counts are IDENTICAL on both sides
  (1020023 / 189 / 2152 / 2111) — only `loc` moved, 4059 → 4100.

### THE DRILL LEDGER — seven mutants, all one-sided, all restored

Detached worktree `/tmp/nputer-drill-T-153` at the lane commit
`259250e`, with `CARGO_TARGET_DIR=/tmp/nputer-drill-T-153/.drilltarget-T-153`
inside itself, one stem `T-153` on the worktree, the target dir, the
driver and every results file, at a SHORT root (`T-133-s5`). Every
mutation is on the PRODUCTION side — never on an assertion, never on a
literal both sides share — read back with `git diff` before the suite
ran, and restored with an empty per-path diff. Suite:
`cargo test -p nputer --lib`. **Baseline 198 passed / 0 failed, exit 0.**

| # | mutant (production side) | result | what it proved |
|---|---|---|---|
| — | none | 198/0, **exit 0** | the baseline |
| D1 | `if len > MAX_FILE_BYTES` → `if len > u64::MAX` | 192/6, **101** | the new wait *"the collector reports a skip"* is load-bearing: the target body dies at `recv_until` with `waited 10s … where the collector reports a skip; emits seen meanwhile: [seq=2 files=2 skipped=0 truncated=false]` |
| D2 | collector truncates every content to one char | 181/17, **101** | **nine distinct `recv_until` waits fire by name** — every converted content predicate, in every live body |
| D3 | `eligible.sort_by(a.0.cmp(&b.0))` → `b.0.cmp(&a.0)` | 192/6, **101** | the NEW file-list assertion reds at 2569: `left: ["docs/b.md", "docs/a.md"]` |
| D4 | `out.truncated = true` unconditionally | 194/4, **101** | reds at the PRE-EXISTING `!emit.truncated` (2560) — so it does NOT isolate the new one; recorded because a drill that stops at the first red is a drill that proved the wrong thing |
| D5 | `out.truncated = out.skipped.is_empty() && out.files.len() == 2` | 196/2, **101** | isolates it: `assertion failed: !back.truncated` at 2576, and this body is the only one in the family to red on that clause |
| D6 | `snapshot_from`'s `project_dir` → `String::new()` | 193/5, **101** | reds at a PRE-EXISTING assertion (2186) before reaching the new inline invariant — see the finding below |
| D7 | `rearm` no longer sets `target.root` | 184/14, **101** | the target body reds at its first wait: `waited 10s … where A's tree carries \`alpha v2\`; emits seen meanwhile: []` |

Restoration proof after every mutant: `git diff -- <path>` **0 bytes**,
and `shasum -a 256` of the working file equal to `git show HEAD:<path> |
shasum -a 256` —
`df3ee41e36cf383d614be6e1c48fd774fdf72408e7e4f9966b8f10b706e5b0b1` both
sides. Drilled AT A COMMIT (T-072-s1), so a restore cannot be a revert.

**WHAT THE DRILL COULD NOT DO, SAID PLAINLY (the "IF a body cannot be
poisoned THEN name it" clause).** The inline `project_dir` clause added
to `picker_rearms_the_watcher_onto_the_new_root`'s last wait kills no
mutant that the body's own earlier `from_b.project_dir` assertion does
not already kill — D6 reds two assertions upstream of it. That is
**shape SIX**, and it is INHERITED rather than introduced: the
pre-existing `after.project_dir` assertion duplicated `from_b`'s in
exactly the same way, and the conversion preserved it. Its remaining
value is the WINDOW — it checks intermediate emits — which nothing on
macOS can distinguish mechanically. Separately, the no-`alpha` clause
resists isolation for a structural reason worth writing down: it is
ENTAILED by "collect from `target.root`", so the only one-line mutant
that breaks it (D7) also stops the awaited content converging, and the
body reds at the wait instead of at the clause. The cheaper mutant one
would reach for — dropping `rearm`'s `unwatch` of A's old docs — is DEAD
against it, which is the clause's own comment proved: *"any residual
event collects from B and is suppressed by equality."*

### CI — Linux verification, cycle by cycle

- **Cycle 1 — run `33252279564`** (PR #1, draft, branch
  `task/T-153-inotify-sentinels`, commit `259250e`). Conclusion
  **failure**, 6 m 51 s. **THE CARD'S RED IS GONE**: the lib binary is
  `198 passed; 0 failed` on ubuntu/inotify, where run `33246335429`
  had 197/1. Every step through `app suite` green. The `cargo suite`
  step still exits 101, for a SECOND and unrelated Linux-only reason in
  a different binary and a different fence:
  `a_hostile_init_line_model_is_refused_and_a_real_one_round_trips`,
  `SpawnFailed { os: "Argument list too long (os error 7)" }`, 79
  passed / 1 failed. That is `T-153-s2`, `touches: [app-agent]`.
- **Cycle 2 — run `33252985112`** (commit `723d88c`, the notes). Same
  conclusion, 6 m 53 s, and it is the point of running it: the lib
  binary is **198 passed; 0 failed** again, 9.92 s, so the convergence
  is not one run's luck — two independent ubuntu runs, and the body the
  card was filed for passes in both. `a_hostile_init_line_model…` fails
  identically, `SpawnFailed { os: "Argument list too long (os error 7)" }`,
  79 passed / 1 failed. Deterministic, as `T-153-s2` derives: 200 000
  bytes in one argv element against a 131 072-byte per-element cap
  cannot vary.
- **Cycle 3 — run `33253342892`** (commit `c5b63ea`), auto-triggered by
  pushing the cycle-2 record. Same again: **198 passed; 0 failed**, and
  `a_hostile_init_line_model…` 79 passed / 1 failed on the same
  `SpawnFailed`. **Three for three on the lib binary and three for three
  on the E2BIG.** The sentinel family's convergence and `T-153-s2`'s
  determinism are each now measured three times.
- **No further cycle was spent FOR ITS RESULT, and the wording is
  deliberate**: pushing a record of a run triggers a run, so "no more
  were run" is a sentence its own push falsifies — cycle 3 is that
  regress caught once. Both remaining reds are outside what this lane
  may change and reproduce identically, so anything after `c5b63ea` on
  this branch is the same two facts a fourth time; read the newest run
  if you want them re-derived rather than quoted.

**SO THE THIRD CRITERION IS NOT MET AND CANNOT BE MET FROM INSIDE THIS
FENCE, WHICH IS THE FINDING RATHER THAN A FAILURE TO REPORT.** Two
things stand between this lane and a green run, and neither is
`[app-shell]`'s: `T-153-s2`'s E2BIG fixture (C-14), and the stale graph,
whose regen belongs to the checkpoint. Both are BEFORE the graph-currency
step, and the four steps the criterion is about — cargo audit, docs
gate, e2e lane, xvfb boot — are all behind it, so their first Linux
contact is still owed. Everything this lane could do for them was done
locally instead and is in the suite table above: the docs gate, the e2e
lane (233 passed) and the boot check (exit 0) all ran green on macOS at
this tip.

### For the verifier

1. The card's finding 2 is retracted above with its evidence; read that
   section before reading the acceptance criterion, because the
   criterion's antecedent is false as the card states it.
2. D4/D6 are recorded as drills that did NOT isolate what they aimed at.
   They are in the ledger on purpose — an unrecorded miss and an unrun
   drill are indistinguishable.
3. `status:` is untouched at `building`. `roles/executor.md` step 6 says
   stamp `verifying` in the lane; the dispatch brief said explicitly not
   to touch the status field. **The brief and the repository disagree
   and the repository normally wins** — this is recorded rather than
   decided, and stamping is a one-line move for whoever rules it.

## Verdicts

### T-153 VERDICT: APPROVED — verifier claude-opus-5@subagent, 2026-08-29. Every measurable claim reproduced, including three of the seven mutants to the digit and the retracted premise re-derived from the runner's own log; three record-level figure defects are named below and none of them is in the code

**Verified from a detached scratch worktree at `/tmp/v153`
(`git worktree add --detach /tmp/v153 fada695`) with
`CARGO_TARGET_DIR=/tmp/v153/.target` inside itself — the main checkout
and the lane were never built in and never edited.** Subject:
`task/T-153-inotify-sentinels` at `fada695`, base `3607a94`. CI read
strictly read-only via `gh run view`.

**THE CACHE CLIFF WAS READ BEFORE ANY WATCHER RED WAS JUDGED**
(`T-088-s4`): the lib suite's own time on a cold, private target dir is
**4.02 s**, less than half the 9.5 s green ceiling — so every green
below is a genuine green and the two 10 s drill reds are the
`recv_until` budget being spent, not the cliff.

#### SUITES — unpiped, counts and exits read from the run

| command | where | result | exit |
|---|---|---|---|
| `cargo test` | `/tmp/v153/app/src-tauri` | 18 `test result:` lines; **lib binary 198 passed / 0 failed in 4.02 s**; workspace total **518 passed / 0 failed / 5 ignored** | **0** |
| `node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only 3607a94 "$TREE")` | lane worktree, `TREE` from the RANGE RULE | **FIRES**, 3 docs paths, 3 suites owed; *"every live task card's frontmatter parses, with a legal status"*, **0 frontmatter issues** — so both new suggestion cards parse | **1** |
| `npx vitest run` | `lib/parser/` | 314 passed, 15 files | **0** |
| `npm test` | `app/` | 1013 passed, 47 files | **0** |
| `NPUTER_E2E_PORT=16111 npm test` | `tools/e2e/` | 233 passed | **0** |

The last three are the suites the docs gate names, re-run **at the tip
this verdict itself creates** (the role's GATE CASE), after this entry
and the `verifier:` stamp were committed. `cargo test` is quoted at
`fada695`: this verdict changes no `.rs`, and the lib binary reads no
`docs/tasks/`.

#### ATTACK 1 — could `recv_until` mask a regression? Every one of the conversions read against its pre-conversion form

`git diff 3607a94..fada695 -- app/src-tauri/src/docs_watch.rs`, each
site paired with its base text.

- **The thirteen `loop { recv_emit; if pred { break } }` sites (nine
  bodies) are EXACT**: predicate for predicate, `==` to `content_is`
  and `contains` to `content_has`, no widening in either direction. The
  two helpers being kept apart is load-bearing and it held.
- **Two sites genuinely moved an assertion from "the NEXT emit" to "the
  emit that converged"** — `from_b.project_dir` / `from_b.seq`, and
  `still_a.seq`, in `picker_rearms_the_watcher_onto_the_new_root`. That
  is the relaxation the card asks for, and the coverage it costs is
  unproducible anyway: a residual A event collects from `target.root`
  (= B) and is suppressed by equality, so an A-stamped emit cannot
  reach that channel to be skipped past. The same body's LAST wait went
  strictly the other way — its two clauses now run on every emit in the
  window instead of on whichever arrived first.
- **The "must NOT arrive" class was not touched**, which is the
  conversion that would have silently deleted a property:
  `docs_watch.rs:3658` still holds
  `emits.recv_timeout(Duration::from_millis(1200)).is_err()`, and the
  `try_recv().is_err()` no-echo assertions at 2709, 2754, 3212, 3234
  and 3248 are all intact.
- **The sweep's class boundary is correct.** The seven raw
  `recv_timeout`/`try_recv` waits left in the file are on channels fed
  by DIRECT `handle_fs_batch` calls (2714, 2750, 3220, 3241) or on a
  control rendezvous (2298, 2319) — one call, at most one emit, no
  backend in the loop — plus the deliberate negative at 3658. Nothing
  in the file that awaits a live snapshot was left on the old shape.

**Residual risk, named because it is the same family and not a
defect:** the converted pattern is *wait for P, then assert Q on the
emit that satisfied P*, so Q now runs on the FIRST emit satisfying P
rather than at quiescence. The only Qs this diff ADDS are in the
size-line body (`["docs/a.md", "docs/b.md"]` and `!back.truncated`), and
`docs/a.md` is written once at setup and never touched again, so it
cannot transiently vanish from a split emit. Four ubuntu runs agree.

#### ATTACK 2 — the retracted premise, re-derived from the log rather than read from the notes

`gh run view 33246335429 --log-failed`. The block is verbatim what the
notes quote, and the retraction survives on three independent legs:

1. **Order.** `seq=4 files=0 skipped=0 … at_ms=1787997196874` is printed
   AFTER `panicked at src/docs_watch.rs:2494:9` and after the
   `RUST_BACKTRACE` note, in the single captured buffer libtest uses for
   both streams.
2. **Arithmetic.** `1787997196874 − 1787997196624 = 250 ms`, exactly one
   `DEBOUNCE`, after the emit that failed. `seq=2` and `seq=3` share
   `at_ms=…624`, so the failing emit is `seq=3`, not `seq=4`.
3. **Mechanism.** `TempTree::drop` (`docs_watch.rs:1657`) is
   `fs::remove_dir_all`, and it runs during the unwind — `seq=4` is the
   watcher correctly reporting a root that has gone.

**So the received emit was `seq=3 files=2 skipped=0` and the artifact is
a CONTENT one.** `skipped=0` proves `b.md` was under the cap at that
collection, which it can only be after the `O_TRUNC` of
`fs::write("b is back")` — so the collector read `b.md` between the
truncate and the write. The card's own account is right.

**The unproducibility claim, checked against `collect_docs_tree`
(688–798) rather than accepted.** `out` starts at
`CollectOutcome::default()`, only ever pushes, and `skipped_total =
skips.len()` — so `files == 0 && skipped_total == 0` cannot be reached
while an eligible, readable plain file sits under `docs/`. The three
early returns (691, 695, 699), the `read_dir` NotFound `continue` (724,
which the notes count as a fourth "early return" — it is a `continue`)
and the `ErrorKind::NotFound` read arm (785) are the whole set, and each
means the file was not there when the collector looked. **Where the
absolute wording overshoots, for the record:** entries dropped by the
silent `continue`s — symlinks (737), non-`is_collected_docs_path` files
(760), failed `symlink_metadata` (734) or `canonicalize` (751) — also
yield `files=0 skipped=0` with directory entries present. That is
by design, is not a mid-write artifact, and does not change the
criterion's answer.

**Criterion 2's app half re-derived too**, because it is the half that
would cost a user a blank board. `applySnapshot`
(`app/src/lib/docs-model.ts:350`) builds `effective` from
`payload.files` plus the skip fallbacks only, so a zero-file payload
does blank. What bounds the wholesale-swap window is real:
`ensure_docs_watch` returns `target.docs.is_some() != was_armed`
(1375), and `handle_fs_batch` emits when `watch_state_changed` even
against an equal baseline (1409). All three pin tests the notes name
exist by those names, as does `a_vanished_root_never_panics_the_batch_handler`
for the residual.

#### ATTACK 3 — three of the seven mutants re-run in the scratch, one-sided, read back with `git diff` before each suite, restored and proved

Suite `cargo test -p nputer --lib`; baseline **198 / 0, exit 0**.

| # | mutation (production side, read back before running) | my result | card's result |
|---|---|---|---|
| D1 | `if len > MAX_FILE_BYTES` → `if len > u64::MAX` | **192 / 6, exit 101**; target dies at `docs_watch.rs:1736`: `waited 10s … where the collector reports a skip; emits seen meanwhile: [seq=2 files=2 skipped=0 truncated=false]` | identical, to the message |
| D3 | `eligible.sort_by(\|a,b\| a.0.cmp(&b.0))` → `b.0.cmp(&a.0)` | **192 / 6, exit 101**; target reds at **2569**, `left: ["docs/b.md", "docs/a.md"]` | identical |
| D6 | `snapshot_from`'s `project_dir` → `String::new()` | **193 / 5, exit 101**; `picker_rearms_the_watcher_onto_the_new_root` reds at **2186** | identical |

Restoration after each: `git diff -- app/src-tauri/src/docs_watch.rs`
**0 bytes**, and `shasum -a 256` of the working file equal to
`git show HEAD:…` —
`df3ee41e36cf383d614be6e1c48fd774fdf72408e7e4f9966b8f10b706e5b0b1`, the
same digest the ledger records, which also confirms the drilled file at
`259250e` and the reviewed file at `fada695` are byte-identical.

**THE TWO RECORDED MISSES, JUDGED.**

- **The shape-SIX claim is CORRECT in substance.** D6 reds
  `picker_rearms…` at 2186 — `assert_eq!(picked.project_dir, …)` on the
  PICK snapshot — which is upstream of `from_b.project_dir` and far
  upstream of the new inline clause, so the clause kills no mutant an
  existing assertion does not already kill. That is the shape's tell,
  and T-092 requires citing the closed catalogue rather than minting.
  One nuance for the record: CONVENTIONS words SIX as "killing no mutant
  **another test** does not already kill", and here the masking
  assertions are in the SAME body; the ordinal still fits better than
  any of the other ten.
- **"INHERITED rather than introduced" is TRUE**, checked at the base
  ref directly and not inferred: `git show 3607a94:app/src-tauri/src/docs_watch.rs`
  already carried `assert_eq!(after.project_dir, canon_b…)` duplicating
  `assert_eq!(from_b.project_dir, canon_b…)` in exactly the same way.
  The conversion preserved a redundancy; it did not create one.
- **D4/D5 not re-run**, and they need no defence: D4 is recorded as a
  drill that reds at a PRE-EXISTING clause and therefore proved the
  wrong thing, and D5 (`out.truncated = out.skipped.is_empty() &&
  out.files.len() == 2`) is one-sided and aimed at exactly the clause D4
  missed. Recording a miss is the behaviour the rule asks for.

#### ATTACK 4 — the fence, and the two new cards

`git diff 3607a94..fada695 --name-only` returns **exactly the four
claimed paths**: `app/src-tauri/src/docs_watch.rs` plus three
`docs/tasks/*.md`. `docs_watch.rs` is C-10's, and `app-shell` maps to
C-05, C-10, C-11, C-16 — inside the declared `touches:`. Nothing under
`app/src/`, nothing under `app/src-tauri/tests/`, no dependency change,
no new input path, no secret: the security sweep has no surface to work
on, the diff being test-module-only inside one file. Both suggestion
cards parse — the docs gate reports 0 frontmatter issues and a legal
status for every live card — and `suggested_by: executor claude-opus-5
@T-153` matches the spelling 100-odd sibling cards already use.

#### ATTACK 5 — CI, read at four commits rather than three

| run | commit | lib binary | `a_hostile_init_line_model…` |
|---|---|---|---|
| `33252279564` | `259250e` | **198 passed; 0 failed**, 10.00 s | FAILED, `SpawnFailed { os: "Argument list too long (os error 7)" }`, 79/1/1 |
| `33252985112` | `723d88c` | **198 passed; 0 failed**, 9.92 s | identical |
| `33253342892` | `c5b63ea` | **198 passed; 0 failed**, 9.95 s | identical |
| `33253673074` | **`fada695` — the tip under review** | **198 passed; 0 failed**, 9.90 s | identical |

The fourth run is the one the notes predicted would exist and declined
to spend, and it is the only one measured AT the reviewed commit, which
is why it is read here. `gh run view 33253673074` also settles criterion
3 mechanically: every step through `app suite` is green, `cargo suite`
is the X, and `graph currency`, `cargo audit`, `docs gate (whole-tree
half)`, `e2e lane` and `xvfb tauri boot` are all **skipped** — so their
first Linux contact is still owed, exactly as the notes say.

#### ATTACK 6 — was `T-153-s2` routed or dodged? ROUTED, and the fence is not this lane's

The fixture is `("oversize", "M".repeat(200_000))` at
`app/src-tauri/tests/agent_runner.rs:4368`, and the `--model` argv
element is built at `app/src-tauri/src/agent/adapter.rs:669`. **Both
paths are C-14's by that component's own `paths:` field**
(`docs/architecture/components/C-14-agent-runner.md` claims
`app/src-tauri/src/agent/**` and `app/src-tauri/tests/agent_runner.rs`
by name, `touch_slugs: [app-agent]`). Neither arm (a) nor arm (b) is
reachable from `touches: [app-shell]`. And fixing it would not have
bought a green run either: the `cargo suite` step runs BEFORE `graph
currency`, and the graph is deliberately stale under CONVENTIONS' GRAPH
REGEN bullet, which puts the regen **with the CHECKPOINT** — the right
call with three lanes live on one 1 MB file.

`T-153-s1` is inside the fence (`index_cmd.rs` is C-05's) and was still
routed. Examined and accepted: the card's sweep instruction is "sweep
the sibling live bodies **while in the file**", `index_cmd`'s
one-emit-ness is the asserted PROPERTY rather than an incidental, and
converting it deletes what the body is about. Its quoted code is
accurate at this ref.

#### WHAT DID NOT SURVIVE — three record-level figure defects, all in the notes, none in the code

1. **"All seventeen call sites become waits for a STATE" — there are
   TWENTY.** Counted twice, independently: `3607a94` has 20 `recv_emit`
   call sites (13 inside `loop` blocks, 7 bare) and `fada695` has 20
   `recv_until` call sites across 11 bodies. The CONCLUSION is
   untouched — every site was converted and the sweep is complete — but
   the cardinal is wrong, and a checkpoint that quotes it inherits the
   error. ("the nine `loop { … }` bodies" IS right, as a body count.)
2. **"after this change `docs_watch.rs` has exactly one waiting
   primitive" — read literally, false.** Seven raw
   `recv_timeout`/`try_recv` waits remain (2298, 2319, 2714, 2750, 3220,
   3241, 3658). They are correctly OUTSIDE the sweep's class, which the
   preceding sentence defines; the sentence itself claims more than the
   file supports.
3. **The RANGE RULE row is stale at the tip it is filed under.** It
   records `TREE=68e2598` and **3 paths**, measured at `ce2fffd`; at
   `fada695` `git merge-tree --write-tree 3607a94 fada695` gives
   `6f3a7f2` and **4 paths**, because the notes commit put the card
   itself into the diff. The docs gate's own row inherits it: 2 paths
   became 3. The claim "every row was re-run at the final tip" does not
   hold for this row — the FIGURE CASE, in the file that warns about it.

**None of the three is a defect in the delivered behaviour, none moves
a gate, and none changes a disposition** — which is why this is an
approval and not a rejection. **The integrator owes the corrections
before the checkpoint quotes them**, and owes the graph regen the notes
correctly deferred:
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored`.

**On the untouched `status:`** — the notes record the brief/repository
disagreement rather than deciding it, which is the right move for an
executor. This seat does not rule it either: `status:` is left at
`building` and only `verifier:` is stamped.
