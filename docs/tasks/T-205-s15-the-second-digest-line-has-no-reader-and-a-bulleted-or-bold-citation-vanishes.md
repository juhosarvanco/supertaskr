---
id: T-205-s15
title: "The second digest line has no reader — every recent verdict cites its ground truths on a line of its own, in two spellings the method never ruled, and the checker collects `attack set:` alone, so a corrupted ground-truths file exits 0; a bulleted or bold citation vanishes the same way"
feature: F-06
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "verifier claude-fable-5-1@subagent @T-205-s1, 2026-09-09"
blocked_by: []
touches: [tools/method-evals/, docs/CONVENTIONS.md, method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: `T-205-s1`. DISPOSITION HINT: **needs a spelling ruling
first, then promote at S.** The architect rules the line (`ground
truths:` or `ground truth:`, and whether `seal:` is a third), CONVENTIONS'
bench bullet spells it beside the attack-set line, and only then the
checker's `SITE` gains it and a fixture card carries it — a lane that
picked a spelling would be ruling method text, which is why T-205-s1's
verdict filed this rather than assigning it.

## The finding

Measured at `faf1b69`, on T-205-s1's verification bench:

- The board carries 14 `attack set:` citations in 12 cards, every one
  collected, and **16 `ground truth(s):` lines in 12 cards — 13 spelled
  `ground truth:`, 2 spelled `ground truths:` (T-248:670, T-264:353) —
  plus one `seal:` line (T-239:222); none is collected.**
  `tools/method-evals/verdict-digest.mjs`'s `SITE` is
  `^[ \t]*attack set:[ \t]*sha256:`, and MF-09's grammar is that line
  and nothing else.
- A card whose attack-set line verifies and whose ground-truths line
  cites a wrong digest **exits 0** (probe P22 in the verdict). No method
  file, CONVENTIONS or reference chapter spells the second line:
  `docs/reference/07-verification.md` phase 2 step 6 requires "the
  ground-truth digest on lines of their own" and gives no spelling;
  `method/roles/verifier.md` says the record is "hashed BESIDE the attack
  set". Two spellings on the board is the consequence.
- The same anchor drops a citation written as a list item (a line
  opening `- ` before the words) or in bold (`**` before them): 0 cited,
  exit 3 when the card is walked alone, and **silent inside a board
  walk** (probes P21, P21b). Zero such lines on the board today. The
  T-901 fixture holds the anchor's other edge — prose that QUOTES the
  grammar must not be a citation — so any widening owes both fixtures.

## What closes it

One ruled spelling in CONVENTIONS' bench bullet; `SITE` widened to the
ruled line or lines; a fixture card carrying a verifying attack-set line
beside a corrupted ground-truths line, expected exit 1 and named in
`MF-10`'s expectations; and the list-item and bold cases either ruled out
("a line of its own" means the line opens with the words) and pinned by
a fixture expecting 0 cited, or admitted and collected.
