---
id: T-033-s1
title: T-033 was dispatched without the three decisions its own card says must be recorded before dispatch
status: parked
suggested_by: executor claude-opus-5 @T-033
---

T-033's card opens with *"Decisions at dispatch (ADR-004 — the registry
is the architect's pen; record the picks in this file's plan section
before dispatch)"* and then enumerates three of them: (1) the umbrella
shared-primitive/test-edge story, (2) the non-code D3 story, (3) the
ADR-015 one-implementation question. **None was recorded.** The dispatch
commit `25a9e2c` ("Dispatch batch C: T-033 and T-079 stamped building")
changes exactly two lines of the card — `status: planned` → `building`
and `builder:` → `claude-opus-5` — and adds no plan section. Verified
against main as well: `git diff 25a9e2c 5fbfd4e -- docs/tasks/T-033-*.md`
is empty, so the omission is not a stale base.

**THIS IS NOT A STYLE COMPLAINT — IT MAKES THREE OF FIVE CRITERIA
UNBUILDABLE BY THEIR OWN WORDING.** Criterion 1 reads *"SHALL drain (or
be recorded as accepted) **per the recorded decision**"*; criterion 2 has
the same shape; criterion 5 says *"SHALL BE RECONCILED **per decision
(3)**"*. A criterion whose antecedent is a decision that does not exist
cannot be met, and an executor who supplies the missing decision has made
the architect's ruling — which is exactly the single-writer failure
ADR-004 exists to prevent. The card even anticipates this and names the
consequence for one arm: *"IF arm (b) is chosen THEN the notes SHALL say
so explicitly and name T-059 as dissolved"* — a sentence that only a
recorded pick can satisfy.

**Suggested:** the picks belong in the card before it is re-dispatched.
The exact derived material each one needs is already measured and filed —
`T-033-s2` (the umbrella drain set), `T-033-s3` (the non-code D3 story),
`T-033-s4` (the ADR-015 clause) — so the ruling is the only work left,
and each file states which arm costs what.

**And the same check is cheap enough to be a dispatch step.** A card that
says "record the picks before dispatch" is asserting a precondition
nothing verifies; the board's `status: building` is not evidence that it
was met. This is the second time the dispatch stamp has been observed
carrying less than the card asked for (`T-089-s7`'s row-5 finding is the
sibling shape: a fact the brief must transcribe that lives nowhere
mechanical). Worth considering alongside T-104/T-111, which already
compute things a dispatcher currently eyeballs.

---

**DISCHARGED by `bb26a93` + `5e6fc8c` (2026-08-25), recorded here rather
than re-triaged** (CONVENTIONS: a finding resolved by other work keeps
`status: suggested` and records the discharge in its own body). The
architect made all three rulings on T-033's card under THE THREE RULINGS,
corrected the fence to add `app-shell` in the same commit, and stated in
writing that *"the dispatch defect is the architect's"* and that the lane
*"correctly refused to supply them from inside a worktree"*. @human then
overturned one of them (the cycle) at `5e6fc8c`, which is the mechanism
working rather than a second defect.

**What is NOT discharged is the general point**, and it is left here for
triage rather than smuggled into the discharge: nothing verifies a card's
own stated dispatch preconditions, and `status: building` is not evidence
that they were met. The cost was measured this time — the lane held
`app-shell` and `docs/architecture/components/` while idle, blocking two
other cards, until the delay was noticed by hand.

## PARKED — eleventh triage, 2026-08-26

Real and still true; not now. **UN-PARK WHEN:** the second observed instance, or the moment `T-111`/`T-137` ships a dispatch-time reader that could carry the check for free. Its three rulings are discharged; the residual is that nothing verifies a card own stated dispatch preconditions.
