---
id: T-064-s7
title: The docs gate refuses an EMPTY path list and accepts a list of ONE EMPTY STRING — exit 0, nothing owed, which is the same silence T-084-s6 closed wearing one more layer of costume
status: suggested
suggested_by: verifier claude-opus-5 @T-064-verify
---

Not T-064's code. Found while running T-064's owed gates, and filed
against the gate rather than the lane.

T-084-s6 closed the case where a failed range command reaches
`tools/e2e/scripts/docs-gate.mjs` as ZERO paths. CONVENTIONS states the
rule in as many words: **"AN EMPTY PATH LIST IS EXIT 2, NOT EXIT 0"**,
because BSD `xargs` runs the utility once even on empty input, so
"silence wearing a clean gate's costume" was reachable.

**MEASURED at `09ce637`, from the repo root:**

    node tools/e2e/scripts/docs-gate.mjs
      -> exit 2, "NO PATHS GIVEN - usage: ..."          the closed case

    node tools/e2e/scripts/docs-gate.mjs ""
      -> exit 0, full reader census printed, NOTHING OWED

The second is not an empty list — it is a list of length one — so the
guard does not fire, no path matches anything under docs/, and the gate
prints a clean, authoritative, entirely truthful-looking report of a
tree it was asked nothing about.

**IT IS REACHABLE BY THE MOST OBVIOUS SPELLING OF THE INVOCATION.** The
gate is documented to be fed "the RANGE RULE's own path list". A caller
who writes the substitution quoted — which is what one does to survive
paths with spaces —

    node tools/e2e/scripts/docs-gate.mjs "$(git diff --name-only A B)"

hands it exactly one argument. When the range command SUCCEEDS that
argument is a newline-joined blob that matches no path and the gate says
nothing is owed; when the range command FAILS it is the empty string and
the gate says nothing is owed. Both are the failure T-084-s6 named, and
neither trips the guard T-084-s6 added.

**THE CLOSE** is to treat a path list whose entries are all empty (or
all blank after trimming) the same as an empty list — exit 2 — and, for
the joined-blob case, to reject any argument containing a newline as
exit 2 rather than silently classifying it as "a path under no reader".
Sized S, in `docs-gate.mjs`'s argument handling, with the enforcing copy
in `tools/e2e/tests/docs-input-gate.spec.ts` where the existing
zero-argument case is already pinned.

**THE SMALLER NOTE THAT COMES WITH IT.** The dispatch brief for this
lane relayed a claim that "macOS xargs maps everything to exit 1 and
runs nothing on empty input". Whatever `xargs` does, the gate's own
behaviour above is measured directly and does not depend on it — which
is the argument for invoking the gate directly, as CONVENTIONS already
requires.
