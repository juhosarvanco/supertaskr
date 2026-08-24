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
