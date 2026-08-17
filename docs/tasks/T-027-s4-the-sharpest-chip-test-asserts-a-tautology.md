---
title: The chip suite's sharpest-billed test asserts a tautology, and its driver is a hand-copy of the chat's effect
status: suggested
suggested_by: verifier claude-opus-5 @T-027
---

Two small things in `app/test/interview-model.test.ts`, both in the same
`describe`, neither of which breaks criterion 3 — the criterion is
genuinely proven elsewhere — but both of which are the shape this
project has now caught six times ("a card's own numbers are a claim to
verify", and the four deletable hook properties before that).

## 1. `f(x) toEqual f(x)` is billed as the sharpest test in the file

The test is headed **"THE SHARPEST TEST IN THIS FILE, and the proof that
no causation was inferred"**:

    it("a human writing the file in a terminal produces an IDENTICAL chip", () => {
      const byPlanner = bank([{ seq: 2, files: { "docs/NORTH_STAR.md": "written" }, at: 1 }], docs(1, {}));
      const byHuman   = bank([{ seq: 2, files: { "docs/NORTH_STAR.md": "written" }, at: 1 }], docs(1, {}));
      expect(byHuman).toEqual(byPlanner);
      expect(byHuman.get(1)).toEqual(["docs/NORTH_STAR.md"]);
    });

`byPlanner` and `byHuman` are the same pure function called with
byte-identical arguments. `expect(byHuman).toEqual(byPlanner)` is
therefore true for **any** deterministic implementation of `bank`,
including one that read model output — it asserts determinism, not
"no causation was inferred". Verified by the verifier: the line can be
deleted and the suite stays green.

**The load-bearing half is the second assertion** — a chip is produced
from a script with no event stream in scope at all — and that half is
real. The property is also driven through the REAL chat effect in
`interview-chat-dom.test.tsx` ("a file landing after the turn chips
against it", "a turn whose activity labels name docs paths produces ZERO
chips"). So criterion 3 holds; it is the marquee line that is
decorative.

**The cheap fix that would make the name true:** build `byPlanner` from
a script that DOES carry planner events (a `started` + `completed` whose
text names the file) and `byHuman` from one that carries none, then
assert the two chip maps are equal. That compares two genuinely
different inputs and would red if any event channel ever reached the
chip diff.

## 2. `bank()` is a second spelling of the chat's observation loop

The helper says it replays the loop "exactly as `InterviewChat`'s effect
does it", but it is a hand copy, and it has already drifted by one
clause:

    // bank()
    if (state.seq > baseline.seq) baseline = bankBaseline(state);

    // InterviewChat.tsx
    if (docs.seq > baseline.current.seq || docs.projectDir !== baseline.current.projectDir)
      baseline.current = bankBaseline(docs);

The project-switch re-baseline is not exercised by any of the eight
tests that use `bank()`. `bankedSince`'s own project guard IS tested
directly, so nothing is unpinned — but this is a parallel implementation
of the exact code under test, which is the thing T-041's
`commitPickOutcome` argument and §1's single-reduction rule exist to
prevent one layer down.

**The fix:** either export the observation step from
`interview-model.ts` as a pure `observeBanking(baseline, docs, active,
chips) -> { baseline, chips }` and have both the chat and the test call
it, or drop `bank()` and drive these eight cases through the real effect
in the DOM suite, where three of them already live.

## Why this is filed rather than fixed

It is test-quality work inside a suite that is otherwise strong, it
touches no shipped code, and it wants the small refactor above rather
than an edit made in passing at verification time.
