---
id: T-281-s7
title: "A correction that needs a code change beside the body must anchor its mutant block on text that does not exist yet, and its body is committed RED — which makes every OTHER block on the same verdict undrillable until the integrator has made that change"
feature: F-06
milestone: 4
size: M
priority: 5
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-281, 2026-09-09, at d086c73"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts, method/roles/verifier.md, method/roles/integrator.md]
builder:
verifier:
built_by:
verified_by:
review:
---

`method/roles/integrator.md` 2b names the corner — *"where a correction
needs a code change beside the body, the verdict names it: you make the
code change and the committed body is what proves it"* — and T-281's own
verdict is the first case to actually meet it. Two consequences fall out
that the design has no stated answer for.

**THE ANCHOR NAMES TEXT THAT DOES NOT EXIST.** The block's mutant must
revert the code change, so its `old` text is text the *integrator* is
about to write. The verifier is guessing the exact bytes of somebody
else's edit. If the integrator writes the fix differently — a renamed
variable, a rewrapped line — the anchor matches zero times and the merge
STOPS on a correction that was actually made. T-281's verdict works
around this by publishing the exact fix text and asking for it verbatim,
which works once and does not generalise.

**THE RED BODY POISONS ITS SIBLINGS.** A code-change correction's body is
committed RED, by construction — that is what "an implementation lacking
the property" means. But `gradeDrill` requires the named body to red
**alone**, so while that body is red, planting any *other* block's mutant
in the same spec shows two failures and is refused as REDS MORE THAN
ITSELF. Every other correction on the verdict becomes undrillable until
the code change lands. T-281's verdict states the ordering by hand
("correction 2's code change first, then drill"); nothing enforces it and
nothing tells the seat that this is why the drill refused.

Shapes worth weighing:

- A block that declares itself **pending a code change**, which the drill
  runs LAST and whose baseline red it subtracts before grading its
  siblings.
- The drill establishing a **green baseline** for each spec before it
  plants anything, and naming the already-red bodies in its refusal so
  "REDS MORE THAN ITSELF" cannot be confused with "something else here
  was already broken".
- The verifier committing the code change **and** the body, with the
  integrator drilling both — which contradicts 2b's authority rule and is
  named here only so the option is on the record rather than rediscovered.

The second is the cheapest and helps every drill, not only this corner: a
mutant planted into an already-red spec proves nothing today and is
reported as though it did.
