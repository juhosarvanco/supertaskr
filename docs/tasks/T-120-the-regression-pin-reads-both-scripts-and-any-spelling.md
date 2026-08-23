---
id: T-120
title: The universal's regression pin catches one spelling in one file — a wrapped line, a lowercase "can", or the same claim in docs-gate.mjs each restores the rejected defect at a green suite
feature: F-06
milestone: 4
priority: 42
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** Fence
> collides with `T-118`, `T-119` and `T-090`; none may run concurrently.

Absorbs (seventh triage, 2026-08-24): T-085-s3 — file removed in this
commit.

T-085's second round added a POSITIONAL pin in
`tools/e2e/tests/docs-input-gate.spec.ts` —
`the ledger's universal is gone, and what replaced it is checkable`. It
exists because the previous pin, a `toContain` on the retraction
headline, was satisfiable by the very defect it was meant to prevent,
and was: the retraction was present while `rootAnchoredFiles()`'s
comment still asserted the universal 220 lines above. **The new pin is a
real improvement and it catches the defect that actually happened. Its
REACH is narrower than the intent it is written to serve.**

## The pin, read at `6b0cf47`

    const asserted = [...scanner.matchAll(/only (?:kind of )?file that CAN read/g)];

`scanner` is `tools/e2e/scripts/docs-scan.mjs` and nothing else. The
comment above it states the intent in as many words — *"AND THE
RETRACTION HAS TO BE THE ONLY PLACE IT SURVIVES"* — while the assertion
enforces that **for one spelling in one file**.

**Five mutants, measured at branch tip `ea4a758`, each run as the full
spec with `NPUTER_E2E_PORT=14621`, baseline 36/36 exit 0** (that file
still holds 36 top-level tests at `6b0cf47`; derive it at your own ref):

| mutant | shape | result |
|---|---|---|
| A | the exact two rejected lines, restored outside the window | **35/1 exit 1 — caught** |
| B | same claim, WRAPPED so `CAN` and `read` fall on different lines | 36/36 exit 0 — **escapes** |
| C | same claim, lowercase `can read` | 36/36 exit 0 — **escapes** |
| D | same claim stated in `docs-gate.mjs` | 36/36 exit 0 — **escapes** |
| E | retraction quotation deleted (positive control) | **35/1 exit 1 — caught** |

**B is not an exotic shape, it is the LIKELY one.** `docs-scan.mjs`
wraps its comments at about 72 columns, so whether `CAN read` lands
contiguous on one line is an accident of where the wrap falls; the
original defect had it contiguous by luck. **C matters from the other
side**: the file's own corrected sentences write lowercase — at
`6b0cf47` two of them, in `rootAnchoredFiles()`'s comment and in the
ledger's own positive claim, both reading *"the only kind of file that
can name docs/ by an ABSOLUTE anchor"* — so a reintroduction written in
the file's current voice escapes.

**The tree already proves the reach is short.** `docs-scan.mjs` states
the universal in a DIFFERENT wording near the top of its "WHAT IT CANNOT
SEE" section — *"a file can only read THIS repository's docs/ if it
holds THIS repository's root"* — outside the retraction window, and the
pin does not see it. That occurrence is BENIGN (it is itself a
retraction, and correct), **which is exactly why it is good evidence**:
a real, live, differently-worded statement of the same claim, sitting
where the pin cannot reach, with the suite green.

**And the prose is truthful today.** Swept case-insensitively over
`tools/e2e/scripts/` and `tools/e2e/tests/` at `6b0cf47`, the phrase
`only (kind of )?file that can read` occurs **exactly once**, inside the
retraction's own quotation. This card is not about a live falsehood; it
is about what the pin will catch NEXT time.

## Acceptance criteria

- **THE SWEEP SHALL BE INSENSITIVE TO WRAPPING AND TO CASE.** It SHALL
  match the claim across line breaks and comment-continuation markers
  (runs of whitespace and `*` between words) and SHALL NOT require the
  uppercase `CAN`. **Mutants B and C SHALL each be re-run and shown
  caught** — they were 36/36 exit 0 before this card, and a criterion
  whose mutant does not red is not evidence.
- **THE POSITIVE CONTROL SHALL SURVIVE THE WIDENING.** The retraction
  QUOTES the sentence, and that quotation is what keeps the sweep from
  being vacuous; a widened matcher that stops matching the quotation has
  removed its own control. **Mutant E SHALL be re-run and shown caught**
  (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL).
- **THE SWEEP SHALL READ BOTH SCRIPTS, NOT ONE.** `docs-gate.mjs` is
  where one of the three corrected restatements lived and is the sibling
  the pin does not open. **Mutant D SHALL be re-run and shown caught.**
  A positional pin over one file is the shape that misses its sibling —
  and the window logic (retraction offset, positive-claim offset) is
  defined in `docs-scan.mjs` only, so the second file needs its own
  rule: **outside the retraction file, ANY occurrence is a hit.**
- **THE PIN SHALL COVER THE CONCLUSION AND NOT ONLY THE PREMISE.** The
  premise occurs once; the conclusion it warranted was restated three
  times and each needed its own clause — a sweep for "exact set of
  places" that requires a scoping word (`ROOT-ANCHORED`, `THIS CLASS`)
  nearby would have caught all three mechanically instead of by reading.
  IF the executor judges the conclusion sweep too noisy against the live
  tree THEN it SHALL say so with the hit list it measured, rather than
  omitting the arm in silence.
- **THE SPEC'S PROSE AND ITS ASSERTION SHALL AGREE.** Either the
  assertion reaches "the ONLY place it survives" or the comment SHALL
  narrow to what is enforced. **A comment claiming more than its
  assertion is the T-070-s5 shape, in the card that exists because a
  stale claim shipped.**
- IF the widened sweep matches something benign already in the tree THEN
  the fix is the SWEEP's scoping, never a rewrite of prose that is
  already correct — and the benign occurrence SHALL be named in the spec
  so the next reader knows it was seen and kept.
- **NO ARM OF THE GATE'S BEHAVIOUR MOVES.** `docs-scan.mjs`'s two-arm
  reader derivation, `rootAnchoredFiles()`, `packageRelativeSites()` and
  the `--census` output are untouched by this card; it changes one
  regression pin.

Verification: headless — `npm test`, `npm run typecheck` and
`npm run lint:tokens` (plus `-- --selftest`) from tools/e2e/, exits read
unpiped from `$?` and stated; workers 1, retries 0, no skips. **POISON
DRILL on the changed assertion, one side only**: mutants A-E re-run as a
family at the lane's own ref, each mutated text read back with
`git diff` before its run, restores per-path proved by sha256 at the
drill's own commit, and the drill performed in a detached scratch
worktree — **these mutants edit a file the live gate reads, so mutating
in place would make every concurrent reader see a false claim.** Then
the shape-six check: does any other body already assert this. The DOCS
GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`. @human: none.
