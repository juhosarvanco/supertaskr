---
title: interview-model.ts's header still says "and tested" about the test T-057 deleted
status: suggested
suggested_by: verifier claude-opus-5 @T-057
---

T-057 deleted the `byPlanner === byHuman` test — correctly; the app has no
authorship signal, so the assertion could not fail. The shipped source
that the test backed still claims it exists.

`app/src/genesis/interview-model.ts`, lines 18–26, rule 1 of the module
header:

> The consequence is deliberate and tested: a file a HUMAN writes in a
> terminal mid-interview produces an identical chip, because the chip's
> claim is "this file changed on disk at this point in the conversation"
> and not "this turn caused it".

After this commit nothing tests that. A search across `app/src` and
`app/test` for the claim returns only the comment itself:

```
app/src/genesis/interview-model.ts:22: *     and tested: a file a HUMAN writes in a terminal mid-interview
app/src/genesis/interview-model.ts:23: *     produces an identical chip, because the chip's claim is "this file
```

The same paragraph is repeated at `accelerators.ts`-style length in the
card's own framing of the pattern: "the mutant survives and **the comment
lies**". This is that, in the file T-057 edited, introduced by T-057.

Strictly this is not a criterion miss. Criterion 3 says the tautology
"and its 'sharpest proof' wording" shall be removed, and the "sharpest"
wording lived in the test file's doc comment, which is gone. The source
header uses different words for the same now-unbacked claim, and the
executor did not carry the edit across.

The fix is two words: the property is still true by construction (the
only input is the watcher's snapshot — that is the type-level argument
the file already makes in the same sentence), so the honest text is "The
consequence is deliberate and true by construction", dropping "and
tested", or naming the negative test that does survive
(`"activity labels and completed text naming docs paths produce ZERO
chips"`) as what backs it.
