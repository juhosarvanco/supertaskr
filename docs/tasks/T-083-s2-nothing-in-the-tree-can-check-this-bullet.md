---
id: T-083-s2
title: Nothing in the tree can check the range rule's figures — and that is an artefact of the FENCE, not of the content; the reader is buildable and must live in tools/e2e/tests/
status: suggested
suggested_by: executor claude-opus-5 @T-083
---

**Rewritten at T-083's second build, after the verifier ruled on it.**
The first version of this finding said, in effect, that prose in a
conventions file has no mechanical reader. That framing is wrong and the
archive must not inherit it. **The unfalsifiability is an artefact of
the fence T-083 was drawn with, not of the content.**
`touches: [docs/CONVENTIONS.md]`; a reader has to live in
`tools/e2e/tests/`; the executor could not write one without breaching
its own fence. Everything below is unchanged in fact and corrected in
diagnosis.

## The gap, measured three times

**Exactly two files open `docs/CONVENTIONS.md` from disk**, verified at
`ddcc8bb` by grepping every `.rs`, `.ts`, `.tsx` and `.mjs` for a real
read rather than a mention (twenty files name the path; eighteen name it
in a comment):

- `tools/e2e/tests/workflow-parity.spec.ts` — `buildAndTestSection`
  splits the file on `^## ` and keeps only the chunk starting
  `Build & test`. **Everything under `## Gotchas` is invisible to it.**
- `snapshot_version_matches_the_live_method_stamps` in
  `app/src-tauri/src/agent/kit.rs` — asserts one substring,
  `currently v<METHOD_SNAPSHOT_VERSION>`, from the FIRST gotcha.

Plus the CONTROL walk in `tools/e2e/scripts/token-scan.mjs`, which reads
the bytes and cares only that none of them is a control character. The
FOUR WALKS bullet's own claim that the outside-the-walks reader list
"IS CLOSED AT TWO" reproduces exactly.

So every measured figure T-083 wrote into the RANGE RULE — the 9 and 36
at `dc3ef5b`, the 76/16/16 at `d92dceb`, the 12-versus-60 collapse at
`4683566`, the 31 merges, the two-metric scoreboard, the 8-of-10 and
5-of-5 flip counts, the twelve commit hashes — **is poisonable to any
value at all with every reader still green**. Measured on T-083's
branch, two rounds. FIVE FIGURES POISONED AT ONCE — 9 to 7, 36 to 12, 31
to 41, 10 to 2, 8 to 1, which also breaks the arithmetic the surrounding
prose states — and `workflow-parity` 14/14 exit 0, `cargo test` exit 0,
`lint:tokens` clean exit 0, parser 263/263 exit 0. Then the sharper one:
**the whole correction deleted and the falsified sentence reinstated
verbatim**, 32 lines replaced by the two it was written to retire, and
the same five runs green again at exit 0. **Then the verifier measured
it a third time and harder**: ten mutants derived from T-083's
acceptance criteria rather than from the executor's pins, applied
together and read back out of the file, every gate run — **ten mutants,
zero killed**.

## The correction: it is the fence, not the prose

**The verifier then built the reader, to find out whether "no mechanical
reader" is a property of the claim or of the fence. It is a property of
the fence.** Ninety lines of Node, written in a single pass, sharing no
constant between its two sides: `git` computes on one side, the parsed
document is read on the other. It derives the flip lists, the counts,
T-027's figures and the reverse-flip universal from `git`, and executes
the three-dot identity rather than trusting it. **GREEN on the merged
file and RED on the poisoned one, with 12 findings covering all ten
mutants**, each named in its own words — *"T-027 prescribed: doc says 7,
git says 9"*, *"BOOT segment names another gate: GRAPH REGEN"*,
*"reverse-flip claim: doc says some, git finds 0"*. It was not committed
and it is not in this tree; it was evidence for a ruling, and it belongs
to whoever takes this card.

So the honest statement has two halves, and only one of them is a gap:

- **THE FACTUAL HALF IS CHEAPLY CHECKABLE.** Every figure in the bullet
  is a `git` derivation over commits that are immutable once merged.
  That is *cheaper* than the CI-command derivation
  `workflow-parity.spec.ts` already runs against the other half of this
  same file, because git is a more stable oracle than a YAML workflow.
