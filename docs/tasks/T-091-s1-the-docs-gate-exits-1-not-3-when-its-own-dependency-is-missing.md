---
id: T-091-s1
title: The DOCS GATE exits 1 rather than 3 when its own dependency is missing, and 1 is the code it reserves for a verdict
status: parked
suggested_by: executor claude-opus-5 @T-091
---

**MEASURED AT `d2bba71` IN A DETACHED DRILL WORKTREE, NOT REASONED
FROM.** T-091's reader executes the DOCS GATE's printed recipe end to
end and compares the observed exit code with the code the bullet's own
matrix promises. In a checkout of THIS repository that had never run
`npm ci` from tools/e2e, the printed spelling returned **1** where the
matrix promises **2**:

    $ node tools/e2e/scripts/docs-gate.mjs      # zero arguments
    Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'yaml'
      imported from .../tools/e2e/scripts/docs-gate.mjs
    exit=1

**`docs-gate.mjs` IS NOT ZERO-DEP, AND `docs-scan.mjs`'s HEADER SAYS IT
IS** — *"Plain node, zero deps, no I/O at import time — the same contract
token-scan.mjs keeps, so this can move to CI's first step later without
being rewritten."* It imports `yaml`. The claim is about `docs-scan.mjs`
and the gate that ships beside it does not hold it, which is the kind of
divergence a reader trusts precisely because it is written down.

**THE CONSEQUENCE IS THE INTERESTING HALF, AND IT IS THIS GATE'S OWN
LEGEND WORKING AGAINST IT.** The four codes are `0` nothing owed, `1` the
gate HAS a verdict, `2` called wrong, `3` the gate could not run. A
missing dependency is unambiguously "could not run" — and node reports
**1**, the code that means the gate looked and found something. **A
session reading only the code is told a verdict exists where the gate
never linked.** The DOCS GATE bullet's own closing instruction is *"IF it
cannot run THEN say so LOUDLY in the checkpoint, naming the reason and the
exit code"*, and this is the one shape where the exit code lies about
which of those two happened.

**THIS IS T-080-s4's SHAPE, ONE GATE OVER, AND UNDOCUMENTED HERE.** The
token lint legends its identical hole in as many words: *"ONE HOLE
REMAINS, NAMED RATHER THAN PAPERED OVER (T-080-s4): a parse error in the
gate's own two files means Node never links them, so the wrapper's `try`
never runs and the process exits 1, not 3."* The DOCS GATE has no such
clause, and its trigger is WIDER than a parse error: any fresh checkout
that has not installed tools/e2e reaches it, which is every lane
worktree and every scratch worktree at the moment it is cut.

**TWO DISPOSITIONS, AND THE CHEAP ONE IS PROBABLY RIGHT.**

1. **Legend it**, one clause in the DOCS GATE bullet beside the four
   codes, exactly as the token lint legends its own. Fence
   `docs/CONVENTIONS.md`. Cheapest, and it makes the failure READABLE
   rather than absent.
2. **Close it**, by moving the `yaml` import behind a dynamic `import()`
   inside a `try` that exits 3. ESM imports are hoisted, so a static
   import cannot be caught — which is exactly why T-080-s4 was recorded
   as a hole rather than fixed. Fence `tools/e2e`.

**A THIRD THING IS WORTH CHECKING FIRST AND IS NOT ASSUMED HERE**:
whether `npm run lint:docs` — the CI step — can reach this at all. CI
runs `npm ci` before the lint, so on the runner the dependency is
present; the exposure is local, in exactly the checkouts this pipeline
creates most often.

T-091's reader now DISCRIMINATES the two rather than reporting a wrong
code: when the gate's process never links, it says *"the DOCS GATE never
LINKED in <root> … the code observed is node's and not the gate's"*. That
removes the reader's blind spot and does nothing about the gate's.

Amnesty triage 2026-08-29 (triage seat): PARKED — the needle is live and this sitting reproduced it: a fresh worktree of this repository answers ERR_MODULE_NOT_FOUND at exit 1 from docs-gate.mjs until npm ci is run in tools/e2e. The exposure is LOCAL — CI installs before it lints — and T-091's own reader now discriminates the case in words ("the DOCS GATE never LINKED"), so what is left is the gate's own legend, which the token lint already carries for its identical hole (T-080-s4). RESURFACES: the next docs/CONVENTIONS.md dispatch (disposition 1, one clause beside the four codes) or the next tools/e2e dispatch (disposition 2, the dynamic import behind a try that exits 3). This card is the owner of the gate's exit-code-honesty class; T-132-s1 states the same defect from the other side.
