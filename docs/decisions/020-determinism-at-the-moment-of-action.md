# ADR-020: determinism at the moment of action, and a method that measures itself

Status: ratified. Date: 2026-08-29. Decider: @human ("Lets build in and
solidify the learnings from this article into the nputer method").
Provenance: a full-text review of Anthropic's "The AI-Native SDLC
Playbook" (claude.com/blog/the-ai-native-sdlc-playbook) compared
against this method, 2026-08-29. The comparison's essentials are
recorded here because the chat is not the record.

## The comparison, in one paragraph each way

**Where nputer is already ahead, and stays the course**: truth
maintenance (the playbook's artifacts are write-once prose with no
keepers; ADR-019's tiers, currency checks and budget gates are a layer
it lacks); verification depth (its feedback loop is "tests pass"; our
verifier seat drills, mutates and rejects); fence mathematics (it
splits parallel work by eyeball; we compute disjointness over expanded
paths with a three-valued verdict); the program-assembled brief
against its hand-interviewed plan.md; model-agnostic follower-first
design against its single-vendor tooling; and byte-pinned method
versioning against its review-like-code skills. None of these move.

**Where the playbook is ahead, adopted below**: it enforces policy
DETERMINISTICALLY AT THE MOMENT OF ACTION (hooks that block the write
before it happens) where our fences are protocol enforced after the
fact; it regression-tests the AGENT CONFIGURATION itself (evals gating
config changes) where our method files are byte-pinned but never
tested for effect; and it closes the maintenance loop with CONTROL
BANDS (deterministic detector, tiered response, findings re-entering
the pipeline) where we apply the same idea by hand.

## Decisions

1. **Determinism at the moment of action.** A lane's fence SHALL be
   enforceable at the tool-call layer: a hook that derives the card
   from the lane's own branch, expands its fence through the one
   implementation (`fence.ts`), and BLOCKS an out-of-fence write with
   the reason and the route. Three logged incidents motivate it —
   `db4c903` (an architect edit inside a held fence), T-126's breach
   ("ratified by necessity, not precedent"), and the architect's own
   2026-08-29 report ("I edited a file a live lane held"). The same
   layer carries loop-protection (graph writes outside checkpoints;
   test-file edits in fix lanes). Card: `T-154`. Honest limit stated
   there rather than hidden: Bash-mediated writes stay
   protocol-covered in v1.
2. **The method measures itself.** An eval suite of canned tasks with
   derived acceptance checks SHALL regression-test the method files —
   roles, protocols, brief assembly — and a method version bump SHALL
   gate on it, exactly as a code change gates on suites. This is
   `T-093-s1`'s class ("the hand rules have no mechanical reader")
   given the playbook's mechanism. Card: `T-155`.
3. **The method watches its own health.** The control-band pattern
   applies to the numbers our standing hazards already name by hand:
   the lib-suite duration cliff (9.5s/14.6s — a control band applied
   by eyeball since T-088-s4), graph budget headroom, doc budgets,
   suite durations. A deterministic detector with tiered responses —
   log, diagnose, FILE A CARD — closes the loop the way our findings
   already re-enter the board. F-06's premise ("drift as a
   first-class signal") applied to the method itself. Card: `T-156`.
4. **Approval gates are deliberate, not accidental.** The
   merge-into-main human gate exists today as a permission-classifier
   accident that T-145's denial discovered and everyone honored. It is
   now DESIGN: documented in CONVENTIONS in this commit, with the
   T-145 executor's own sentence as the rule — a coordinator's
   authorization is not the permission system's consent.
5. **Checkpoints carry metrics.** The checkpoint record template gains
   a leading/lagging metrics slot (rework cycles, first-pass rates,
   dispatch-to-merge time) so trends are derivable instead of
   anecdotal — the architect's report computed 1.2M tokens per
   rejection by hand; the slot makes the next such number cheap.
6. **Org-scale by construction, not by machinery.** @human intends
   org-scale later; the rule NOW is that nothing may preclude it, and
   nothing org-shaped is built before a second team exists. Named for
   the future: hooks come in TWO TIERS (project hooks, repo-versioned
   and team-owned — built first; managed hooks, org-controlled and
   non-overridable — a slot, not an implementation); the method's
   seats are role-shaped and may be held by different humans or teams
   (a policy-owner seat is a future TASK-FORMAT extension, not taken
   now); the kit is the distribution unit and becomes a plugin when a
   second team exists; REVIEW-policy-per-repo is already our verifier
   role file and needs no second artifact.

## Not adopted, with reasons

The playbook's org machinery (policy owners, platform engineers,
managed settings, per-environment autonomy tiers) answers questions a
one-human project does not have — decision 6 keeps the door open
without paying for it now. Its Stage-1 "any employee originates
intent" is our genesis interview plus rooms, already stronger for our
shape. Its PR-review-loop practice is our verifier seat; adopting its
weaker form would be a regression.

## Supersedes / amends

Amends nothing. Extends ADR-019's trajectory — rituals that slip
become keepers — one layer earlier, to the moment of the write.
