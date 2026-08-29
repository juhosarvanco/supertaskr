---
id: T-160-s3
title: Asking for the preflight always emits the whole brief, because the task id is both the card selector and arm one's trigger
feature: F-04
milestone: 4
priority: 5
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-160
builder:
verifier:
built_by:
verified_by:
review:
---

## The shape

`--preflight` requires `--task`, and in `brief.mjs` a non-empty task id
is what makes arm one print the whole thirteen-row brief. So a
dispatcher who wants only the preflight gets the brief above it every
time, and a dispatcher re-running the preflight after correcting a card
pays for the brief again.

**IT IS NOT A DEFECT AND THAT IS WHY IT IS A SUGGESTION.** The dispatch
ritual is derive the brief, preflight, write the fence — one invocation
that does all three in order is the intended shape, and `--write-fence`
has carried the identical coupling since T-154 with nobody minding.
What makes it worth a card is the RE-RUN: correcting a card and asking
again is the loop this mechanism creates, and it is the one case where
the brief is pure noise.

## Acceptance criteria

- THE seat SHALL decide whether the card selector and arm one's trigger
  are separable without breaking the read arms' current invocations,
  which tools/e2e/tests/brief.spec.ts pins.
- IF they are separated THEN every existing spelling in
  docs/CONVENTIONS.md and in the specs SHALL keep its current output,
  pinned rather than asserted.