- **ONLY THE JUDGEMENT HALF GENUINELY HAS NO MECHANICAL READER** — *the
  ban has to name the PAIR, not the punctuation*; *presentation and
  correctness deserve different weight*; *a scoreboard that counts a
  refusal as a miss is scoring the wrong thing*. No derivation settles
  those, and none should be asked to.

**Filing this as a suggestion was the method's own prescription, not an
evasion.** The BOOT GATE bullet in this same file says it in as many
words: *"a red the executor's own fence forbids fixing is still news …
file it as a suggestion and say so in the notes."* The executor cannot
widen its own fence. **So this is a DISPATCH observation, not an
executor failure** — the next card that fences a claim to a single file
should ask where that claim's defence would have to live BEFORE drawing
the boundary, because a one-file fence around a claim whose defence
lives in another tree produces exactly this finding every time.

## What the reader must assert, and where it has to live

Recorded so whoever takes this does not rediscover the design.

**Where:** `tools/e2e/tests/` — a new spec beside
`workflow-parity.spec.ts`, which is the established precedent for
deriving a claim about `docs/CONVENTIONS.md` rather than pinning it. It
cannot go anywhere under `docs/`; that fence is what produced this
finding.

**Shape:** the one `workflow-parity.spec.ts` already proves out —
**DERIVE, never pin.** Two sides sharing no constant: `git` computes,
the document is parsed, the test compares. The doc stops being a
transcription and becomes a projection, which is what T-045 did to the
CI command list. Parse failures must THROW rather than yield an empty
expectation, per T-083-s3.

**What it asserts**, each item chosen because a known mutant survives
without it:

1. **The flip lists BY GATE**, not merged into one set. The mutant that
   matters relabels T-076 from BOOT to GRAPH — that is T-083-s1's real,
   shipped error, and only a gate-aware parse catches it. A set-equality
   check over all thirteen hashes passes straight through it.
2. **The four headline counts** — 31 merges, BOOT not-owed 10 with 8
   naive fires, GRAPH not-owed 5 with 5 — recomputed from
   `git rev-list --first-parent --merges`, each side matched against the
   gate's own trigger regex.
3. **T-027 at its ref**: 9 prescribed, 36 naive, 27 extra at `dc3ef5b`.
4. **The reverse-flip universal**: zero merges where the naive range
   says a gate is not owed while the prescribed one says it is.
5. **The three-dot identity BY EXECUTION**, not by reading: assert that
   `A...B` and `$(git merge-base A B)..B` return the same set on live
   refs, rather than asserting the doc contains the sentence.
6. **BOTH COLUMNS OF THE SCOREBOARD, EACH UNDER ITS OWN METRIC** —
   path-for-path 29/30/3 and byte-for-byte 29/24/3, plus the six merges
   that separate three dots' two scores. This item is added after the
   fact and it is the sharpest of the seven: **T-083 was rejected for
   measuring one metric and labelling it the other**, so a reader
   checking a single column would have been green straight through the
   exact defect that sent this card back. A figure and its metric are
   ONE claim, and a reader that stores them apart re-opens the hole.
7. **Presence, not value, for the prose commitments**: the `merge-tree`
   command, the `Not "rarely"` refusal, the exit-code warning.

**And the argument against the bad remedy still stands.** This is not an
argument for a fixture that greps for `**9**`. A test pinning the digits
of a doc goes stale in the direction that matters least and reds on
rewording. Every item above recomputes.

**Sized honestly, which the first version did not.** The verifier wrote
a working instrument in a single pass, so "a size-M card of its own"
overstated the cost: size S to M, one new file under `tools/e2e/tests/`,
no production code, and the derivation is the same two `git` commands
the bullet already prints.

Until it exists the honest statement is the one this finding was opened
to make, now with its cause named rather than mis-attributed: **the
range rule is the most-consulted paragraph in the file and the least
defended — not because prose cannot be defended, but because the card
that corrected it was fenced to the one file the defence cannot live
in.**
