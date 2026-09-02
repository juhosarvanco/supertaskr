---
id: T-215-s7
title: "`citationDrift`'s first arm binds only a code the HONEST LIMITS block SPELLS, and today one of the four does — three of `lane-fence.mjs`'s declining codes can have their limit citation moved with nothing red"
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [.claude/hooks/lane-fence.mjs]
suggested_by: "executor claude-opus-5@subagent @T-215-s2"
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE RESIDUE `T-215-s2` DECLARED RATHER THAN DISCOVERED, AND IT IS
MEASURED.** That card closed the wrong limit number in
`.claude/hooks/lane-fence.mjs`'s decline list and gave the claim its
first keeper, `citationDrift` in `tools/e2e/tests/lane-fence.spec.ts`.
The keeper's first arm traces a `` `code` (limit N) `` citation back to
the numbered limit whose TEXT spells that code — and only
`no-path-to-judge` is spelled inside the HONEST LIMITS block. This is
the same fact that made `T-215-s1` take the exported frozen
`DECLINE_CODES` as its authority instead of grepping the header, so it
is not new; what is new is that a keeper now depends on it.

**MEASURED IN `T-215-s2`'s LANE**, on a planted copy read back through
the same `readFileSync` the subject uses: moving
`not-judged-detached`'s citation from *(limit 3)* to *(limit 7)* leaves
`citationDrift` returning an empty complaint list. Arm two does not
cover it either — only `no-path-to-judge`'s decline carries a
`(limit N in this file's header)` string, because it is the only
decline whose limit a refused session is told about.

So three of the four declining codes — `not-a-repository`,
`not-judged-detached`, `not-judged-lane-list` — are cited in the header
by a number nothing reads. That is exactly the state
`no-path-to-judge` was in at `1886cc7`, and exactly how its citation
drifted through `T-199` unnoticed.

## The fix, and why it is a change to the HOOK and not to the spec

The keeper cannot bind what the header does not spell. Closing it means
giving each numbered limit a greppable handle for the code it produces —
naming `not-a-repository` inside limit 2, `not-judged-detached` inside
limit 3, `not-judged-lane-list` inside limit 4 — after which
`citationDrift`'s existing first arm covers all four with no change to
the body at all. **THAT IS A CHANGE TO A GUARD'S HEADER AND IS PRICED
LIKE ONE**: it is prose in `.claude/hooks/lane-fence.mjs`, it must not
move a verdict, a code or a message, and the three numbered limits it
touches are read by `headerLimitNumbers`, so the count and the ordering
it publishes to `docs/CONVENTIONS.md` must come out unchanged.

**IT WAS OUT OF `T-215-s2`'s SCOPE RATHER THAN OUT OF ITS FENCE**, and
the distinction is worth keeping: that card's fence held the hook, but
its criteria were *"the header only"* and named one code's one number.
Widening a guard's header to three more codes under a card that asked
for one character is the scope creep a blind verifier is right to
reject, so it is a card.

## Acceptance criteria

- Each numbered limit in `.claude/hooks/lane-fence.mjs`'s HONEST LIMITS
  block that a declining code comes from SHALL spell that code, so that
  `citationDrift`'s first arm binds every entry in `DECLINE_CODES`.
- `headerLimitNumbers`'s answer SHALL be unchanged — the same numbers in
  the same order — and the existing keeper comparing it to
  `docs/CONVENTIONS.md` SHALL stay green with no edit to the page.
- Everything below the hook's leading block comment SHALL be
  byte-identical, proven by hash: no verdict, code or message moves.
- A POSITIVE CONTROL SHALL red on a planted header that moves a
  citation for a code OTHER than `no-path-to-judge` — the plant that
  passes silently today.
- Verification: headless.
