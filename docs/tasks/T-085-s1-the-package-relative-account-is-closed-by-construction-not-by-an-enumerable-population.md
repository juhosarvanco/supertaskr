---
id: T-085-s1
title: The package-relative docs class is closed by construction, not by an enumerable population — so its one residual has no census, and its tripwire inherits a narrower version of T-084-s7's out-of-fence cost
status: parked
suggested_by: executor claude-opus-4.8 @T-085
---

T-085 closed the package-relative hole by RESOLVING each docs-shaped
literal against its base rather than by enumerating a population. That is
the right shape — every file holds its own package directory, so unlike
the root-anchored class (`rootAnchoredFiles()` bounds it: a file either
computes this repo's root or it does not), the package-relative class has
no closed population a census could exhaust. Completeness therefore rests
on the TEXTUAL `docsShaped` filter catching every climbing docs path, and
that filter has exactly one disclosed gap, limit 5b in `docs-scan.mjs`: a
docs path reached through a base that ALREADY points inside `docs/`,
spent on a literal that does not itself begin with `docs` —
`join(researchDir, "captures/x")` where `researchDir` is imported and
equals `<root>/docs/research`. It is not docs-shaped, so it is not a
site, so neither `siteDocsPrefix` nor `unlinkedSites()` sees it.
**Measured NIL on this tree** (`docsShaped` was run over the whole
corpus; the only non-root, non-package base forming a docs path is the
live instance this card derived). If it ever appears, the fix is another
textual shape — follow an imported base that resolves inside `docs/` —
not a ledger; a ledger is what the root-anchored class needs precisely
because it HAS a population, and this class does not.

Distinct but adjacent: `unlinkedSites()`, the package-relative tripwire,
carries a narrower version of `T-084-s7`'s cost. A lane fenced away from
`tools/e2e` that adds a file with a climbing docs-shaped site whose base
`evalBase` cannot evaluate reds `npm test from tools/e2e/` with *"a base
this scan cannot evaluate"*. Unlike `T-084-s7` — where the thing to edit
(`ROOT_ANCHOR_LEDGER`) is unconditionally out of the lane's fence — here
the reported FILE is in the lane's own fence and the lane can usually fix
its own file (write the base in a shape the calculus knows). The residual
cost is only the case where the file is legitimately written that way and
`evalBase` itself needs teaching, which lives in `tools/e2e`. Same three
options `T-084-s7` weighs; the population is smaller still (one climbing
site in the whole tree today), so option 3 — let the room happen — is
even more clearly right here. Re-weigh with `T-084-s7` if `T-084-s2` (the
gate as a CI step) ever lands.

**PARKED at the seventh triage (2026-08-24).** Unpark when T-090 merges — its own trigger names T-084-s2, which T-090 absorbed, so T-090's merge IS the unpark event. Census measured NIL on this tree.
