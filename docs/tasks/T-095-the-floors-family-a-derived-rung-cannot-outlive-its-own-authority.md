---
id: T-095
title: The lint's derived rungs take their expectation from the same listing as their subject, a reclassification slips past every count floor, and the report promises a line number it never prints
feature: F-02
milestone: 4
priority: 51
size: M
status: planned
blocked_by: []
touches: [tools/e2e, app-map]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — remove before landing.** `T-080-s7` proposes a new
> poison ordinal ("shape nine"). T-092 is the taxonomy pass and should
> MINT the number; this card should CITE it. If the two land out of
> order, this card names the shape and leaves the ordinal to T-092 —
> two cards minting one number is the defect the taxonomy exists to
> prevent. Every figure below carries the ref it was measured at, and
> two of them are known to have moved since (the walk-policy count reads
> 70 at `9c64cd8` and 71 at the T-084 checkpoint `e8c4ab7`; CONTROL
> reads 513 and 590 at those same refs). That drift is the point, not a
> problem: none of these numbers is pinned anywhere.

Absorbs: T-080-s8, T-080-s2, T-080-s7, T-080-s5, T-074-s1, T-074-s2
(sixth triage, 2026-08-20). All six files removed in this commit.

**T-080 built the floor on the right asymmetry** — the expectation comes
from `trackedFiles()` while the subject comes from `corpus(CONTROL)`, so
`SKIP_DIRS` and `CONTROL_BINARY_EXTENSIONS` appear on ONE side only and
the check CAN fail. That holds and the verdict measured it four ways.
**This card is about the rungs above it.**

## ONE — every derived rung shares its own authority

All three rungs draw both sides from the same `git ls-files` call, so a
group that leaves that listing takes its own row with it. Measured
non-destructively at `9c64cd8` by pointing `GIT_INDEX_FILE` at a COPY of
the worktree index with `method/` dropped (the real index untouched, 531
tracked entries at that ref throughout): the selftest reds with exactly
**two** failures, and **both are LITERAL rows** —

    CONTROL includes method/ (0 files)
    CONTROL includes tracked text format method/runtime/nputer.yaml

**Every derived rung is silent.** `byTop` generates one row per
top-level group PRESENT, so `method/`'s rung C row does not fail — it
does not exist. `byClass` does the same: `.yaml` drops to 0 tracked
files, its rung A row vanishes, and the only reason anything noticed is
that a hand-written name pin happens to cover the one `.yaml` file in
the tree. **A class whose files all live under a vanishing directory and
that no name pin covers would leave no row and no failure at all.**

Two consequences. **The six literal `CONTROL includes <root>/` rows are
not "dominated" and the notes should stop calling them that** — verified
at `4d2f03c`, they are generated over exactly `[".github", "app",
"docs", "lib", "method", "tools"]` in `walkPolicyChecks`, and they are
the only assertions in the module that survive their own subject's
disappearance. That is poison shape five displaced from the SOURCE into
the TREE. **And the honest cheap floor is a non-emptiness row on the
authority itself** — `trackedFiles().length > 0`, and better, a derived
row asserting each name in a short list of required top-level groups is
still present in `byTop`. That converts "the row vanished" into "the row
failed".

## TWO — a reclassification is invisible to any count floor

The standing fix for shape five is a cardinality floor. **Measured at
`9c64cd8`, here is a mutation a count floor cannot see.** Declaring a
suffix class binary in BOTH `CONTROL_BINARY_EXTENSIONS` and
`CONTROL_UNCOVERED_SUFFIXES` is the workflow the module documents for a
genuine new binary asset. Applied to `.jsx` — a first-party TEXT class,
two tracked React sources — the selftest stays at **exit 0 with exactly
70 walk-policy checks**, the same number as the untouched tree, and the
lint goes green at **511 of the 513** CONTROL files tracked at that ref.
Nothing is deleted: rung A generates one row per tracked class either
way, the class simply MOVES from the "covers every tracked `.jsx` file"
family to the "excludes every tracked `.jsx` file" family, and rung C
nets out because `exempt` grows by exactly what `covered` loses. **The
count is conserved by construction**, so a floor of the form "at least N
checks" passes at every N.

