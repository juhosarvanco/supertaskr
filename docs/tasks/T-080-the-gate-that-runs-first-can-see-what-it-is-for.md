---
id: T-080
title: The gate that runs first can see what it is for — a corpus floor, a sample that discriminates, and two exit codes
feature: F-02
milestone: 4
priority: 38
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-058-s1, T-058-s2, T-058-s4 (fourth triage, 2026-08-19). The
suggestion files are removed in the same commit as this card. T-058-s3
went to **T-074** — it is a comment correction in a file this card does
not touch.

ONE MECHANISM: **the gate designed to run against a bare checkout is
blind to the regressions the seventeenth-step Playwright lane catches,
and CI runs it FIRST.** Three findings, three faces of it, all in
`tools/e2e/scripts/token-scan.mjs` and its focused spec.

THE CORPUS POLICY IS ITSELF UNPINNED. T-058 ships CONTROL as a DENY list
— tracked files, minus skip directories, minus a binary-extension set —
and that is the right shape; an allowlist of text suffixes would
silently omit the next first-party text format. The gap is one rung up:
the binary-extension set IS the policy and almost nothing pins it. Ten
suffix classes are held by name-pinned files; the rest are held only by
six root-non-emptiness rows, which survive losing any one suffix as long
as the root keeps a single file of some other suffix.

**RE-DERIVED AT `9b15f7d`, and this is the number of record.** The card's
own figures were honest for the commit they were measured at; the corpus
has since moved. Derived by calling the shipped `corpus("CONTROL")` and
classifying with **Node's `path.posix.extname`, exactly as the module
does** — a naive shell split disagrees, because under `extname` a
dotfile has NO extension, and that row is one of the silent ones:

    CONTROL 529 files, TOKEN 118, 18 suffix classes.
    Silent (unpinned): .tsx 46, .rs 44, (no extension) 10, .js 3,
                       .jsx 2, .cts 2, .mts 1, .txt 1  =  109 files.
    109 of 529 = 20.6%.  Only .md grew since the branch: 248 -> 256.

So **eight suffix classes and 109 files can leave the gate with nothing
red**, and the two largest are exactly the classes the architect's
2026-08-18 ruling named out loud — the app's entire UI tree and the Rust
half. Confirmed by execution on the branch, not only by analysis: adding
one extension line drops all 44 Rust files and leaves the selftest, the
lint and the focused suite all green.

DELETING AN ASSERTION DELETES ITS OWN FAILURE. The scanner builds its
evidence as three self-enumerating arrays and the selftest iterates
each, failing per element; the green line then PRINTS the cardinality
and nothing compares it to anything. Measured, four deletions each
applied alone and reverted with the file restored by hash: every one
left the run green at a smaller number, and the sharpest lost the only
positive sample for each of four patterns and stayed green everywhere.
**This is poison shape five and T-078 numbers it**; the module already
records T-045 measuring exactly this class and defends precisely one
property against it.

AND THE ONE P5 POSITIVE IS THE ONE VALUE WITH NO HEX LETTERS. The report
format is load-bearing — the byte is invisible, so the report is the
only description of it a reader ever gets. The single positive control
sample is U+0000, whose hexadecimal form contains no letters, so
uppercasing is a no-op on it and the selftest cannot tell the shipped
formatter from a lowercase one. Measured: dropping the uppercase call
leaves the bare-checkout selftest at exit 0 while the focused suite reds
twice. **The suite catches it and the gate that runs first does not**,
which is the wrong way round for a property whose whole purpose is to be
readable in a checkout with nothing installed.

## Acceptance criteria
- CONTROL SHALL GAIN A COVERAGE FLOOR of the same kind TOKEN already
  has, and for the same stated reason — a policy that quietly drops a
  tree has to fail against something that did not move with it. EITHER
  a named set of suffix classes the corpus must cover, OR a check that
  every suffix present in the tracked file list minus the binary set is
  present in the corpus. **The second is preferred**: it cannot go stale
  when a new first-party text format arrives, which is the property the
  deny list was chosen for in the first place. The selftest already has
  both corpora in hand when it runs.
- THE FLOOR SHALL BE PROVED TO BITE: adding a suffix class to the binary
  set SHALL red the selftest, demonstrated for at least `.rs` and
  `.tsx`, then reverted with the restoration proved by hash.
- NEITHER CORPUS COUNT SHALL BE PINNED AS A LITERAL. The executor SHALL
  re-derive, as T-058's own ruling required — 529 and 118 are this
  card's evidence, not its expected values.
- THE EVIDENCE SET SHALL GAIN A CARDINALITY OR COVERAGE FLOOR OF ITS
  OWN, so a deleted assertion fails against something that did not move
  with it. **A per-pattern floor is better than a literal count** — every
  pattern id has at least one positive sample, and the control pattern
  has at least one positive and one negative — because it survives
  honest additions and still catches a removal.
- P5 SHALL GAIN A SECOND RUNTIME-BUILT POSITIVE SAMPLE whose forbidden
  byte renders with a hex LETTER, and whose expectation names the
  rendered string LITERALLY rather than recomputing the formatter. The
  negative sample stays; the allowlist stays at zero. **The general form
  SHALL be recorded in the notes**: a sample whose expected value is
  produced by re-running the production formula pins the pipeline, not
  the format — the focused suite has the same property and only catches
  the mutation because it happens to test bytes whose hex has letters.
- THE GATE SHALL DISTINGUISH "COULD NOT RUN" FROM "FOUND SOMETHING".
  Today a tree the gate cannot read (git absent, the corpus underivable)
  and a tree with a real violation both exit 1, so CI's first step
  cannot say which happened. A distinct exit code for the underivable
  case SHALL be added and **T-078's legend criterion SHALL gain the row
  when this lands**; the two cards are written so neither blocks the
  other.
- THE SAMPLE CONSTRUCTION DISCIPLINE SHALL HOLD: every positive control
  sample is built at runtime from a character code and never typed into
  the source, because a source file carrying a literal control byte
  would trip the gate it is testing and would itself be unsearchable.

Verification: headless — the lint, the selftest, and the focused suite,
each with its mutation applied alone and reverted, restorations proved
by hash rather than by a clean `git status`.

## Implementation notes

## Verdicts
