---
id: T-089
title: The dispatch brief is a written artifact, not a habit — and the lane protocol joins the method
feature: F-04
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

F-04's T-023: the one artifact that actually moves work — the brief a
fresh executor is handed — has no format anywhere. `grep -rn "dispatch
prompt" method/` returns nothing; STATE refers to "the brief" as an
existing thing; roughly ninety cards have been dispatched with it.
Under the follower-first ruling (rooms/cockpit-or-mirror.md) this
contract IS the product's first dispatch feature: T-090+'s assembler
transcribes it, and a human pasting into ANY agent — CLI or app — uses
it directly.

THREE THINGS IN THE METHOD ARE MISSING OR WRONG, with the record
corrected since the decomposition pass first drafted this card:

**(a) The dispatch stamp lapsed, and the method never says who stamps.**
`TASK-FORMAT.md:97` says "Fields lock at dispatch (status: building)".
That was PRACTICED — 87 commits moved `status: building` on main, 25 of
them explicit `Dispatch T-NNN` stamps — and the practice lapsed after
T-042 (2026-08-17) without any rule noticing. Measured, not argued
(the earlier claim that `building` was never used came from grepping
the current tree, which cannot see a transient state): stamping BEFORE
the branch is cut merges clean; stamping after the lane exists
conflicts on that line at every merge. So TASK-FORMAT's sentence is
the constraint that makes the field safe, and the gap is that no role
file owns the stamp.

**(b) The method says rebase; the pipeline merges.** `integrator.md:5`
reads "Rebase the task branch onto latest main." Every merge in this
history is `git merge --no-ff` plus a separate `Checkpoint:` commit,
and the two-commit split is load-bearing — measured again at T-077,
where the regen ran TWICE because reconciling fixtures staled the graph
the merge had just refreshed.

**(c) The lane protocol exists only in this project's CONVENTIONS.**
Worktree naming, branch naming, DISPATCH FROM THE LAST CHECKPOINT, and
now THE RANGE RULE live in `docs/CONVENTIONS.md`, which is
nputer-specific and cannot ride the kit. The generic halves belong in
`method/`; the project-specific spellings stay here and are READ.

## Acceptance criteria

- THE method SHALL gain a **dispatch brief contract** in
  `method/roles/executor.md`, as a normative table a program can
  transcribe: each row one component of the brief and its source — the
  role file, the card, the docs a fresh session reads, the gate
  commands from the project's own CONVENTIONS, the `touches` fence,
  the standing drills. IF the contract would hand the executor
  anything the verifier is later forbidden to see THEN the conflict is
  recorded and routed to the verifier-blindness card, never resolved
  silently.
- THE method SHALL gain a **lane protocol**: one task, one branch, one
  worktree; the branch cut from the newest checkpoint on the
  integration branch, never a merge commit; the worktree a sibling
  directory; the executor never touches the integration branch; the
  integrator removes the worktree. Project spellings named as the
  project's, not baked in.
- **THE STAMP SHALL GET AN OWNER, in writing**: who sets
  `status: building`, where the write lands (the integration branch,
  before the cut — the measured safe order), and what a reader may
  conclude from its absence. IF the ruling is that the stamp is
  restored THEN the architect's own lapse (T-042 → present) SHALL be
  named as the motivating instance.
- **`integrator.md` SHALL describe the merge that happens**: no-ff
  merge plus separate checkpoint, the reason for the split (the
  twice-run regen at T-077 is the measured example), and THE RANGE
  RULE referenced rather than restated.
- THE method version SHALL be bumped and the bump noted in
  CONVENTIONS' method-version line; `kit.rs`'s stamp test SHALL be run
  and its exit stated (it reads this file on every cargo test).
- WHEN the contract is used to hand-assemble a brief for one real
  planned card THE result SHALL pass the dispatchability test in
  writing — a fresh session with no other context could build the
  right thing — and the assembled brief SHALL be attached to the notes
  as evidence.

Verification: headless — the method-file cross-checks, kit.rs's stamp
test, workflow-parity, and the parser suite; the DOCS GATE on every
touched docs path with its owed suites run. The hand-assembled brief's
quality is @human, listed explicitly. FENCE NOTE: cannot run beside
T-052 or T-087 (both reach method/ or CONVENTIONS).
