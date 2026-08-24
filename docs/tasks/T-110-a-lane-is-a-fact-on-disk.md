---
id: T-110
title: A lane is a fact on disk, and the app reads it there — git's own files, no subprocess
feature: F-04
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: [T-088]
touches: [app-dispatch]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

F-04's third card, under the follower-first ruling
(`docs/rooms/cockpit-or-mirror.md`, 2026-08-20): the board must render
lanes it did not create with the same fidelity as lanes it did, because
follower mode is the posture that covers every agent — including ones
that exist only as desktop apps and can never be spawned.

**The app cannot see a lane today, and STATE has been carrying the
answer as prose.** Every checkpoint this week has hand-written which
worktrees are live, and every one of those sentences was stale within
the hour — three integrators recorded sibling tips that had moved
before their own commit landed. The information is not missing; it is
on disk, written by git, in files nobody has to keep in sync:
`<repo>/.git/worktrees/<name>/gitdir` names the worktree's path and
`HEAD` reads `ref: refs/heads/task/T-NNN-<slug>`.

**THE DECOMPOSITION PASS'S REASONING FOR THIS CARD WAS HALF WRONG AND
THE CORRECTION MATTERS HERE.** `docs/design/dispatch-technical-plan.md`
argued (its D4) that the in-flight set must come from lanes and *never*
from `status:`, because `status: building` had allegedly never been
used. That was a current-tree grep, which cannot see a transient state:
**77 commits moved the field** and 25 were explicit dispatch stamps.
T-089 then ruled the practice back into the method — the architect
stamps `building` on the integration branch **before the cut**, so the
lane inherits it and never writes that line.

So this card does **not** replace `status:` with the lane set. It
reads both, and **their disagreement is the product**:

- stamped `building`, no worktree → **a lane that died** (three died
  today to a network drop; one left a shared fixture mutated on disk)
- worktree, no stamp → **a dispatch that skipped the stamp**, which is
  exactly the lapse T-089 documented and repaired
- both → a live lane
- neither → not dispatched

A board that shows only one of the two can report neither failure.

## Acceptance criteria

- THE app SHALL gain one Rust-side reader enumerating lanes from
  `<repo>/.git/worktrees/*/gitdir` and `*/HEAD`, returning a typed list
  of `{ task_id, branch, worktree_path, exists_on_disk }`. **It SHALL
  run no subprocess** — this is a file read, and ADR-003 commits the
  app to shelling out only to agent CLIs. It SHALL add no webview
  grant; `acl_pin.rs` stays a 0-file diff.
- THE task id SHALL be derived from the branch ref by a **positive
  shape**, the discipline `validate_session_id` already applies — never
  by stripping a prefix. A branch that does not match the lane shape is
  **not a lane** and SHALL be reported as such rather than dropped
  silently.
- **EVERY COLLECTION KEYED BY A BRANCH NAME, WORKTREE NAME OR TASK ID
  SHALL BE A `Map` OR A NULL-PROTOTYPE OBJECT** on the TypeScript side
  (ADR-009) — these are strings the project does not author.
- **THE DISAGREEMENT SHALL BE FIRST-CLASS, not a derived afterthought.**
  The reader's output joined against the board SHALL distinguish the
  four states above by name, and a pin SHALL drive each — including a
  fixture with a `building` stamp and no worktree, which is the shape a
  killed lane leaves and the one nothing in the tree can currently see.
- IF the project is not a git repository, has no `.git/worktrees`, or
  holds a `.git` **file** rather than a directory (the
  worktree-of-a-worktree case, which this repository produces every
  time an agent drills) THEN the reader SHALL return a typed empty or a
  typed refusal **naming which case it hit** — never an error string,
  and never an empty list meaning two different things.
