---
id: T-085-s3
title: The universal's regression pin catches one spelling in one file — a wrapped line, a lowercase "can", or the same claim in docs-gate.mjs all restore the rejected defect at a green suite
status: suggested
suggested_by: verifier claude-opus-5 @T-085-verify-2
---

T-085's second round added a POSITIONAL pin in
`tools/e2e/tests/docs-input-gate.spec.ts` ("the ledger's universal is
gone, and what replaced it is checkable"). It exists because the
previous pin — `toContain` on the retraction headline — was satisfiable
by the very defect it was meant to prevent, and was: the retraction was
present while `rootAnchoredFiles()`'s comment still asserted the
universal 220 lines above. The new pin is a real improvement and it
catches the defect that actually happened. Its REACH is narrower than
the intent it is written to serve, measured at branch tip `ea4a758`.

The pin is one regex over one file:

    const asserted = [...scanner.matchAll(/only (?:kind of )?file that CAN read/g)];

`scanner` is `tools/e2e/scripts/docs-scan.mjs` and nothing else. Five
mutants, each run as the full spec file with
`NPUTER_E2E_PORT=14621`, baseline **36/36 exit 0**:

| mutant | shape | result |
|---|---|---|
| A | the exact two rejected lines, restored outside the window | **35/1 exit 1 — caught** |
| B | same claim, WRAPPED so `CAN` and `read` fall on different lines | 36/36 exit 0 — **escapes** |
| C | same claim, lowercase `can read` | 36/36 exit 0 — **escapes** |
| D | same claim stated in `docs-gate.mjs` | 36/36 exit 0 — **escapes** |
| E | retraction quotation deleted (positive control) | **35/1 exit 1 — caught** |

B is not an exotic shape, it is the LIKELY one. This file wraps comments
at about 72 columns, so whether `CAN read` lands contiguous on one line
is an accident of where the wrap falls; the original defect had it
contiguous by luck. C matters for the same reason from the other side:
the file's own corrected sentence at :1882 writes lowercase "can" ("the
only kind of file that **can** name docs/ by an ABSOLUTE anchor"), so a
reintroduction written in the file's current voice escapes.

**The tree already proves it.** `docs-scan.mjs:127-129` states the
universal in a different wording — *"a file can only read THIS
repository's docs/ if it holds THIS repository's root"* — outside the
retraction window, and the pin does not see it. That occurrence is
BENIGN (it is itself a retraction, and correct), which is exactly why it
is good evidence: a real, live, differently-worded statement of the same
claim, sitting where the pin cannot reach, with the suite green.

Not a defect in the fix and not a blocking finding: the card's criteria
never asked for a pin, the tree's prose is now truthful (swept
case-insensitively across both scripts and the spec — the premise occurs
once, inside the retraction's own quotation), and a pin that catches the
historical defect plus a positive control is strictly better than the
vacuous one it replaced. This is about what the pin will catch NEXT
time.

Shapes worth costing, cheapest first:

- **Whitespace-insensitive and case-insensitive**: match on the source
  with runs of `\s*\*?\s*` allowed between words, and drop the `CAN`
  case requirement. Closes B and C without changing what the pin means.
  Needs care that the retraction's own quotation still matches, since it
  is the positive control.
- **Scan both scripts**, not one. `docs-gate.mjs` is where one of the
  three corrected restatements lived, and it is the sibling the pin does
  not read. A positional pin over one file is the shape that misses its
  sibling.
- **Pin the CONCLUSION too, not only the premise.** The premise occurs
  once; the conclusion it warranted was restated three times and each
  needed its own clause. A sweep for "exact set of places" that requires
  a scoping word (`ROOT-ANCHORED`, `THIS CLASS`) nearby would have
  caught all three mechanically instead of by reading.

Whoever takes this should decide whether the pin's PROSE should also be
narrowed: the spec comment says the retraction "has to be the ONLY place
it survives", which is the intent, while the assertion enforces that for
one spelling in one file.
