---
id: T-205-s20
title: "A list item inside a FENCED CODE BLOCK counts as a rule — `numberedItems` and `letteredItems` read `99.` out of a sample and a citation of rule 99 resolves against text that documents nothing"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-205-s4
blocked_by: []
touches: [tools/method-evals/evals/]
builder:
verifier:
built_by:
verified_by:
review:
---

**MF-02 BUILDS ITS ITEM SET LINE BY LINE AND HAS NO IDEA WHAT A FENCE
IS.** Both anchors — `^ {0,3}(\d+)\.\s` for rules and, since `T-205-s4`,
`^ {0,3}(\d+[a-z])\.\s` for lettered sub-steps — walk `text.split("\n")`
with no state. A line inside a ```` ``` ```` block is a line like any
other, so a SAMPLE becomes a definition and a citation of it resolves.

**MEASURED, BOTH CLASSES, BOTH REFS.**

At `52fdbc3` (before `T-205-s4`), a fenced block in
`method/lane-protocol.md` —

    ```
    99. sample text inside a fence
    ```

— plus `A pointer at lane-protocol.md rule 99` in
`method/roles/executor.md` leaves MF-02 **GREEN**: *27 rule citations,
all resolving*. The citation resolved against a line that documents
nothing.

At `0bf398c` the lettered class inherits it exactly. A fenced
`9q. sample text` in `method/roles/orchestrator.md` plus `A pointer at
roles/orchestrator.md 9q` leaves MF-02 **GREEN**: *35 ordinal citations,
all resolving (9 lettered sub-steps)* — and the `9` in that count is the
tell: the sample was counted as a sub-step.

**SO THIS IS INHERITED, NOT INTRODUCED, AND THAT IS THE ARGUMENT FOR
FIXING IT ONCE FOR BOTH.** `T-205-s4` deliberately mirrored the numbered
anchor rather than inventing a second dialect — the right call, and it
is why one fix in `numberedItems` and `letteredItems` covers both
classes. A card that fixed only the lettered half would leave the two
anchors disagreeing about what a list item is, which is the drift the
shared `FILE` fragment was introduced to prevent.

**WHY IT MATTERS IN THIS METHOD SPECIFICALLY.** The method files quote
their own shapes constantly — `TASK-FORMAT.md` fences a whole YAML
block, the role files fence example commands and sample lines. A fenced
sample is the ONE place a numbered line is guaranteed not to be a rule,
and it is the place this eval is most likely to meet one. The failure is
the eval's own opening argument turned on itself: a green that means
*resolved* when it should mean *dangling*.

## Acceptance criteria

- `numberedItems` and `letteredItems` SHALL NOT count a list item that
  sits inside a fenced code block, and the exclusion SHALL be written
  ONCE and used by both.
- THE coverage count SHALL NOT fall for any citation that legitimately
  resolves outside a fence — the corpus figures at the fix's own ref
  SHALL be recorded beside the figures before it.
- A POSITIVE CONTROL SHALL plant a fenced `NN.` sample in a target file
  together with a citation of `NN` and require MF-02 to RED — the
  degradation applied where the arming is absent, and demonstrated red
  against the current fence-blind implementation before it is trusted
  passing.

## Read beside

`tools/method-evals/evals/mf-02-rule-citations.mjs` (`numberedItems`,
`letteredItems`, `isOwnDefinition` — which is the existing precedent for
a syntactic exclusion argued in the header), and `T-205-s4`'s verdict,
which records both measurements above.
