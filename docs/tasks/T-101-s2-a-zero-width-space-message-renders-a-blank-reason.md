---
id: T-101-s2
title: A message of only U+200B survives denialLine's blank test and renders a blank reason — the toolName half of this finding is closed
status: suggested
suggested_by: verifier claude-opus-5 @T-101-verify
---

**HALF OF THIS FINDING IS CLOSED IN T-101'S OWN LANE, and the file is
narrowed to the half that is not.** As filed it named two instances of
one class in `denialLine` (`app/src/genesis/interview-model.ts`): a blank
`toolName` slipping past `??`, and a message of only U+200B slipping past
`.trim()`.

## Closed — the blank `toolName`

`const tool = denial.toolName ?? "a tool"` let `""` and `"   "` reach the
template, rendering `refused:  — <message>` with the name silently
missing. Closed on T-101's rebuild: the name now has ONE owner,
`denialToolName`, which trims and maps empty to `null`, and both callers
— `denialLine` and the new `visibleDenials` — go through it, so the name
that is PRINTED and the name that suppression is KEYED ON cannot diverge.
Pinned by a fourth degenerate row (`toolName: "   "`, message populated)
in `app/test/interview-chat-dom.test.tsx`, spelled with whitespace rather
than `""` on purpose: `""` is falsy and reds a `??`-shaped mutant, while
`"   "` reds a trim-less one as well.

The reachability argument in the original filing still holds and is worth
keeping: `denial_field` in `runner.rs` does
`.map(str::trim).filter(|s| !s.is_empty())`, so the producer cannot emit
a blank name today. What changed is that the renderer no longer DEPENDS
on that — an invariant in another language, in another fence, that
nothing on this side recorded.

## Open — a message of only U+200B

`denialLine` decides "no message" with
`denial.message.trim().length === 0`. The zero-width space is not
ECMAScript `WhiteSpace`, so a message of one U+200B is a message: the row
renders `refused: WebFetch — <U+200B>`, 21 characters — a reason that is
blank on screen and non-empty in the string. Measured by T-101's
verifier, not theorized.

**Deliberately not folded into the fix above**, because it is not the
same kind of change. Trimming a blank name is a normalization with one
right answer; widening the blank-MESSAGE test is a DECISION about what
counts as "the CLI gave no reason", and the candidates differ — strip
`\p{Cf}` format characters, strip all Unicode whitespace, or leave it
alone on the ground that a CLI emitting a zero-width space as its whole
explanation has said something and the app should not decide it did not.
Fence `[app-interview]` either way, and the same question applies to
`failureDetail` one function up, which uses the identical `.trim()` test
on every relayed CLI string — so the honest close is ONE rule for both,
not a second special case beside `denialLine`.

Low priority: unreachable from the observed CLI, and the worst case is a
row whose reason reads as empty rather than as absent.
