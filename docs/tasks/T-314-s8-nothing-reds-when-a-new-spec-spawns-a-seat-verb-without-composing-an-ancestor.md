---
id: T-314-s8
title: "Nothing reds when a NEW body spawns a session-deriving verb without composing an ancestor: the enumeration that caught T-314-s6 is a grep in a verdict, and the next one will be caught by the runner"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-314-s6, at b7274d54: the attack set asked for an enumeration control over every seat-verb invocation and the honest answer was a hand sweep recorded in the notes"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts, docs/CAPABILITIES.md, docs/INDEX.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-314-s6 repaired two bodies that spawned a seat verb straight from the
test process: the verb walks the process table for a harness-shaped
ancestor, a local test process always has one and a runner never does,
so the bodies were green on every developer's machine and red on the
runner alone.

The repair routes every such invocation through a stand-in harness, and
the sweep that established "every such invocation" is a grep the
executor ran and wrote into the card. Nothing in the tree keeps it. The
next body added anywhere under tools/e2e/tests/ that spawns a verb
deriving a session identity will be green locally and red on the runner,
in exactly the same way, and the cost is a CI red on main plus a card —
which is what this family of cards already is.

The enumeration has to be over the SPAWN, not over the flag spelling: an
invocation assembled from a variable or a shared argument array carries
no literal to grep for. What the tree can see is which helper a spec
reaches the CLI through, and which of those helpers composes an
ancestor.

There are legitimate exceptions and they must be named rather than
silently matched: tools/e2e/tests/checkout-currency.spec.ts stubs a
process table on the PATH instead of composing a real ancestor, and both
spec files carry sites where the arm answers before an identity is ever
derived. An enumeration with a hand-maintained exception list is worth
less than one whose exceptions each carry their own reason in the tree.

## Acceptance criteria

- WHEN a spec in this suite reaches a verb that derives a session identity THE suite SHALL red unless that invocation composes an ancestor or names why it needs none, so the next instance of this class is caught on the machine that adds it rather than on the runner; the check itself belongs beside the stand-in's own body in tools/e2e/tests/push-guard.spec.ts.
- WHEN the check is written THE enumeration SHALL be over the spawn sites rather than over the flag spelling, proved by a planted body whose verb arguments are assembled from a variable and which the check still finds.
- WHEN an exception is legitimate THE reason SHALL live beside the site rather than in a list inside the check, and the check SHALL red when a site claims an exception it does not have, proved by a mutant that claims one falsely.
- WHEN this card lands THE census SHALL be regenerated for the body it adds, which is why docs/CAPABILITIES.md and docs/INDEX.md are in this fence.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
