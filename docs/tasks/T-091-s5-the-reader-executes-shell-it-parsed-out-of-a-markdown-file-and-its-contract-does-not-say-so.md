---
id: T-091-s5
title: The range-rule reader executes shell it parsed out of a markdown file, and the contract at the head of that file does not name the boundary
status: suggested
suggested_by: verifier claude-opus-5 @T-091-verify
---

**NOT A DEFECT IN THIS CARD AND NOT A REASON TO BLOCK IT.** The card's
ninth criterion REQUIRES the executed form — *"THE PRINTED RECIPE SHALL
BE EXECUTED, never re-implemented"* — and the verify pass confirmed the
requirement is met and that re-implementing instead is the defect the
criterion exists to prevent (mutant V15 removes one dot from the printed
three-dot forecast and reds five bodies; a re-implementing reader is
green on it). This file records a TRUST BOUNDARY that is real, is
currently unstated, and matters most somewhere else.

**WHAT IS TRUE, MEASURED AT `2e5704a`.**
`tools/e2e/scripts/range-rule.mjs` extracts command strings from
`docs/CONVENTIONS.md` with backtick captures — `` /`([^`]+)`/ `` — and
hands them to `/bin/sh -c` through `sh(root, command)` (its own
`spawnSync` wrapper). The strings so executed are the two-row prescribed
table's three commands, the four scoreboard recipes, the two flip
recipes, and the DOCS GATE's two printed lines. **Only the four
scoreboard recipes are constrained at all**: `nameOnly()` throws unless
the recipe starts with `git diff `, because it has to append
`--name-only`. The other six are executed as written.

**WHY IT IS NOT A FINDING HERE.** The document is a tracked file in this
repository. Anyone who can edit `docs/CONVENTIONS.md` can already edit
`tools/e2e/tests/*.spec.ts`, which the runner executes directly and with
no shell in the way. The reader therefore grants **no privilege the test
runner does not already grant**, and the package is `private: true` dev
tooling that ships in nothing.

**WHY IT IS WORTH WRITING DOWN ANYWAY, AND THIS IS THE WHOLE ASK.** The
header of `range-rule.mjs` carries a numbered CONTRACT — seven rules,
covering derivation, throwing, executing the recipe, storing counts with
their spelling and their trigger, checking flips by gate, and not
asserting against a moving target. **None of the seven says whose
document this is.** The pattern the file demonstrates — *parse commands
out of a markdown file and run them* — is exactly the pattern a later
card would reach for, and this product's own subject is reading
**project documents it did not write**. The same code shape, pointed at
a user's project folder instead of at this repository's own tracked
conventions, is arbitrary command execution rather than a test fixture,
and nothing in the file marks where the line is.

**THE ASK — one paragraph, no behaviour change.** Add an eighth contract
rule to `tools/e2e/scripts/range-rule.mjs` saying that the document
under test is a TRACKED file of THIS repository, that executing strings
parsed out of it is safe only because of that, and that the shape must
not be copied to any document this repository does not own. Optionally
add a cheap assertion beside it — every string reaching `sh()` must
begin with `git ` or `node tools/` — but the sentence is the load-bearing
half and the assertion is a matter of taste, because an allowlist in the
reader is one more constant that can go stale while the sentence cannot.

Fence `[tools/e2e]`. Size XS. **Do not fold this into a card that also
changes what the reader computes** — it is a comment and, at most, one
guard.
