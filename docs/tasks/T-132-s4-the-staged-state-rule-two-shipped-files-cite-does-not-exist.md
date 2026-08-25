---
id: T-132-s4
title: The staged-state rule two shipped files cite does not exist — the incident that opened this whole thread is prohibited by nothing, and rule 4 never could have prohibited it
status: suggested
suggested_by: verifier claude-opus-5 @T-132
touches: [method/lane-protocol.md, method/tasks/TASK-FORMAT.md]
---

**Derived at `9b3b923` during the re-check of T-132's clause fix, by
asking where violation (a) is forbidden and finding nowhere.**

`method/lane-protocol.md` rule 4 records two violations with attribution.
**(b)**, the suite run, is now prohibited by the rule's own headline.
**(a) is not prohibited by anything in the tree.**

## THE MEASUREMENT

    grep -rn -i 'staged\|staging' method/

returns **exactly two rows at this ref**, and neither is a rule:

- `method/lane-protocol.md:128` — *"**(a)** Staging into the integration
  checkout's index while an integrator held it"*, i.e. the violation.
- `method/tasks/TASK-FORMAT.md:255` — *"believing that a separate rule —
  do not leave staged state in a checkout somebody else is holding —
  forbade the write to the integration branch."*

`docs/CONVENTIONS.md` has no such rule either. **The "separate rule" is
cited twice and written nowhere.** `TASK-FORMAT.md:257` then leans on it a
second time — *"The two rules were never jointly unsatisfiable"* — which
asserts that two rules exist. One does.

## AND RULE 4 NEVER REACHED IT, IN EITHER SPELLING

Staging is not a dependency install, not a test-suite run, and not one of
`no commit, no merge, no push, no branch move`. **So it was outside rule
4's list before the seat was generalised, while it was generalised, and
after the generalisation was scoped back.** The first landing was rejected
for binding too much; the fix binds the right two; **neither version
touches the act that actually happened.**

**This makes one of T-132's own claims false, and it is the card's own
genus.** The card says of generalising the seat: *"One clause; it is
`T-123-s10`'s entire ask."* `T-123-s10` was filed **for the staging
incident** and was ABSORBED into this card — its file is deleted. No
version of this clause discharges it. **A finding was absorbed and its ask
was not met**, and the sentence asserting otherwise survived the original
lane, an adversarial verdict, a rejection, a fresh executor's fix and a
re-check before anyone asked what `T-123-s10` actually wanted.

## THE DISCRIMINATOR IS RIGHT AND ITS SUPPORTING CLAUSE OVERSTATES

`lane-protocol.md:92` justifies leaving commits unbound: *"A commit does
not contend; it is atomic."* **That is true of a COMPLETED commit and
false of the staging step**, and the counterexample is thirty-six lines
below it in the same rule — an integrator *"spent about four minutes
deciding whether the tree was safe to write"* because an index it shared
was dirty. **The index is a shared surface this project has already
named**, first in the card's own list of them.

So the collision/authority test does not need changing. **What needs
saying is that the atomicity the test relies on is an OBLIGATION on the
writer, not a property of git**: a permitted write is stage-and-commit in
one motion, leaving nothing staged behind.

## THE SHIPPED HALF

`method/tasks/TASK-FORMAT.md` is one of the fourteen files
`app/src-tauri/src/agent/kit.rs` `include_str!`s into the binary and
materializes into other projects' kits (T-132-s2). **The dangling
reference ships**, and in a project that is not this one the reader has no
incident, no board and no verdict to reconstruct the missing rule from —
only a sentence saying a rule exists that their `method/` does not
contain.

## SHAPE OF A FIX, MARKED UNVERIFIED

Both halves are inside T-132's own fence.

1. **Write the rule where the discriminator already argues for it** — in
   rule 4, beside the two prohibitions that name a collision: the index is
   one of the surfaces that contends, so a seat with standing to write
   there leaves nothing staged, and the write is atomic by discipline
   rather than by assumption.
2. **Or strike the reference** in `TASK-FORMAT.md:255-257` and say the
   belief was in a rule that was never written — which is a sharper
   finding than the one that bullet currently records, and costs two
   clauses.

**Prefer (1).** (2) alone leaves violation (a) unprohibited and leaves
`T-123-s10` undischarged; (1) alone repairs both and makes (2) true
without editing it. The positive control this project asks of any new
rule applies: **state it so that the ordinary case — an atomic
stamp-and-commit under a running integrator, which rule 4 explicitly
blesses — still passes.**
