---
id: C-15
name: Dispatch
layer: app
paths:
  - app/src-tauri/src/dispatch/**
  - app/src/lib/dispatch-store.ts
  - app/src-tauri/tests/dispatch_lanes.rs   # T-033 settlement, see below
depends_on: [C-10]
decisions: [ADR-009, ADR-012, ADR-017]
status: auto
touch_slugs: [app-dispatch]
---
The dispatch surface (F-04), declared before it is a directory. A lane
is a fact git already wrote down — `<repo>/.git/worktrees/*/gitdir` and
`*/HEAD` — so the Rust half READS those files and runs no subprocess,
and the TS half mirrors the typed lane list and joins it against the
board. The join's PRODUCT is the disagreement: a `building` stamp with
no worktree is a lane that died, a worktree with no stamp is a dispatch
that skipped it. Data for the board half arrives on C-10's existing
docs path — no new watcher and no second source of truth. Follower
first (`docs/rooms/cockpit-or-mirror.md`, ruled 2026-08-20): the brief
is assembled for a HUMAN to paste into whatever agent they already
have, which covers agents that exist only as desktop apps and can never
be spawned; the spawn path follows and is not this component's promise
yet. Zero webview grants — the reader is Rust-side (ADR-012) — and
every collection keyed by a branch name, worktree name or task id is a
Map or a null-prototype object, because those are strings this project
does not author (ADR-009).

**WHY THIS IS DECLARED AND C-02/C-03/C-04 ARE NOT.** A component file
may only be written where a doc has DECIDED where the code will live.
`docs/design/dispatch-technical-plan.md`'s D2 decided this one — the
two paths above are that ruling, not a guess — which is the same
footing C-07 was declared on before its binary existed. The CLI, the
runtime and the daemon have no such ruling: no doc says where their
code goes, so any `paths` glob for them would be INVENTED, and
T-008-s1's re-park stands until one does. The fence word comes first
because without it every dispatch card inherits `app-agent` and
serialises against every genesis card for the life of the feature, for
no reason but a missing declaration.

**`tests/dispatch_lanes.rs` IS CLAIMED HERE, AND THE SETTLEMENT IS
DISCLOSED RATHER THAN SLIPPED IN (T-033).** T-110 wrote that file as the
compile-and-test entry point for `src/dispatch/**` — Rust compiles no
file no module declares, so `cargo test` could not reach this component's
code without it — and said in the file's own header that it sat outside
`[app-dispatch]` and belonged to nobody. When T-110 merged, it became
**this repository's first D2 finding**: one file claimed by no component.
It is settled here by the rule T-010 already used for
`tests/agent_runner.rs`: *a component's test double and its suite belong
to the component they exercise*. **This was NOT covered by T-033's
rulings**, which were made at main `dce93b0` — seven hours before T-110
merged, when neither this file nor this component's five source files
existed — so the settlement is the lane's, argued by precedent rather
than ruled, and `T-033-s8` carries it for the architect to confirm or
reverse in one line.
