---
id: T-265-s4
title: "The method version pin matches its two live stamps with `contains(\"(v{VERSION}\")`, and the two-digit patch v0.1.10 landed at T-265 makes that prefix ambiguous — a const of `0.1.1` passes against a stamp of `(v0.1.10`"
feature: F-01
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2), at T-265's bench, 2026-09-08 — found while running the C3.2 positive control the card's criterion 3 owes"
blocked_by: []
touches: [app/src-tauri/src/agent/kit.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

`snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs` holds `METHOD_SNAPSHOT_VERSION` against
its two live stamps with a SUBSTRING test:

    output_heading.contains(&format!("(v{METHOD_SNAPSHOT_VERSION}"))
    version_bump_clause.contains(&format!("currently v{METHOD_SNAPSHOT_VERSION}"))

**The body is correct at the version T-265 landed** — the verifier drilled
all three of its arms and each reds with its own message (const moved
alone; `plan-interview.md`'s Output heading moved alone; CONVENTIONS'
first gotcha moved alone), so nothing here is broken today.

**What changed is that the patch number now has two digits.** Until
`v0.1.10` every version string was the same length, and a prefix match
and an equality match could not disagree. They can now: a const of
`0.1.1` satisfies `contains("(v0.1.1")` against a heading stamping
`(v0.1.10`, and the pin passes over a real disagreement. The direction
that matters is a ROLLBACK or a hand-typed const — the case the pin
exists for.

**Demonstrated, not argued.** In a detached scratch worktree at
`3589e0f`, the assertions were loosened to a literal `(v0.1.` /
`currently v0.1.` prefix and the const moved to a wrong value in the
same edit; the body returned **exit 0** — it passed over a const that
disagreed with both stamps. Restored, and the restoration proved by
`shasum -a 256` equal to the commit's. That is the shape the ambiguity
opens, reached today only through a shorter const rather than a shorter
assertion.

## Acceptance criteria

- WHEN the pin compares the const with a live stamp THE comparison SHALL
  be delimited so that one version string cannot be a prefix of another
  — the stamp's closing delimiter included in the needle, or the version
  parsed and compared field by field.
- WHEN a const of `0.1.1` is held against a stamp of `(v0.1.10` THE body
  SHALL red, and that case SHALL be the mutant that proves it: planted,
  seen failing, restored by `shasum -a 256` (verifier.md 2b).
- The three existing arms SHALL keep their distinct failure messages —
  the const, `plan-interview.md`'s Output heading and
  `docs/CONVENTIONS.md`'s first gotcha each name their own site today,
  and a reader of a red should still learn which one moved.
- IF another body anywhere holds a version string by substring THEN it
  moves in the same commit; derive that set at your own ref rather than
  trusting this sentence.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