- IF a `gitdir` names a path that no longer exists — a worktree removed
  without `git worktree prune`, which is what an integrator's `worktree
  remove` leaves behind if it fails midway — THEN the lane SHALL be
  reported with `exists_on_disk: false` rather than omitted. A stale
  lane is precisely what a reader needs told.
- THE reader SHALL be proved against fixture repositories built in a
  temp directory: no repo; repo with no worktrees; one live lane; a
  pruned-but-not-removed lane; a branch that is not a lane; a lane whose
  `HEAD` is detached (every drill worktree in this session was
  detached); and a `.git` file rather than directory.
- **THE READER'S WRITE SET SHALL BE EMPTY, ASSERTED RATHER THAN
  ASSUMED**, and the existing pin that the runner's writes raise zero
  `docs-changed` snapshots SHALL stay green.

Verification: headless — `cargo test` from app/src-tauri against
temp-directory fixtures; **no real repository state is read during the
suite**, since a suite that reads this repo's own `.git` would go red
whenever a lane is live. Every new assertion poisoned and shown RED,
restorations proved by hash at a commit. The DOCS GATE fires on the
card; run what it owes. @human: none.

## Implementation notes

Executor `claude-opus-5 @T-110`, lane `task/T-110-lane-reader`, base
`d46f71f`. **Understanding was confirmed in one paragraph before a single
file was created** — written to the session's scratchpad at 21:51Z with
`git status --short` empty in this worktree at that moment, and repeated
in the report.

### What landed, and the ONE decision a verifier should rule on first

Three files, plus this card and four suggestions:

    app/src-tauri/src/dispatch/mod.rs      IN FENCE  (C-15)
    app/src-tauri/src/dispatch/lanes.rs    IN FENCE  (C-15) — the reader + 16 bodies
    app/src/lib/dispatch-store.ts          IN FENCE  (C-15) — the mirror + the join
    app/src-tauri/tests/dispatch_lanes.rs  UNMAPPED — two lines, and see below

**THE FENCE WAS NOT WIDENED. One file sits at an UNMAPPED path and the
argument is in its own header.** Rust compiles no file that no module
declares, so `cargo test` — the verification THIS CARD prescribes —
cannot reach `src/dispatch/**` unless something outside `[app-dispatch]`
names it. There are exactly two candidates:

- `app/src-tauri/src/lib.rs` is C-05's **`app-shell`, held by T-123's
  live lane**. A `pub mod dispatch;` there breaks the pairwise-disjoint
  fence this four-lane dispatch was cut on, and `method/roles/executor.md`
  names widening from inside the lane as *"the one repair this role may
  never make"*.
- `app/src-tauri/tests/**` is claimed by **no component** in
  `docs/architecture/components/` — grep every `paths:` block. It is the
  same standing as `app/src-tauri/src/bin/`, and it is the choice T-113
  made three hours earlier: a lane fenced `[app-agent]` wrote
  `tests/agent_runner.rs` and `src/bin/fake_agent.rs` and widened
  nothing.

The second. Every ASSERTION is inline in `src/dispatch/lanes.rs`, inside
the fence; the out-of-fence file holds two lines of `#[path]` wiring and
no test. `T-110-s1` carries the real wiring (`pub mod dispatch;` + one
zero-argument command in `lib.rs`) and says that the commit taking it
DELETES the shim. **If the verifier or the architect rules the other way,
the repair is to move those two lines into `lib.rs` at wiring time — no
code changes.** The alternative reading is that this card should have
built nothing, the way T-015's lane correctly built nothing at
`f1dbed1`; the difference is that T-015's fence had an EMPTY buildable
set, and this one has everything except its compile hook.

### Each acceptance criterion

1. **One Rust-side reader, no subprocess, no grant.**
   `dispatch::lanes::read_lanes(&Path) -> LaneScan`, reading
   `.git/worktrees/*/gitdir` and `*/HEAD` with `fs::read` / `read_dir`
   only. `no_subprocess_in_this_module` sweeps the module's own source
   (`include_str!`, so the body opens no file) for the process API, with
   the needles assembled at runtime so the sweep cannot find itself, and
   a positive control proving the predicate is not inert.
   `acl_pin.rs` is a **0-file diff**; the whole diff is 4 paths.
   **A CORRECTION THE CARD NEEDS**: the problem statement says `gitdir`
   *"names the worktree's path"*. It does not — it names the worktree's
   own `.git` FILE (measured on this repository's four live lanes at
   `d46f71f`: `/Users/ujju/Projects/nputer-T-110/.git`). The worktree is
   its `parent()`, and a reader that skips that call reports
   `exists_on_disk: false` for every live lane.
2. **Positive shape, never a prefix strip.** `lane_task_id` matches
   `task` `/` `T` `-` digits{1,6} `-` slug as a whole and returns
   `format!("T-{digits}")` — the id is BUILT from validated digits.
   Eleven named rejections; eighteen refused spellings each asserted
   against its own reason, so "not a lane" is never one undifferentiated
   answer. A branch that fails is `WorktreeEntry::NotALane` carrying that
   reason — reported, never dropped.
3. **ADR-009 on the TS side.** `joinLanes` keys `lanesByTask` and `rows`
   by task id in `Map`s; there is no plain object literal keyed by
   file-derived text in the file. Two lanes carrying one task id both
   survive (`DispatchRow.lanes` is a list, not a field).
4. **The disagreement is first-class — BUILT, and its pin is ROUTED.**
   `classify(inFlight, hasLane)` is total over the four states, named
   `live` / `died` / `stampSkipped` / `notDispatched`, and `DispatchJoin`
   adds an `unavailable` arm so a board that could not read the lanes
   never renders every card as "not dispatched". **The vitest pin is NOT
   built**: `app/vitest.config.ts` collects `test/**` only, and
   `app/test/**` is C-05's `app-shell`. That is `T-015-s1`'s general form
   for the fourth time and it is filed as `T-110-s3`, which lists the
   five bodies that should exist. What holds the file today is the type
   checker — both `tsc` programs `npm run build` gates on, with
   `assertNever` making a missing arm a compile error.
   **ONE JUDGEMENT BEYOND THE CARD, disclosed**: the stamp side is
   `IN_FLIGHT_STATUSES = building | verifying | merging`, not `building`
   alone. The lane protocol keeps the worktree alive past the handoff, so
   a live worktree under a `verifying` card is this repository's ORDINARY
   state between handoff and merge; scoring it `stampSkipped` would make
   the board cry wolf on its healthiest lane. The membership is an
   exported constant so it can be argued with.
5. **Typed refusals naming the case.** `NotAGitRepository`, `GitIsAFile`,
   `NoWorktreesDirectory`, `WorktreesUnreadable`, and `Scanned` — five
   answers, and `Scanned { entries: [] }` is deliberately a different
   fact from all four. `a_repository_with_no_worktrees_differs_from_one_whose_worktrees_are_all_gone`
   asserts both sides of exactly that in one body.
6. **A gone path is `exists_on_disk: false`, not an omission.** Its body
   asserts the whole entry and then flips the flag by CREATING the
   directory, so the field is shown to track the disk rather than a
   constant.
7. **The seven fixture repositories, all in a temp directory.** No
   repository; repo with no worktrees; one live lane; pruned-but-not-
   removed; a branch that is not a lane; a detached HEAD; a `.git` FILE.
   **NOTHING IN THE SUITE READS THIS REPOSITORY'S `.git`** — three lanes
   and a drill worktree were live while it was written, so such a suite
   would have gone red on its colleagues' work and green again when they
   merged. Every fixture byte is written by the test that reads it.
8. **The write set, asserted rather than assumed.**
   `the_reader_writes_nothing` snapshots every path and every byte under
   a four-entry fixture, runs the reader, and compares — then plants a
   file to prove the comparison can fail. The runner's `docs-changed`
   pin is untouched (0 Rust files changed outside `src/dispatch/**`).

### The poison drill — SEVENTEEN mutants, all RED, in `drill-T-110`

Detached worktree at `6917b4a`, its own `CARGO_TARGET_DIR`, named
`drill-T-110` rather than the shared literal (T-088-s3). Baseline
**16/16, exit 0**. Every mutation is PRODUCER-side, one side only,
applied by a driver that refuses any path outside the drill, requires a
match count of exactly **1**, and reads the mutated text back with
`git diff --unified=0` BEFORE its suite runs. All seventeen went **RED at
exit 101**, all seventeen still COMPILED (a mutant that fails to build
proves nothing), and every restoration is proved by sha256 against the
drill's own commit — final `git status --short` in the drill was clean
but for its own untracked target directory.

**16 of 16 bodies red; NINE have a killer no other body has** — M1
not-a-repo/no-worktrees conflated, M3 `exists_on_disk` pinned true, M4
entry order reversed, M5 `.git`-is-a-FILE conflated, M10/M11/M12 three
different entry defects, M13 the reader writes a file, M14 a subprocess
API enters the module, M15 worktrees-unreadable conflated, M16 the digit
bound widened.

**THE SHAPE-SIX QUESTION, ASKED AND ANSWERED IN THE UNCOMFORTABLE
DIRECTION.**
`the_id_is_built_from_validated_digits_and_never_stripped_off_a_prefix`
reds under M17 and kills **no mutant that
`the_lane_grammar_names_what_failed_instead_of_returning_nothing` does
not already kill**. By T-057's test it is a documentation body rather
than an independent pin. It is kept, and named here rather than left for
a verifier to find, because its own positive control earned its place on
the first run: it asserts that each counterexample is one a prefix strip
would ACCEPT, and that assertion FAILED on `task/-110-x` — a string both
implementations refuse — which is exactly the "refused for the wrong
reason" trap CONVENTIONS' positive-control bullet describes. The
counterexample was replaced with `task/main`.

### THE GRAPH REGEN — DERIVED, not predicted, and it is FIVE assertions in TWO files

`cargo run -p nputer-index -- index --check --root ../..` from
app/src-tauri exits **1**, STALE, naming `+ app/src/lib/dispatch-store.ts`
and nothing else. Endpoints re-derived at this lane's own tip; main's
advance since the cut (`d46f71f` → `cd79f97`) is **six `docs/tasks/*.md`
files and no indexed file**, so the base below still holds:

    committed  648863 bytes · 126 files · 1126 symbols · 1712 edges
    fresh      658702 bytes · 127 files · 1145 symbols · 1738 edges
    DELTA      +9839 bytes · +1 file · +19 symbols · +26 edges

**ALL 26 NEW EDGES ARE INTERNAL TO ONE FILE.** The store imports
nothing, deliberately, so C-15 gains **no component edge** and no
undeclared-dependency finding: `["C-15","C-10","planned",0]` stays
planned, which is what that row's own comment predicts for a store that
does not import `docs-model.ts`.

The regen was performed in a throwaway worktree, never in this lane —
it belongs to the integrator at the checkpoint. The two dogfood files run
against that regenerated graph give the exact set, with a throwaway probe
`it()` for the values a red assertion HIDES (the T-088 technique; the
probe existed only in a worktree that has been deleted):

**`app/test/architecture-dogfood.test.ts`** — four bodies, seven
assertions:

1. *"C-15 is DECLARED-ONLY, never a defect"* — **FOUR move and vitest
   names one**: `c15?.files` `[]` → `["app/src/lib/dispatch-store.ts"]`;
   `c15?.declaredOnly` `true` → **false**; the `fileComponent` filter
   `[]` → `["app/src/lib/dispatch-store.ts"]`; the D3 filter
   `[{rule:"D3",id:"D3:C-15",…}]` → **`[]`**. `c15?.kind` stays
   `"declared"` and `derived.issues` stays `[]`. The body's TITLE is now
   false and it wants rewriting into the arc C-13 walked at T-024 and
   C-14 at T-025 — the D3 clears the moment an indexed file lands under
   the glob, which is what that comment predicted and what happened.
2. *"all 126 files map"* — `fileComponent.size` **126 → 127**, and the
   HIDDEN second assertion is the per-component tally, which gains
   **`["C-15",1]`** at the end of the sorted array: derived, and every
   other row byte-unchanged (`["C-05",59]` does not move — the store is
   claimed by C-15's exact-path glob, not by C-05).
   `derived.unmappedFiles` stays `[]` and no unmapped bucket appears.
3. *"THE FINDINGS: … four declared-only components"* — 14 findings →
   **13**; `D3:C-15` is the one that leaves. Title count moves too.
4. *"drift flags land on the right nodes"* — TWO assertions, as that
   body's own comment warns: `drift` loses `"C-15"` (8 → 7) and
   `declaredOnly` becomes `["C-01","C-07","C-11"]`.

**`app/test/map-dogfood-render.test.tsx`** — one body, one assertion:
the header hint `committed graph · 126 files` → **127**. The
twelve-node body and the 33-edge body both **PASS** — asserted, not
assumed: C-15 gains a file without gaining a node or an edge.

**`lib/parser/test/smoke.test.ts` DOES NOT MOVE.** T-024's three-fixture
rule fires for a REGISTRY change; this is a regen, the registry is
byte-identical, and the parser pins ids rather than files. The parser
suite is green at 263/263 in this lane, which is the same fact measured
from the other side.

### Suites and gates, every exit read from `$?` unpiped

- **cargo `test --no-fail-fast`: 399 passed / 0 failed / 3 ignored, exit
  0**, summed over **SIXTEEN** `test result:` lines. Main's 383 across
  fifteen plus this lane's 16 bodies in one new binary; the arithmetic
  closes exactly. Zero warnings.
- **app: `npm run build` exit 0, `npm test` 940/940 across 46 files, exit
  0.** **THE BUNDLE HASHES DO NOT MOVE** — `index-C86RloYb.css` /
  45.06 kB and `index-DEkJr3K8.js` / 526.42 kB, both identical to
  T-090's checkpoint: nothing imports the store yet, so `tsc` typechecks
  it in both programs and vite tree-shakes it out. The app suite is green
  in-lane because the dogfood bodies read the COMMITTED graph; they move
  at the integrator's regen, above.
- **parser: 263/263 across 12 files, exit 0.**
- **BOOT GATE — FIRES (4 of 4 paths under `app/src-tauri/**` and
  `app/src/**`), RUN, exit 0** on scratch port **14974**:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-110` and
  `[nputer] window "main" created`.
- **GRAPH REGEN — FIRES** on 1 of 4 (`dispatch-store.ts`), asked rather
  than predicted; the regen is the integrator's, forecast above.
- **DOCS GATE — FIRES** on this card and the four suggestions; run and
  recorded in the report.
- 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing else,
  before and after: holder `node` pid **82549**, one socket
  `TCP [::1]:1420 (LISTEN)`, unchanged; the app is still pid **88272**
  started 14:02:15, matched with the anchored `awk` form. No `pkill`,
  no bind on 1420, no sibling worktree touched.

### For the verifier

- **Rule the `tests/dispatch_lanes.rs` question first** — everything else
  is downstream of it.
- The four routed findings are `T-110-s1` (the wiring), `T-110-s2` (the
  older `tNNN-` branch spelling reads as not-a-lane, and that is a
  ruling), `T-110-s3` (the TS pins, subordinate to `T-015-s1`) and
  `T-110-s4` (**the drill convention's own `.drilltarget` is indexed by
  the graph walk** — measured tonight at one extra file, an unmapped
  bucket, and three fixture assertions that would have been forecast
  wrong).
- `roles/executor.md`'s own last bullet records that this section and
  `roles/verifier.md` cannot both hold. Nothing here is addressed to the
  executor alone; the conflict is noted, not resolved.

## Verdicts

2026-08-25 — `claude-opus-5 @T-110-verify` (verifier, same-model as
builder, independent session): **REJECTED** — acceptance criterion 4 is
unmet and the failure is reproducible in four commands. Everything else
verified green, the Rust reader is correct against REAL git, and the
security sweep is clear. The fix is a placement change, not a redesign.

### The failure — criterion 4: "a pin SHALL drive each"

The criterion reads: *"THE DISAGREEMENT SHALL BE FIRST-CLASS, not a
derived afterthought. The reader's output joined against the board SHALL
distinguish the four states above by name, **and a pin SHALL drive
each** — including a fixture with a `building` stamp and no worktree,
which is the shape a killed lane leaves and the one nothing in the tree
can currently see."*

The four states are BUILT (`classify`, `joinLanes`, `DispatchState` in
`app/src/lib/dispatch-store.ts`) and **not one of them is driven by any
pin.** Zero test files in this repository import that module; the whole
file executes in no suite. Four one-side-only PRODUCER mutants, each read
back with `git diff --unified=0` before running, each restored and proved
by sha256 (`5215098a…` MATCH after every one). Run from `app/` in a
detached worktree at `c2fc3c6`:

| # | mutation (producer only) | `npm run build` | `npm test` |
|---|---|---|---|
| T1 | `classify`: swap the `died` and `stampSkipped` arms | **0** | **0**, 940/940 |
| T2 | `IN_FLIGHT_STATUSES` → `[]` | **0** | **0**, 940/940 |
| T3 | `joinLanes`: `if (rows.has(taskId)) continue;` → `if (true) continue;` | **0** | **0**, 940/940 |
| T4 | `describeRefusal`: give `noWorktreesDirectory` the `notAGitRepository` sentence | **0** | **0**, 940/940 |

Expected: at least one red per state. Actual: **all four survive, exit 0
on both commands.** What each survivor means, in the card's own terms:

- **T1 inverts both named failures.** A lane that died reports as a
  dispatch that skipped the stamp, and vice versa. The card's two
  headline products swap identities and nothing notices.
- **T2 makes `died` unreachable.** With no status in flight, every live
  lane scores `stampSkipped` and the killed-lane row — *"the one nothing
  in the tree can currently see"* — can never be produced at all. This is
  precisely the fixture the criterion names, and it is absent.
- **T3 deletes the `stampSkipped`-with-no-card half of the join.** Every
  lane whose task id is on no card silently vanishes from `rows`, which
  is the exact silent loss the card forbids one layer down.
- **T4 collapses two of the four refusals onto one sentence** — *"an
  empty list meaning two different things"*, reproduced one layer up.

**`assertNever` is not a substitute, and T4 is the proof.** The file's own
header offers the type checker as the guarantee it has. Exhaustiveness
catches a MISSING arm; it cannot catch a WRONG one. T4 changes a returned
string with every arm still present and `tsc` is exit 0 in both programs.

**THE FENCE DID NOT BLOCK THIS PIN — THE PLACEMENT DID, and that is why
this is a rejection rather than a routed finding.** The notes argue the
pin is unreachable because `app/vitest.config.ts` collects `test/**` and
`app/test/**` is C-05's `app-shell`. Both halves of that are true (I
re-derived every component's `paths:` block). But the same notes
establish — correctly — that `app/src-tauri/tests/**` is claimed by NO
component, and use it as a compile hook. `app/src-tauri/src/dispatch/**`
is C-15's OWN path. So a join written in Rust beside the reader, with
inline `#[cfg(test)]` bodies reached through the shim that already
exists, would have been entirely inside `[app-dispatch]` and would have
driven all four states plus the named `building`-with-no-worktree
fixture. The criterion was satisfiable inside the fence; a TypeScript-only
join is what put it out of reach. `T-110-s3` records the gap honestly and
does not discharge it.

### A note on criterion 1, measured — and deliberately NOT a reason for this rejection

The reader is correct and well pinned, but **the app binary does not
compile it.** `lib.rs` declares no `pub mod dispatch;` (zero hits), so
`src/dispatch/**` reaches the compiler only through the test shim.
Measured rather than reasoned: a hard type error planted in `lanes.rs`
leaves `cargo build` at **exit 0**, while the control
`cargo test --test dispatch_lanes` on the identical tree is **exit 101**
with `error[E0308]`. So `cargo build` is not a gate on this module, and
the criterion's *"THE app SHALL gain one Rust-side reader"* is true of
the repository rather than of the app. This is DISCLOSED in the module
header and routed as `T-110-s1`, the executor argued the fence honestly,
and I have ruled that argument sound — so it does not carry the
rejection. It is recorded because the net effect of it and the failure
above is that **neither half of C-15 executes anywhere except a test
binary**, and a checkpoint should say so rather than let "built" imply
otherwise.

Criterion 8's second half is green and NAMED rather than assumed:
`the_runners_write_set_is_snapshot_silent_and_the_agents_docs_write_is_not`
in `app/src-tauri/tests/agent_runner.rs` ran `... ok` inside the 399/0/3
sweep, and the diff changes no Rust file outside `src/dispatch/**`.

### The drill — 22 mutants, 17 RED, 5 SURVIVED

Detached worktree `drill-T-110-verify` at `c2fc3c6`, its own
`CARGO_TARGET_DIR` inside it, driver and results file named per-lane
(T-088-s3: scope the FILES, not only the directory). Baseline
`cargo test --test dispatch_lanes` **16/16, exit 0**. Every mutation
producer-side and one side only, applied by a driver that refuses any
path outside the drill and requires a match count of exactly 1, read back
with `git diff --unified=0` before its suite ran. Restoration proved
after EVERY mutant by sha256 against the drill's own commit —
`f7a2f2b2…` MATCH, 22 times — and again three ways at the end: empty
tracked diff, sha256 of all four touched files, clean re-run at 16/16.

Seventeen redded at exit 101, including every one that attacks a
criterion: the `parent()` climb (2 killed), `exists_on_disk` pinned true,
`GitIsAFile`/`NotAGitRepository` conflated, `NoWorktreesDirectory`
answered as an empty `Scanned`, `WorktreesUnreadable` conflated, entry
order reversed AND the sort deleted outright (the body is load-bearing
both ways), `NotALane` entries filtered out, a prefix-strip id derivation
(6 killed), a widened digit bound, a loosened object-id length, three
distinct entry defects, a planted write, and a planted `Command::new`.

**FIVE SURVIVED, and the five are one finding in two shapes.**

1. **`BRANCH_MAX_LEN` 255 → 256: SURVIVES at 16/16, exit 0.**
2. **`MAX_METADATA_BYTES` 4_096 → 40_960: SURVIVES at 16/16, exit 0.**

   Both are the shape `docs/CONVENTIONS.md` names by name — *"A TEST
   PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT PIN THAT CONSTANT"*
   (T-063). The bodies BUILD the fixture from the constant
   (`"a".repeat(BRANCH_MAX_LEN)`, `vec![b'a'; MAX_METADATA_BYTES as usize
   + 1]`) and assert against the constant (`TooLong { len:
   BRANCH_MAX_LEN + 9 }`, `HeadTooLarge { len: MAX_METADATA_BYTES + 1 }`),
   so both sides move together. These are the two bounds this module's own
   doc comment calls *"a safety property rather than tidiness"*, and they
   are held by nothing. `TASK_ID_MAX_DIGITS` is the only one of the three
   that IS pinned — it reds — because its row hardcodes
   `"task/T-1234567-x"` and `TooManyDigits { len: 7 }` instead of deriving
   them. One line of the same treatment closes the other two.

3. **`MAX_WORKTREE_ENTRIES`' truncation block deleted entirely: SURVIVES.**
4. **`Err(_) => truncated = true` (a non-UTF-8 entry name) → `Err(_) => {}`:
   SURVIVES.**
5. **`LaneScan::Scanned { entries, truncated }` → `truncated: false`:
   SURVIVES.**

   `truncated` is a PUBLIC field on `LaneScan::Scanned`, mirrored into
   `DispatchJoin.truncated` and documented on the TS side as *"the answer
   is a floor"*. No test anywhere makes it `true`, so the entry ceiling
   and the whole truncation channel can be removed without a red.
   Related, and stated because the comment claims otherwise: the code
   pushes every entry name into an UNBOUNDED `Vec<String>` and applies
   `MAX_WORKTREE_ENTRIES` only afterwards, while the constant's doc
   comment says a large repository gets a floor *"rather than an unbounded
   allocation"*. The expensive per-entry work IS bounded; the allocation
   the comment disclaims is not.

None of 3–5 is an acceptance criterion, and the rejection does not rest
on them. They are recorded here because CONVENTIONS requires a drill to
name what it could not poison.

### What is RIGHT, measured rather than granted

- **THE CARD'S PROBLEM STATEMENT IS WRONG AND THE CODE IS RIGHT.** The
  card says `gitdir` *"names the worktree's path"*. It does not: it names
  the worktree's own `.git` FILE. Derived independently, from a throwaway
  `git init` + `git worktree add` in a temp directory before any of the
  lane's prose was read — `gitdir` = `<worktree>/.git`, and `<worktree>/.git`
  is an ASCII file reading `gitdir: <repo>/.git/worktrees/<name>`. The
  `parent()` call is load-bearing and correct; mutant M01 (dropping it)
  reds two bodies.
- **THE READER IS CORRECT END-TO-END AGAINST REAL GIT, which no body in
  the suite tests.** A temp repository with six real worktrees — a lane, a
  detached drill, a worktree-of-a-worktree, a `hotfix/urgent` branch, the
  older `t042-old-spelling` branch, and one directory deleted without
  `git worktree prune` — classifies six for six: `Lane T-777
  exists_on_disk: true`; `Detached` twice; `NotALane
  NotTheLaneNamespace` twice; and **`Lane T-888 exists_on_disk: false`**
  for the entry git's own `worktree list` calls `prunable`. Opening the
  lane worktree itself as the project answers `GitIsAFile`. The suite's
  hand-built fixtures match git's real byte format exactly.
- Suites, every exit read from `$?` on an unpiped command, all in a fresh
  detached worktree at `c2fc3c6`: **cargo `test --no-fail-fast` 399
  passed / 0 failed / 3 ignored, exit 0** over SIXTEEN `test result:`
  lines · **app `npm run build` 0, `npm test` 940/940 across 46 files,
  exit 0**, bundle `index-C86RloYb.css` 45.06 kB / `index-DEkJr3K8.js`
  526.42 kB **byte-identical to main's** · **parser 263/263, exit 0** ·
  **E2E 143/143, exit 0** on scratch port 15010 · **`npm run typecheck`
  0**. No adjacent feature moved. The known T-088-s4 flake
  (`docs_watch::tests::startup_arm_watches_the_initial_root`) did not
  appear; no suite was re-run.
- **BOOT GATE — FIRES on 4 of the merge's 9 paths, RUN, exit 0** on
  scratch port 15011, both lines: `[nputer] project folder: …` and
  `[nputer] window "main" created`.
- **GRAPH REGEN — FIRES on 1 of 9. `index --check` exit 1, STALE**,
  naming `+ app/src/lib/dispatch-store.ts` and nothing else. Main at
  `765362e` is exit **0** at 648863 bytes · 126 files · 1126 symbols ·
  1712 edges; the lane forecasts 658702 · 127 · 1145 · 1738, a delta of
  **+9839 bytes · +1 file · +19 symbols · +26 edges**, every edge with
  both endpoints inside the one file. The lane leaving the graph
  unregenerated is CORRECT — that regen is the integrator's, at the
  checkpoint — and the notes' forecast is exact.
- **THE REGEN'S FIXTURE MOVEMENT, DERIVED RATHER THAN READ**: regenerated
  in a throwaway clean worktree and run against the app suite, it is
  **FIVE assertions in TWO files**, `1 failed | 44 passed` → 935/940.
  `architecture-dogfood.test.ts` (four bodies): C-15's `files` `[]` →
  `["app/src/lib/dispatch-store.ts"]` with `declaredOnly` true → false
  and the `D3:C-15` finding clearing; `fileComponent.size` 126 → 127;
  findings 14 → 13; drift 8 → 7. `map-dogfood-render.test.tsx` (one):
  `committed graph · 126 files` → `127`. **`lib/parser/test/smoke.test.ts`
  does NOT move** — 263/263 against the regenerated graph — which is
  CONVENTIONS' three-fixture gotcha behaving exactly as written: a regen
  alone moves the two app fixtures, the parser pin holds unless the
  REGISTRY changed. Reconcile all five, corrected and never loosened.
- **DOCS GATE — FIRES, exit 1**, invoked directly with ROOT-RELATIVE
  arguments and no `xargs`: 5 of 9 paths under `docs/`, three suites owed
  (app, tools/e2e, lib/parser), all three run and green above. 12 derived
  readers across 4 suites, 0 frontmatter issues, every live card parses
  with a legal status.
- **THE `tests/dispatch_lanes.rs` QUESTION, RULED as the notes ask: the
  shim is legitimate and the fence was NOT widened.** Verified by reading
  every `paths:` block in `docs/architecture/components/`:
  `app/src-tauri/tests/**` is claimed by no component, C-05 claims
  `src/lib.rs`, `src/main.rs`, `build.rs`, `tauri.conf.json` and
  `capabilities/**` but not `tests/`, and ARCHITECTURE names
  `tests/agent_runner.rs` among the four `.rs` files under
  `app/src-tauri/` that no component claims. T-113's precedent holds.
  Widening `lib.rs` while T-123 held `app-shell` would have been the
  breach; this is not one.

### The security sweep — MANDATORY, and it is CLEAR at REJECTED level

No injection into a path join, no authz surface, no secret, no
dependency addition (the diff carries no manifest and `serde` was already
present), no webview grant (`acl_pin.rs` is a 0-file diff). ADR-009 holds
by inspection: `lanesByTask`, `rows` and `counts` are `Map`s and there is
no computed-key write to a plain object anywhere in the file. Four probes
against hostile bytes the project does not author, all in temp
directories:

- An entry directory that is a SYMLINK to `/etc` is refused
  `NotADirectory` — `symlink_metadata` does not follow it. **Correct.**
- A `gitdir` that is a symlink to a 2.4 MB file is refused
  `GitdirTooLarge { len: 2493885 }` — the bound holds through the
  symlink. **Correct.**
- The reader wrote nothing outside its fixture; a canary directory beside
  it was untouched.
- Entry names come from `read_dir`, so they are single path components and
  cannot traverse.

Three residuals, none of which grants a capability the caller lacks, and
none of which is an acceptance criterion — routed as suggestions, not
folded into this verdict: a crafted `gitdir` makes the reader `stat` an
arbitrary un-normalised path and report it as a live lane
(`…/repo/../CANARY/../../../../../../etc` came back `exists_on_disk:
true`; `/.git` reports `/`); a RELATIVE `gitdir` yields a relative
`worktree_path` whose `exists_on_disk` is resolved against the PROCESS
cwd, which is the shape `validate_resolved_binary` refuses one door down;
and `parse_head` trims only trailing `\n`/`\r`, so a two-line `HEAD`
yields `Branch("task/T-1-x\nref: refs/heads/main")` and a trailing TAB
survives, while the module's doc comment claims both shapes are *"matched
as WHOLE shapes"*. Every such string is refused by `lane_task_id` and
lands as `NotALane`, so **no forged LANE is reachable by any of them** —
but they are carried to the board verbatim, and F-04's product is a brief
a human pastes into a shell.

### What the card and the brief got wrong

1. **The card**: `gitdir` does not name the worktree's path (above). The
   executor caught this too; I confirmed it independently against git.
2. **The notes' gate denominators**: BOOT GATE is stated as *"4 of 4"* and
   GRAPH REGEN as *"1 of 4"*. The merge's diff is **9** paths, so they are
   4 of 9 and 1 of 9; the DOCS GATE's 5 are the rest. Both conclusions are
   unchanged and both gates were run.
3. **The dispatch brief**: base `d46f71f` and main-tip figures are stale —
   main is `765362e`, two commits past the `cd79f97` the notes measured
   against. Re-derived at `765362e`: the same 9 paths, and the brief's
   base graph figures (648863 · 126 · 1126 · 1712) reproduce exactly at
   exit 0.
4. **`docs/STATE.md`**: dated 2026-08-24 and opens *"there are NO LIVE
   LANES"*. Five worktrees on `task/` branches and two drill checkouts are
   live right now. Not this card's business; noted because the file names
   itself as the first thing a reader picks up.
5. **The brief's warning about the drill's own `CARGO_TARGET_DIR` is
   live, and I walked into it before the executor's note could warn me**:
   the first `index --check` run inside the drill worktree reported an
   extra indexed file and flipped the header `languages [ts] -> [js, ts]`,
   because `.drilltarget/debug/build/*/out/__global-api-script.js` is not
   `.nputerignore`d. `T-110-s4` names the mechanism; the honest delta
   above was re-derived in a clean worktree with no target directory.

### What a fresh executor owes

`method/roles/verifier.md` sends a rejected card to a FRESH executor.
One change closes it: **drive the four states from a pin inside
`[app-dispatch]`.** The cheapest form is a `join` beside the reader in
`app/src-tauri/src/dispatch/`, with inline bodies reached by the existing
`tests/dispatch_lanes.rs` shim — one body per state, and the
`building`-stamp-with-no-worktree fixture the criterion names by name.
If the architect prefers the join to stay TypeScript, then the card
cannot be built inside its fence as written and that is a DISPATCH
decision, not an executor's: either widen the fence deliberately to reach
`app/test/**`, or re-cut the card. Nothing else in the diff needs to
change — the Rust reader is correct, well pinned, and proved against real
git.

Filed as suggestions, blocking nothing: `T-110-s5` (the two bounds their
own bodies cannot pin), `T-110-s6` (`truncated` and the entry ceiling,
unpinned, and the allocation the comment disclaims), `T-110-s7` (the
un-normalised, possibly relative `worktree_path` and the cwd-dependent
`exists_on_disk`), `T-110-s8` (`parse_head` accepts a multi-line `HEAD`
and a trailing tab while claiming a whole-shape match).

## Implementation notes — THE REBUILD (second executor, after the rejection)

Executor `claude-opus-5 @T-110-rebuild`, a FRESH session that did not
write the build it repaired, lane `task/T-110-lane-reader`, previous tip
`6fea6a1` (the verdict commit), rebuild tips `a54433d` and `0c521d5`.
**APPENDED, never rewritten**: the first pass's notes and the verifier's
verdict above are byte-untouched (T-101's precedent). Understanding was
confirmed in one paragraph before a single file was opened for writing —
written to the session's scratchpad at 23:00:18Z with `git status
--short` EMPTY in this worktree at that moment.

### THE REJECTION IS RIGHT, AND IT REPRODUCES

Re-run before anything was built, in a detached worktree
`drill-T-110-rebuild-pre` at `6fea6a1`, baseline `npm run build` 0 and
`npm test` **940/940** exit 0. Each mutation producer-side, one side
only, read back with `git diff --unified=0` BEFORE its run:

| # | mutation | build | test | verdict |
|---|---|---|---|---|
| R1 | `classify`: swap the `died` / `stampSkipped` arms | 0 | 0, 940/940 | **SURVIVED** |
| R2 | `IN_FLIGHT_STATUSES` → `[]` | 0 | 0, 940/940 | **SURVIVED** |
| R3 | `joinLanes`: `if (rows.has(taskId))` → `if (true)` | 0 | 0, 940/940 | **SURVIVED** |
| R4 | `describeRefusal`: two refusals, one sentence | 0 | 0, 940/940 | **SURVIVED** |

Restoration proved by sha256 after every one:
`5215098ab6125a0dda820e48215b382da855fa58cc089d6643113891db4c5249`
MATCH against both the pre-mutation file and the HEAD blob — the same
`5215098a…` the verdict recorded, independently. **The "zero importers"
claim is confirmed too**: `grep -rn dispatch-store app/src app/test lib
tools` returns three hits and every one is a STRING in a comment or a
declared-path list, not an import.

### WHAT CHANGED — the join is a Rust fact, and the fence was NOT widened

**`app/src-tauri/src/dispatch/join.rs`** (new, 
`app/src-tauri/src/dispatch/**` = C-15's own path) carries
`IN_FLIGHT_STATUSES`, `is_in_flight`, `classify`, `BoardStamp`,
`DispatchState`, `LaneRegistration`, `DispatchRow`, `LaneScanRefusal`
(with `of` and `sentence`), `DispatchJoin`, `join_lanes` and
`count_by_state` — every one of them the same rule the TypeScript file
held, in the only place in this repository where a suite can reach it.
**`app/src-tauri/src/dispatch/fixtures.rs`** (new, `#[cfg(test)]`) holds
`scratch` / `repo` / `repo_with_worktrees_dir` / `register` /
`branch_head`, moved out of `lanes.rs`'s test module so **the join's
bodies drive the REAL reader over the SAME fixture shape** — a join
proved against a hand-built `LaneScan` value would be proved against a
fiction, and two copies of `register` would be two definitions of what
git writes down.

**`app/src/lib/dispatch-store.ts` is now a MIRROR and only a mirror.**
`classify`, `joinLanes`, `isInFlight`, `IN_FLIGHT_STATUSES`,
`countByState` and `describeRefusal` are GONE from it. What remains is
the mirrored types, `DispatchJoinWire` (the wire form, rows as an array)
and `hydrateJoin`, which turns that array into the `ReadonlyMap` ADR-009
requires and decides nothing. **Deleting them rather than leaving them
beside the Rust is the point**: two spellings of one rule with a pin
under only one of them is exactly the divergence this card exists to
remove one layer up. The four refusal SENTENCES travel on the wire from
`LaneScanRefusal::sentence`, so the board renders the one spelling that
has a pin under it — keeping the `switch` in TypeScript is what let R4
survive.

**FOUR THINGS THIS REBUILD DID NOT TOUCH, deliberately**:
`app/src-tauri/src/lib.rs` (still no `pub mod dispatch;` — `app-shell`,
`T-110-s1`), `app/test/**` and `app/vitest.config.ts` (both `app-shell`,
and held by T-123 all night), `docs/architecture/components/` (T-010's,
and it is owed two edits — `T-110-s9`), and the existing
`tests/dispatch_lanes.rs` shim, whose two `#[path]` lines the verifier
ruled legitimate and which now reaches four files instead of two.

### Each acceptance criterion, re-checked at `0c521d5`

1. **One Rust-side reader, no subprocess, no grant — STILL MET, and the
   sweep grew with the module.** `no_subprocess_in_this_module` now
   sweeps `join.rs` and `fixtures.rs` as well as `lanes.rs` and `mod.rs`,
   with a positive control per file (each file's own entry point is
   asserted present, so the sweep cannot pass on an empty string).
   Mutant **D23** — a planted `std::process::Command::new` in `join.rs` —
   reds. `acl_pin.rs` is still a 0-file diff.
2. **Positive shape — STILL MET**, and now bounded on both sides:
   `the_size_bounds_are_pinned_by_literals_rather_than_by_themselves`
   asserts a 255-character branch is ACCEPTED and a 256-character branch
   is `TooLong { len: 256 }`, both literals (D5, D22 red).
3. **ADR-009 on the TS side — MET, and it is now the file's whole job.**
   `hydrateJoin` builds `ReadonlyMap<string, DispatchRow>`; there is no
   plain object literal keyed by file-derived text in the file. The one
   plain object left, `DISPATCH_STATE_KEYS`, is keyed by an AUTHORED
   vocabulary and exists so `satisfies Record<DispatchState, true>` makes
   a state added to the union without a line there a compile error.
   `DispatchRow.lanes` is a LIST, and `two_lanes_carrying_one_task_id_both_survive`
   drives it.
4. **THE DISAGREEMENT IS FIRST-CLASS AND A PIN DRIVES EACH — THE
   REJECTION IS CLOSED.** Thirteen bodies in `join.rs`, all driving
   `read_lanes` over real temp-directory fixtures:
   - `a_building_stamp_with_no_worktree_is_a_lane_that_died` — **THE
     FIXTURE THE CARD NAMES BY NAME.** A repository whose `worktrees/`
     exists and is EMPTY (asserted to be a SUCCESSFUL empty scan, not a
     refusal) plus a card stamped `building` → `Died`; positive control
     registers the lane and the SAME card becomes `Live`.
   - `the_four_states_are_four_different_answers_on_one_fixture` — one
     repository, one board, all four states, asserted as an exact list
     AND asserted to be four DISTINCT values, so a collapse reds.
   - `in_flight_is_exactly_three_statuses_named_as_literals` — the three
     spelled out, nine settled statuses refused (including `Building` and
     `"building "`), `IN_FLIGHT_STATUSES` asserted as a literal array.
   - `a_lane_on_no_card_becomes_its_own_row_rather_than_vanishing` —
     R3's half, with a positive control that the same lane WITH a card
     produces one row rather than two.
   - `every_refusal_has_its_own_sentence_and_no_two_are_equal` and
     `the_refusal_vocabulary_is_total_over_the_scan_and_scanned_is_not_one`
     — R4's half, twice: distinctness kills a COLLAPSE, per-arm
     substrings kill a SWAP, and `Scanned` is asserted to have no refusal.
   - plus `a_row_carries_the_readers_five_lane_fields_and_the_same_json`,
     `a_pruned_but_not_removed_lane_is_still_a_lane_and_says_so_on_the_row`,
     `worktrees_that_are_not_lanes_are_carried_rather_than_dropped`,
     `rows_come_back_sorted_by_task_id_whatever_order_the_board_was_in`,
     `the_counts_seed_every_state_and_tally_the_rows`,
     `a_scan_that_refused_makes_the_join_unavailable_rather_than_all_not_dispatched`
     and `truncation_is_carried_from_the_scan_onto_the_join`.

   **The judgement the first pass disclosed is KEPT and is now
   arguable-with rather than reverse-engineerable**: `IN_FLIGHT_STATUSES`
   is `building | verifying | merging`, because the lane protocol keeps
   the worktree alive past the handoff. A live worktree under a
   `verifying` card is this repository's ordinary state, and scoring it
   `StampSkipped` would make the board cry wolf on its healthiest lane.
   The constant and the body that names all three are one edit apart.
5. **Typed refusals — STILL MET, and now they reach the board.**
   `LaneScanRefusal::of` is total over the four non-`Scanned` arms and
   returns `None` for `Scanned`; D15 (conflating two arms) reds.
6. **A gone path is `exists_on_disk: false` — STILL MET**, and now
   asserted at the JOIN too: a pruned-but-not-removed lane is still a
   lane (`Live` under a `building` stamp) and the row carries the fact
   the directory is gone. D11 and D25 red.
7. **The seven fixture repositories — STILL MET**, and the join adds
   more, all in temp directories. **NOTHING IN THE SUITE READS THIS
   REPOSITORY'S OWN `.git`**; five worktrees were live while this ran.
8. **The write set — STILL MET.** `the_reader_writes_nothing` is
   untouched and green; the diff changes no Rust file outside
   `src/dispatch/**`, so `the_runners_write_set_is_snapshot_silent_and_the_agents_docs_write_is_not`
   in `tests/agent_runner.rs` still passes inside the sweep.

### THE VERIFIER'S FIVE SURVIVORS — four closed, one is the OPERATING SYSTEM

Which I judged IN and which OUT, as the rebuild brief asks:

- **`T-110-s5`'s two bounds: IN, and closed.** Strictly they are not
  criterion 4's business, but `BRANCH_MAX_LEN` is part of criterion 2's
  grammar (its `TooLong` refusal) and `MAX_METADATA_BYTES` part of
  criterion 1's defect vocabulary, and CONVENTIONS makes the shape a
  standing rule rather than a preference. Two literal, two-sided rows
  beside the derived ones — 255 accepted / 256 refused, a 4096-byte HEAD
  read / a 4097-byte HEAD `HeadTooLarge { len: 4097 }`. **D5 and D6 now
  RED.**
- **`T-110-s6`'s entry ceiling and `truncated`: IN, and two of three
  closed.** The `truncated` field is mirrored onto `DispatchJoin` and its
  whole meaning is "this list is a floor" — criterion 5's "never an empty
  list meaning two different things", one layer up. A 4097-entry fixture
  drives it end to end and asserts a list of exactly 4096, with the
  entries kept being the first 4096 BY NAME. **D7, D9 and D21 now RED.**
- **The third is UNREACHABLE ON DARWIN, measured.** s6 asks for a
  fixture "whose entry name is invalid UTF-8". `os.mkdir(b'bad\xff\xfename')`
  fails with **`OSError 92, Illegal byte sequence`** on Darwin 25.6.0 /
  APFS — the filesystem validates the name before the entry exists, so
  the `read_dir` result that arm handles cannot be produced here. **D8
  SURVIVES and is expected to**, and pretending otherwise would be
  worse than saying so. Filed as `T-110-s10` with three ranked
  dispositions.
- **AND s6'S SUGGESTED PRODUCER FIX IS THE WRONG HALF.** It offers
  "bound the collection as it is built ... or correct the comment". The
  first would break a property the suite already pins: `read_lanes`
  collects, SORTS, then truncates, so the entries kept are the first 4096
  by NAME; truncating as names arrive keeps whichever 4096 `read_dir`
  handed back first, which is filesystem order.
  `entries_come_back_sorted_by_name_whatever_the_filesystem_says` is the
  body that would have to be deleted to take that trade. The comment was
  corrected instead, and now says what the ceiling actually bounds (the
  two file reads per entry) and why the obvious repair is refused.
- `T-110-s7` and `T-110-s8` are **OUT**: neither is an acceptance
  criterion, both are hardening on paths the criteria do not name, and
  taking them would be annexing scope. They stand as filed.

### THE DRILL — 28 mutants at `0c521d5`, 25 RED, 3 survivors and every one accounted for

Detached worktree **`drill-T-110-rebuild`** with its own
`CARGO_TARGET_DIR` INSIDE it (arm (c)); driver
**`drill-T-110-rebuild-driver.sh`**, batch
**`drill-T-110-rebuild-run.sh`**, results
**`drill-T-110-rebuild-results.txt`** — **every artefact named per-lane,
not only the worktree** (T-088-s3, whose fifth data point is that naming
only the directory let a sibling overwrite THIS lane's driver). Baseline
`cargo test --test dispatch_lanes` **31/31 exit 0**. Every mutation
producer-side and one side only, applied by a driver that refuses any
path outside the drill and requires a match count of exactly **1**, read
back with `git diff --unified=0` BEFORE its suite ran, restored with
`git checkout --` and proved by sha256 against **both** the pre-mutation
file and the drill's own HEAD blob — 28 times, all MATCH.

**RED (25):** D1 the `died`/`stampSkipped` swap · D2a `is_in_flight`
always false · D2b the constant loses `building` · D3 the no-card half
short-circuited · D4 two refusals one sentence · D5 `BRANCH_MAX_LEN`
255→256 · D6 `MAX_METADATA_BYTES` 4096→40960 · D7 the truncation block
deleted · D9 `truncated: false` hardcoded · D10 `live` becomes `died` ·
D11 `exists_on_disk` pinned true in the conversion · D12 the row drops
its card · D13 the row sort deleted · D14 `count_by_state` stops seeding
· D15 two scan arms conflated · D16 the wire sentence stops coming from
the refusal · D17 the row's lane serialized under a different tag · D18
the board half stops seeing lanes · D19 non-lane worktrees dropped · D20
the entry-name sort deleted · D21 `MAX_WORKTREE_ENTRIES` 4096→4095 · D22
the branch bound off by one · D23 a subprocess in `join.rs` · D24 the
`parent()` climb dropped · D25 `exists_on_disk` pinned true in the reader
· D26 a not-a-lane reported as detached. **All at exit 101, all still
COMPILING** — a mutant that fails to build proves nothing.

**SURVIVED (3), and none is unexplained:** D10b and D26b are **no-op
CONTROLS**, one per producer file, which MUST stay green or the driver is
reporting red for everything; D8 is the Darwin-unreachable arm above.

**THE DRILL FOUND A DEFECT IN THE REBUILD'S OWN BODY, and it is the
best thing it did.** At `a54433d`, **D12** — `card: Some(card.clone())`
→ `card: None` — **SURVIVED**. `a_lane_on_no_card_becomes_its_own_row_rather_than_vanishing`
asserted `card == None` for the orphan row and NOTHING asserted the other
direction, so every row on the board could have lost its card in
silence. That is CONVENTIONS' *"a negative assertion needs a positive
control"* failing inside the body written to honour it. Fixed at
`0c521d5`, where D12 reds; the fix is its own commit so the sequence is
readable.

**D27, THE TS HALF, MEASURED RATHER THAN INFERRED AND IT STILL
SURVIVES.** `hydrateJoin`'s `rows.set(row.taskId, row)` → drop every
`notDispatched` row: `npm run build` **0**, `npm test` **0, 940/940**.
Nothing imports the file, so nothing can. **This is `T-110-s3`'s
remaining content and it is smaller than it was**: the file now holds no
DECISION — every state on every row was decided by `join.rs` and is
carried across verbatim — so what an unpinned mutation can still do is
lose rows in transit, not misname a state. Reported rather than hidden.

### Suites and gates, every exit read from `$?` UNPIPED, at `0c521d5`

- **cargo `test --no-fail-fast`: 414 passed / 0 failed / 3 ignored, exit
  0**, summed programmatically over **SIXTEEN** `test result:` lines,
  **zero warnings**. The arithmetic closes: the rejected tip's 399 plus
  this rebuild's 15 new bodies (31 in `dispatch_lanes` against 16) = 414.
- **app: `npm run build` exit 0, `npm test` 940/940 across 46 files, exit
  0.** **THE BUNDLE HASHES STILL DO NOT MOVE** — `index-C86RloYb.css` /
  45.06 kB and `index-DEkJr3K8.js` / 526.42 kB, byte-identical to main's:
  nothing imports the store, so `tsc` typechecks it in both programs and
  vite tree-shakes it out.
- **parser: 263/263 across 12 files, exit 0.**
- **E2E: 143/143, exit 0** on scratch port **15041**; `npm run typecheck`
  **0**.
- **THE MERGE'S DIFF IS 17 PATHS**, derived the prescribed way at BOTH
  main tips this lane saw: `TREE=$(git merge-tree --write-tree <main>
  HEAD)` with `$?` read FIRST (**0** both times), then `git diff
  --name-only <main> "$TREE"`. 17 at `e27673d` and 17 at `d64c673`; the
  forbidden two-dot form reads **37** and then **68**. Main advanced 51
  paths between the two and `comm -12` against the lane's 17 is EMPTY.
- **BOOT GATE — FIRES, 6 of 17** (`fixtures.rs`, `join.rs`, `lanes.rs`,
  `mod.rs`, `tests/dispatch_lanes.rs`, `dispatch-store.ts`). **RUN, exit
  0** on scratch port **15040**: `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-110` and `[nputer] window "main"
  created`.
- **GRAPH REGEN — FIRES, 1 of 17** (`dispatch-store.ts` — the `.rs`
  files do not match the trigger's four extensions). ASKED rather than
  predicted; see below, because the answer changed under this lane.
- **DOCS GATE — FIRES, exit 1, 11 of 17**, invoked DIRECTLY with
  ROOT-RELATIVE arguments and never through `xargs`. **Three suites
  owed** (app, tools/e2e, lib/parser), all three run and green above. 12
  derived readers across 4 suites, **0 frontmatter issues**, census 119
  docs-shaped sites in 22 files with 12 in 10 files resolving into
  `docs/`, 25 files holding the repository root (11 derived, 0 unlinked,
  14 with no linkable site), 1 package-relative site derived, ledger at 6
  entries. Every live card parses with a legal status.

### T-010 LANDED MID-LANE AND IT CHANGES THE REGEN ANSWER COMPLETELY

Main moved **`e27673d` → `d64c673`** while this rebuild ran, and
`d64c673` is *"Merge T-010: the indexer collects Rust"*. **The forecast
in the notes above is now wrong in every figure, and so was mine an hour
earlier.** Re-derived by building the merge `git merge-tree` predicts
(tree **`b0efae0`**) in a throwaway worktree and confirming the real
merge's `HEAD^{tree}` is byte-identical, with `CARGO_TARGET_DIR` placed
OUTSIDE the worktree so `T-110-s4`'s phantom cannot apply:

| tree | committed | fresh index |
|---|---|---|
| `d64c673` (main alone) | 648886 B · 126 f · 1126 s · 1712 e | 890866 B · **172** f · 1874 s · 1842 e |
| the merge `b0efae0` | 648886 B · 126 f · 1126 s · 1712 e | 913381 B · **178** f · 1936 s · 1871 e |

**MAIN IS ALREADY STALE BY +46 FILES ON ITS OWN** — T-010's merge landed
without its checkpoint regen — so most of the movement at this merge is
not this lane's. **This lane's own contribution is +6 files, +62 symbols,
+29 edges**, and the six are named rather than counted:
`dispatch/fixtures.rs`, `dispatch/join.rs`, `dispatch/lanes.rs`,
`dispatch/mod.rs`, **`tests/dispatch_lanes.rs`** and
`app/src/lib/dispatch-store.ts`. All five `.rs` files are indexed now;
none was before.

**THE FIXTURE MOVEMENT, MEASURED ON BOTH SIDES SO THE LANE'S SHARE IS
SEPARABLE** (graph regenerated, `npm run build` run first so the
build-freshness bodies are not counted as regen movement):

| tree, regenerated | app suite |
|---|---|
| `d64c673` alone | **9 failed / 931 passed**, 2 files |
| the merge `b0efae0` | **11 failed / 929 passed**, 2 files |

**THE LANE'S DELTA IS TWO ASSERTIONS, NOT FIVE** — the verdict's figure
was correct against the old indexer and is now superseded:

1. `architecture-dogfood.test.ts` → *"C-15 is DECLARED-ONLY"*: C-15's
   `files` goes `[]` → **five** entries (the four `src/dispatch/*.rs`
   plus the store), `declaredOnly` false, `D3:C-15` clears.
2. `map-dogfood-render.test.tsx` → *"renders all twelve declared
   components in full mode, **no unmapped bucket**, no banner"*:
   **13 nodes, expected 12.**

**AND THE THIRTEENTH NODE IS THIS LANE'S TEST SHIM.** Derived rather
than guessed: 178 indexed files against 48 component globs leaves
**exactly one unmapped file, `app/src-tauri/tests/dispatch_lanes.rs`**.
T-010 settled every other previously-unclaimed Rust file by NAME —
`C-14` gained `src/bin/fake_agent.rs` and `tests/agent_runner.rs`, `C-05`
gained `acl_pin.rs`, `churn.rs` and `index_cmd.rs`, each commented
`# T-010 settlement` — and could not settle this one because it did not
exist on main. **The verifier's ruling that the shim is legitimate and
the fence was not widened still stands**; what changed is its
consequence, and that consequence is a one-line `paths:` entry in a file
this fence cannot reach. Routed as `T-110-s9`, which also carries the
prose edit. **If `T-110-s1` lands first the entry is unnecessary, because
the commit that writes `pub mod dispatch;` DELETES the shim.**

`lib/parser` at the merge with the regenerated graph is **264/264 exit
0** — main gained a body; the parser pin does not move for a regen, which
is CONVENTIONS' three-fixture rule behaving exactly as written.

### WHERE THE BRIEF, THE CARD AND THE VERDICT WERE WRONG

1. **The brief's main tip and baselines are stale, twice over.** It names
   base `d46f71f` and baselines cargo 399/0/3, app 940/940, parser
   263/263, e2e 143/143 — all correct at `6fea6a1` and re-derived here.
   But main was `e27673d` when this session began and `d64c673` when it
   ended, and **T-010's Rust extraction — which the brief flagged as
   "under verification and may land first" — LANDED**, which changes the
   graph figures, the indexed-file set and the fixture movement entirely.
   The brief was right to warn; the warning fired.
2. **The verdict's fixture-movement figure is superseded, not wrong.**
   *"FIVE assertions in TWO files, `1 failed | 44 passed` → 935/940"* is
   what I measured too against the OLD indexer at `a54433d` — except
   that **two** test files fail, not one (2 + 44 = 46 files; 1 + 44 = 45,
   which is not the file count). Against `d64c673` the lane's delta is
   **two** assertions.
3. **The verdict's own drill misses a survivor that its successor
   found.** D12 (`card: Some(card.clone())` → `card: None`) survives at
   `6fea6a1` too — the TS `joinLanes` had the identical asymmetry. It is
   not a criticism of a 22-mutant drill; it is the argument for drilling
   the same producer twice from different hands.
4. **`T-110-s6`'s suggested producer fix would trade determinism for the
   bound** (above), and one of its three mutants cannot be redded on this
   platform at all. Both filed as `T-110-s10`.
5. **The card's problem statement is still wrong about `gitdir`** and
   both earlier passes said so; recorded a third time only because the
   card is the spec and has not been corrected.
6. **`docs/STATE.md` is still dated 2026-08-24 and still opens "there are
   NO LIVE LANES"** while four task worktrees and a sibling drill are
   live. The verifier said this; it is still true. Not this card's
   business — noted because STATE names itself as the first thing a
   reader picks up.

### For the second verifier

- **The one thing to attack first**: whether moving the join out of
  TypeScript was an executor's call. My argument is that
  `docs/design/dispatch-technical-plan.md`'s D2 rules only that C-15 is
  declared with its two paths and never rules which half joins — I read
  it to check — and that the C-15 component file's "the TS half ... joins
  it against the board" is descriptive prose written by T-088 before this
  card was built. If that reads as a ruling rather than a description,
  the fix is not to move the code back (the pin would vanish again) but
  to widen the fence deliberately, which is a DISPATCH decision.
- The four rejection mutants are D1–D4 in
  `drill-T-110-rebuild-run.sh`; re-run them.
- **Nothing pins the Rust vocabulary equal to the TS mirror across the
  language boundary** — still `T-110-s3` arm 5. What the rebuild DID
  close is the Rust-internal half: `LaneRegistration` and
  `WorktreeEntry::Lane` are held equal by serializing both, and D17 reds.
- `T-110-s3`'s arms 1–4 are now BUILT, in Rust rather than in vitest.
  Arm 5 stands. `T-110-s1` is unchanged and now has a second argument
  behind it (the unmapped bucket, above).
- **Live-environment facts, read at 2026-08-24/25 on this host, never
  off a commit**: port 1420 read with `lsof -nP -iTCP:1420 -sTCP:LISTEN`
  and nothing else, before and after — holder `node` pid **82549**, one
  socket `TCP [::1]:1420 (LISTEN)`, identical throughout; no bind, no
  connect, no signal. Scratch ports **15040** (boot gate) and **15041**
  (e2e) were `lsof`-read first (zero rows) then bind-confirmed free on
  `127.0.0.1`, `0.0.0.0`, `::1` and `::` before use and again after. **No
  `pkill` at any point.** No sibling worktree touched, and the untracked
  `z` in the main checkout left alone. Three throwaway worktrees were
  created and all three removed and pruned
  (`drill-T-110-rebuild-pre`, `drill-T-110-rebuild`,
  `forecast-T-110-rebuild`); their symlinks were UNLINKED rather than
  deleted, with all three targets verified present afterwards.