**Only a CONTENT floor sees it**, and the one that exists is too narrow:
`MUST_CONTROL_COVER` is `[".rs", ".ts", ".tsx", ".md"]` at `4d2f03c` and
reds for those four and nothing else, so the other fourteen tracked
classes have a two-line silent escape. **A derived replacement exists
and was exact when measured at `9c64cd8`**: every one of the 18 tracked
files of an exempt class at that ref is byte-detectably binary — all 18
contain U+0000 AND fail a strict UTF-8 decode — while NO tracked file of
any covered class is (`.rs` 44, `.md` 240, `.jsx` 2, `.txt` 1, `.mts` 1:
zero binary by that test). A fourth rung — *every tracked file of a
class declared uncoverable must actually be binary* — reds the `.jsx`
edit loudly, needs no hand-maintained name list, derives from the TREE
rather than from a ruling, and cannot go stale when a real new asset
format arrives.

## THREE — two residual floors T-080 left open on purpose

- **The walk-policy array has no cardinality floor.** Deleting the six
  literal `CONTROL includes <root>/` rows leaves the selftest green at
  **64** checks instead of 70 (at `fef8870`). It no longer COSTS
  anything — with those rows gone, a `SKIP_DIRS` gaining `docs` still
  reds nine ways through the derived rungs — and the rows are kept for
  the reason section ONE now makes load-bearing.
- **The TOKEN negatives have a coverage floor of ONE, not of families.**
  Deleting the regex-literal negative left the selftest green at **48**
  samples (at `fef8870`), because the floor asks only that negatives
  exist. The near-misses fall into named families in the source comments
  — arbitrary variants, labeled tuples, regex literals, comments,
  selector strings — and a `family:` tag per negative with one row per
  family gives them the floor the positives already have. **The module's
  own argument is that "the negatives ARE the precision", and precision
  is currently pinned by prose.**

## FOUR — a field the report promises and never prints

`scanControlSource` maintains a `line` counter and puts it on every hit
(`hits.push({ line, offset, codepoint, id, what })`), and the CONTROL
report is `${rel}:byte ${hit.offset}: ${hit.codepoint}  [${hit.id}:
${hit.what}]` — **the line number is never printed and no assertion
reads it** (verified at `4d2f03c`; the offsets body uses `toMatchObject`
on id, codepoint and offset only). Mutating the counter to `line += 2`
survives everything at `fef8870`: selftest exit 0, lint exit 0, focused
suite 8/8. A genuine non-equivalent mutant that no body kills, at a call
site no pin names. Two honest options: DELETE it, so the hit shape stops
promising information the report cannot give; or PRINT it, since a byte
offset is the exact locator and a line number is the one a human can act
on — but that changes a documented output format and belongs to whoever
owns that legend.

## FIVE — the label beside the hit over-generalises, in three live places

**Measured at `e83ee1d` over the whole byte set P5 rejects** (thirty
values), one planted byte at a time into a real 14,289-byte copy of
`app/src/architecture/map-layout.ts`: **exactly ONE of the thirty hides
a file from a searcher.** U+0000 drops the file from `rg` (exit 1 when
it is the only match) and from `grep -rIn`, and gets `charset=binary`;
every other one of the thirty returns the line at exit 0 from all three.
And even for U+0000 the claim "returns no match at all" holds for
ripgrep and `grep -I` but NOT for plain `/usr/bin/grep`, which exits 0
and says `Binary file … matches`. **The two historical incidents split
on exactly that line**, which is how the generalisation was born: at
`832edd6^`, `map-layout.ts` carried one U+0003 and `task-waves.ts`
carried two U+0000; the commit message found the NULs first and
generalised.

