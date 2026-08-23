---
id: T-110
title: A lane is a fact on disk, and the app reads it there — git's own files, no subprocess
feature: F-04
milestone: 4
priority: 3
size: M
status: planned
blocked_by: [T-088]
touches: [app-dispatch]
builder:
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
