---
id: T-150-s5
title: Both inference arms of the card figure ledger have unmeasured precision, and three mutants of that precision survive the suite
status: suggested
suggested_by: verifier claude-opus-5 @T-150-verify
---

T-150 pins that `CENSUS_CLAIM` FIRES on `T-141`'s sentence and does NOT
fire on the same sentence with the repository scope removed — a real
positive control, and the right one. **Nothing pins how often either
inference arm fires on something it should not.** Measured over all 316
live cards at `80aab21`.

## THE UNRUNNABLE ARM IS 7 FOR 7 FALSE ON THIS BOARD

Every finding it produces, in full:

    T-001-app-shell.md:339                 securitypolicyviolation: `style-src-elem <- inline` (injected
    T-111-s6-…:37                          `T-111 <- T-110`
    T-111-s6-…:38                          `T-134 <- T-132`
    T-111-s6-…:93                          `T-067 <- T-062`, `T-067 <- T-058`, `T-068 <- T-057`
    T-111-the-board-says-what-is-dispatchable.md:667, :668, :671   the same blocked_by arrows

**Not one is a provenance claim.** Six are `blocked_by` edges written
with an arrow and the seventh is a CSP directive inside backticks. **The
arm has zero true positives anywhere in the corpus** — and it does not
fire on `T-141` either, whose marker was a backticked command with no
arrow in it, so the sentence *"THE T-141 SHAPE, MECHANISED"* in
`card-figures.spec.ts` describes the CONCEPT and not this pattern.
**`CENSUS` is what caught `T-141`; `ANY_PROVENANCE` caught nothing.**

## THE CENSUS ARM CARRIES A SMALLER, SYSTEMATIC FALSE CLASS

Of its **65** findings, at least four are vocabulary rather than census:
`first-parent` at `T-083:233`, `T-089:1181` and `T-141-s1:62`, and
`first-party` at `T-091-s2:27`. Both are terms this project writes in
constantly. **~6% false, against an arm whose whole argument is that it
is narrow where arm 1 is wide** — still a good ratio, and worth stating
as a measurement rather than leaving to the reader.

## THREE MUTANTS OF THAT PRECISION SURVIVE

Run at `80aab21` in a detached scratch worktree, producer-side only, each
read back with `git diff`, each restored and proved by `shasum -a 256`
against `c9eec07cc22fb570b4f51e47c61da88c014a809e1d3bba93e8147b988a7502c4`:

| mutant | moved | killed |
|---|---|---|
| N2 | `CARD_STAMP`'s ref length `[0-9a-f]{7,}` to `{1,}` | 0 |
| N3 | `ANY_PROVENANCE` from `/\s<-\s\S/` to `/<-/` | 0 |
| N6 | the census proximity window `{0,80}?` to `{0,400}?` | 0 |

The module's own comment says the narrowness *"is measured, not
asserted"* and asks the reader to re-derive the ratio. **The RATIO body
does exactly that and is a good body; what no body holds is the width of
any individual knob**, so all three can be widened silently. Compare
`docs/CONVENTIONS.md` SHAPE FIVE — a printed count is not a pin — one rung
along.

## Disposal

`touches:` `[tools/e2e]`. Two cheap arms, both in
`card-figures.spec.ts`. **(a)** A false-positive FLOOR beside the
existing ratio body — assert the UNRUNNABLE count over the live board
stays at or below a stated number, and the `first-parent`/`first-party`
class is excluded — which kills N3 and N6 by making a widened pattern
overshoot. **(b)** A single body over the corpus asserting the arm's
hits are the ones a named list expects, so a loosened `CARD_STAMP` reds.
**Do not simply delete the UNRUNNABLE arm**: its argument — a marker that
is present and does not bind — is the diff's best idea, and the fix is a
pattern that can tell a provenance arrow from a dependency arrow, not the
removal of the verdict.
