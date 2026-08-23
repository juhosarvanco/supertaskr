---
id: T-013-s2
title: The frontend IPC census can be stepped around by omitting a type argument, and it can be FED by a comment — measured twice on one card
status: suggested
suggested_by: executor claude-opus-5 @T-013
---

`frontendCommands()` in `app/test/crescendo-dom.test.tsx` is the census
that guards which commands the webview may reach. It finds call sites
with a single regex over RAW SOURCE, requiring an invoke that carries a
type argument. Both halves of that are load-bearing in the wrong
direction, and T-013 hit each once, by accident, in the same hour.

**ONE — A BARE CALL IS INVISIBLE.** The first draft of
`app/src/architecture/churn-source.ts` called the new command without a
type argument. It compiled, it worked, the census reported the same ten
commands it reported the day before, and the suite was GREEN with an
ELEVENTH command live in the bundle. The type argument was added
specifically to make the call visible; nothing forces it. A future
author who writes the idiomatic untyped call gets a silent pass on the
one gate that exists to catch a widened IPC surface.

**TWO — A COMMENT IS A CALL SITE.** The comment written to explain that
fix spelled the matched shape inside backticks. The census read it and
reported a command named `name`, failing the assertion with a phantom.
Funny in that direction; the other direction is not. The scan is over
raw text with no comment stripping, so a commented-out or merely
illustrative invoke both COUNT — and the Rust half of the same body
already strips `//` comments out of `generate_handler!` before counting,
precisely because two comments containing commas once inflated it to
fifteen. One end of the census strips comments; the other does not.

**THE FIX IS THE SHAPE THE RUST HALF ALREADY USES**: blank comments and
strings before matching, and match an invoke with or without a type
argument. `tools/e2e/scripts/token-scan.mjs` masks source before its own
patterns run for the same reason, and `lib/parser/src/inert-spans.ts`
(T-055) is a ready position-preserving blanker if the app suite is
willing to import from the parser package.

**WHY IT IS NOT FIXED HERE**: it is a change to the census body itself,
which is a shared gate rather than this card's subject, and widening the
regex is the kind of edit that wants its own before/after count on the
whole tree. This card conformed to the census instead — which is the
right move for a card and the wrong long-run answer for a gate.
