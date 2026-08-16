---
title: The genesis screen says "nothing written yet" over a docs/ that already holds files — the switch carries no snapshot
status: suggested
suggested_by: verifier claude-opus-5 @T-026
---

`apply_genesis_folder` (app/src-tauri/src/docs_watch.rs) gates on
`PlanProbe::has_plan()`, not on "has no docs/". That is right — it is
criterion 5's predicate verbatim — but it makes a folder with a plain
`docs/` that holds NO plan genesis-eligible: `docs/ARCHITECTURE.md`
alone, a `docs/decisions/` tree, any repo whose docs/ predates nputer.
T-026's own cargo test declares exactly that shape eligible ("an empty
docs/ is not a plan (nor is ARCHITECTURE.md alone) — both are
genesis-eligible states").

For that shape `arm_genesis` delegates to `rearm`, which sets
`target.last` to the tree it just collected and does not emit. The
command then returns `PickOutcome::Genesis { project_dir, seq, probe }`
— with no snapshot, because the shape has none — and the frontend's
`reducePickOutcome` resets the docs model to empty and stamps it with
the switch seq. Nothing then emits until the first fs event under the
new root, so the genesis screen renders:

    docs/ · nothing written yet
    An empty folder is an invitation.

...over a docs/ that is not empty, two clicks after the "No plan in
&lt;folder&gt;" card truthfully showed `✓ docs/ARCHITECTURE.md`. It
self-heals on the first write (the watch IS live and the next emit
carries the whole tree), so during a real interview the window is
short; with T-027 unbuilt, nothing writes and the claim stands
indefinitely.

Reproduced both halves (verifier, 2026-08-16, reverted):
- Rust: a folder with `docs/ARCHITECTURE.md` + `docs/decisions/001-x.md`
  → `Genesis (probe { architecture: true, .. })`, then **no emit at all**
  in a 1.2s window after `settle()`; a subsequent real edit emits 2
  files, proving the watch was armed the whole time.
- Frontend: after a `genesis` outcome the real App renders
  `data-genesis-files="0"` and `docs/ · nothing written yet`.

This also blunts the T-024 seam this task documents: `GenesisScreen`
hands T-024's lens the live `DocsModelState`, and for this folder shape
that model is empty when the pane mounts — so the lens has nothing to
derive from until something changes.

Two candidate fixes, both small; the point is to decide, not to
hot-patch:
(a) let the genesis switch carry a snapshot when one exists — return
    `PickOutcome::Picked`-style docs alongside `Genesis` (or have
    `arm_genesis`'s `rearm` delegation report the collected tree so the
    command can build one), which is the honest answer and costs one
    `build_snapshot` call on a path that already collected the tree; or
(b) make the screen's line conditional on knowing — render nothing
    rather than "nothing written yet" until a snapshot has actually
    arrived, so the placeholder never claims a measurement it does not
    have (the ○/✓ discipline this same task applied to the checklist).

Related in kind: T-026-s5 (the mirror direction on the batch seam), and
T-018-s4 itself, which this task folded in — the same failure mode, one
screen over.
