---
id: T-104-s1
title: The method version is CLAIMED in two documents outside T-104's fence, and both went stale at the v0.1.6 bump
status: suggested
suggested_by: executor claude-opus-5 @T-104
---

T-104 bumped the method snapshot to **v0.1.6** in the three places
`cargo test` pins — `docs/CONVENTIONS.md`'s first gotcha,
`method/interview/plan-interview.md`'s Output heading, and
`METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs`. Two more
documents **claim the current method version** and no test reads either,
so both are now stale and green:

- **`docs/ARCHITECTURE.md`**, the C-01 row: `built (v0.1.5)`
- **`docs/architecture/components/C-01-method.md`**, the `status:` line's
  trailing comment: `# pinned: built and versioned (v0.1.5); no task slug
  maps here`

Both are OUTSIDE `touches: [method/, docs/CONVENTIONS.md, app-agent]`, so
the lane did not edit them — a fence is not widened from inside the lane
it fences (lane-protocol rule 5). **The fix is two string edits** and
wants a fence of `[docs/architecture/components/]` plus
`docs/ARCHITECTURE.md`; it is small enough to ride any card already
holding those, and the C-01 row is the kind of signpost an integrator
already corrects in place at a checkpoint (the T-101 precedent
ARCHITECTURE's own slug block cites).

## WHAT IS DELIBERATELY *NOT* OWED HERE, BECAUSE THE DISTINCTION IS THE POINT

`git grep -n "0\.1\.5"` also returns **eleven `methodVersion: "0.1.5"`
literals** across five `app/test/**` files and
`tools/e2e/tests/shell-harness.ts`, plus a `(v0.1.5, T-023)` citation in
`app/src/genesis/genesis-derive.ts`.

> **INTEGRATOR, at the merge `f309405`: the count above read "twelve" as
> filed and is ELEVEN.** Enumerated rather than grepped for a count —
> `agent-store` 1, `crescendo-dom` 1, `interview-chat-dom` 1,
> `interview-harness` 2, `interview-resume-dom` 5, `shell-harness.ts` 1.
> **The five-file list is exactly right; only the tally was wrong.** Two
> further lines are `expect(…).toBe("0.1.5")` assertions, so the honest
> alternative reading is 13, and 12 is neither. **This finding rides
> beside a CONVENTIONS bullet this same card rewrote to say DERIVE THE
> LIST, NEVER QUOTE IT** — which is why the tally is corrected in place
> instead of being left as history: the number is the finding's evidence,
> not its narrative. **These are FIXTURES and citations,
not version claims, and they should NOT be bumped.** Each fixture builds
its own status payload and asserts its own literal back; none compares
against the Rust const, and all of them are green at v0.1.6 (`app` 962/962,
`tools/e2e` green, verified at `aea8b9e`). Bumping them would be churn
that teaches the next reader the wrong lesson.

**That two-way split is why `docs/CONVENTIONS.md`'s first gotcha no longer
states a tally.** It said *"the bump is a FOUR-PLACE FACT, THREE PINNED AND
ONE NOT"*, and derived at `fbae94a` it is not four — it is three pinned
plus an open set that divides into claims and fixtures. The bullet now
states the SHAPE and prints the derivation command instead, per the file's
own "CITE THE SHAPE, NOT THE TALLY" rule. **This card is the residual that
the shape cannot fix by itself**: naming the two stale claims still
requires somebody to hold their fence.

## DISCHARGED AT T-104's CHECKPOINT — `status:` DELIBERATELY UNCHANGED

`closed_by:` the T-104 checkpoint, the direct child of merge **`f309405`**
on `main`. **Both stale claims are repaired there**, by the integrator,
in the checkpoint commit and not in the merge:

- `docs/ARCHITECTURE.md`, the C-01 row — `built (v0.1.5)` → `built (v0.1.6)`
- `docs/architecture/components/C-01-method.md:9` — the `status:` line's
  trailing comment, same one-token move

**Both were re-derived at the merge before being touched, not taken on
this file's report.** The licence is not a widened fence — it is that
**this merge is what makes both sentences false.** They were TRUE on main
at `212543c` and false at `f309405`; the integrator's standing rule is
*repair what the merge INTRODUCES, file what the merge merely REVEALS*,
and these are the clearest instance of the first half this project has
recorded. The C-01 row is also `integrator.md` rule 3's own checkpoint
item (*"ARCHITECTURE.md — update component status"*), so it is inside the
ritual rather than beside it.

**The `status: suggested` above is deliberate and is `T-083`'s ruling
applied**: disposition belongs to TRIAGE, never to an integrator, so a
discharged finding records the discharge in its own body and keeps its
status. **This card's own ruling ONE is the reason** — *"resolved by other
work" is not a fourth move and `closed` is not a ninth status* — which
makes this the first discharge recorded under a rule the same merge
landed.

**WHAT REMAINS OPEN HERE IS THE SECOND HALF, AND IT IS NOT A DEFECT.** The
eleven `methodVersion` fixtures and the `genesis-derive.ts` citation are
still `"0.1.5"` and SHOULD BE — that is this file's whole argument and it
survives the discharge intact.