Three live sites in `tools/e2e/scripts/token-scan.mjs` at `4d2f03c`
carry the too-wide sentence: the module header (*"against bytes that
make binary-skipping searchers ignore a file"*),
`CONTROL_PATTERN.what` (*"literal control character (invisible to
binary-skipping searchers)"* — the string PRINTED beside every hit) and
the selftest's evidence line. **NONE of this weakens P5**: rejecting all
thirty is right — `file(1)` calls most of them `data`, they are
invisible in an editor, and a literal separator byte in a string is a
defect on its own terms. What is wrong is only the REASON printed beside
the hit.

## SIX — the same byte predicate, written twice, with nothing checking they agree

`app/test/map-tasks-lens-dom.test.tsx`'s body *"no source file in the
pane carries a literal C0 control character"* rejects `code < 32 &&
!legal.has(code)` with `legal = {9, 10, 13}`, plus 127.
`scanControlSource` rejects `byte <= 0x08 || 0x0b || 0x0c || 0x0e..0x1f`,
plus `0x7f`. **Enumerate both: the same thirty values.** And the corpora
NEST — P5's CONTROL corpus strictly contains the
`app/src/architecture/**` tree the test walks — so since T-058 the
standing check has been a second implementation of a repo-wide gate over
a subset of its corpus, arrived at by accretion.

**The duplication is not the problem; the silence is.** Widen `legal` in
one and the other still holds the line; narrow it in one and nothing
notices. They also read differently, and the difference is real: the
test reads `utf8` and inspects UTF-16 code units, so its offset is a
STRING index, while `scanControlSource` refuses anything but a `Buffer`
precisely so its offset is a true BYTE offset. **The two report the same
hit at different numbers.** T-058's sixth criterion ordered the app-side
check preserved exactly, so deletion is refused for now; a tripwire on
ONE side, or deriving the byte set from `token-scan.mjs` the way
`workflow-parity.spec.ts` derives CI's steps, are the two live arms.

## Acceptance criteria

- **THE AUTHORITY SHALL HAVE A FLOOR OF ITS OWN**: `trackedFiles()`
  non-empty, plus a derived row per required top-level group asserting
  the group is still present in `byTop`. THE `method/`-dropped index
  experiment SHALL be re-run against the fix and SHALL red on a DERIVED
  row, not only on the two literal ones.
- **THE SIX LITERAL ROOT ROWS SHALL BE KEPT AND THEIR ARGUMENT
  CORRECTED IN PLACE** — they are not dominated; they are the only rows
  that survive their subject's disappearance.
- **A CONTENT FLOOR SHALL REPLACE OR SUPPLEMENT
  `MUST_CONTROL_COVER`'s four names**: every tracked file of a class
  declared uncoverable SHALL be shown byte-detectably binary (U+0000 and
  a failed strict UTF-8 decode). THE `.jsx` RECLASSIFICATION MUTANT
  SHALL BE RE-RUN and shown RED, and the mutated text read back before
  the run.
- IF a cardinality floor is added anywhere in this module THEN the card
  SHALL state, beside it, that cardinality answers DELETION and says
  nothing about RECLASSIFICATION — the shape T-092 numbers.
- THE walk-policy array SHALL gain a cardinality floor OR the decision
  not to SHALL be written where the array is; the six-row deletion
  (70 → 64 at `fef8870`) SHALL be re-run against whatever is chosen.
- **THE TOKEN NEGATIVES SHALL GAIN A PER-FAMILY FLOOR**, with the family
  tag on the sample rather than in a comment, so deleting the only
  regex-literal negative reds. IF families are judged the wrong axis
  THEN say which axis and why — but "the negatives are the precision"
  may not stay pinned by prose.
- THE dead `line` field SHALL be deleted or PRINTED, and whichever is
  chosen SHALL be justified at the site. IF it is printed THEN the
  documented output legend SHALL be updated in the same commit and the
  `line += 2` mutant SHALL be re-run and shown RED.
- **THE THREE `binary-skipping` SITES SHALL BE CORRECTED TO WHAT WAS
  MEASURED** — invisible in the source, and a NUL ADDITIONALLY hides the
  file from a binary-skipping searcher — and the correction SHALL NOT
  claim the file is hidden from `/usr/bin/grep`, which says so and exits
  0. THE COUNT OF SITES SHALL NOT BE TRANSCRIBED into prose; cite the
  symbol.
- **THE TWO C0 PREDICATES SHALL STOP BEING ABLE TO DISAGREE IN
  SILENCE.** Take one of: a tripwire asserting the app-side legal set is
  `{9, 10, 13}` plus 127 with a comment naming `scanControlSource`; or
  derive the app-side set from `token-scan.mjs`. Deletion is refused by
  T-058's sixth criterion — say so rather than re-litigating it.
- **EVERY COUNT THIS CARD OR ITS FIX WRITES DOWN SHALL CARRY ITS REF, and
  no criterion SHALL be met by a check that cannot fail** (T-104's
  absorbed T-080-s1): a relation between a policy and a view DERIVED
  from that policy is a tautology, and it reads exactly like a real
  check until someone tries to red it.

Verification: headless — `npm run lint:tokens -- --selftest` and
`npm run lint:tokens` from tools/e2e with both exits and both corpus
figures at this card's own ref, `npm test` from tools/e2e, and
`npm test` from app/ for the C0 body. **POISON DRILL on every new or
changed assertion**, one side only: the `.jsx` reclassification, the
`method/`-dropped index, one deleted negative per family, one removed
root row, the `line += 2` mutant. Mutated text read back with `git diff`
before each run; restores proved by sha256 against the drill's own
commit, per-path. @human: none.
