---
id: T-088-s1
title: A card transcribed the docs-gate reader census, and it was stale by the time it dispatched
status: suggested
suggested_by: executor claude-opus-5 @T-088
---

T-088's own last acceptance criterion reads *"THE DOCS GATE will fire on
`docs/architecture/components/` (five readers, three suites at the fifth
-triage census)"*. Derived at the lane's tip `a2a691b` by asking the gate
directly — `node tools/e2e/scripts/docs-gate.mjs
docs/architecture/components/C-15-dispatch.md` and the three fixture
paths, root-relative, as ARGUMENTS — the tree says **SEVEN readers across
FOUR suites**, and the joining suite is `cargo test`, through
`app/src-tauri/crates/nputer-index/tests/arch.rs`. Neither number was
right and the missing suite is the one no TypeScript reader would have
suggested.

**This is the failure `docs/CONVENTIONS.md`'s own DOCS GATE bullet
already removed from ITSELF, reappearing one document over.** That
bullet says, in as many words: *"NO COUNT IS TRANSCRIBED INTO THIS
BULLET, AND THAT IS THE POINT"* — it used to carry the census as digits,
claimed twelve where the tree held eleven, and was green and wrong at
two refs before anyone re-measured. The remedy written there is `node
tools/e2e/scripts/docs-gate.mjs --census`, *"and it cannot be stale
because it is not written down"*. The remedy was applied to the bullet
and not to the seat that writes CARDS, so the digits simply moved into
the card that cites the bullet, and from there into a dispatch brief
that transcribed the card verbatim.

The damage here was nil — the executor ran the gate rather than the card
— but the failure mode is the one this repository keeps paying for: a
figure that reproduces is the only kind worth quoting, and a card is
read by exactly the session least able to know the figure has moved.

**The fix, and it is one sentence in one place**: a criterion that
depends on the gate's answer should NAME THE COMMAND, not its output —
"the DOCS GATE will fire; ask it what it owes and run that" — the same
shape `index --check`'s bullet already uses (*"ASK THE GATE INSTEAD OF
PREDICTING"*). Fence: `docs/CONVENTIONS.md` plus whichever of
`method/interview/decomposition.md` or `method/roles/orchestrator.md`
owns criterion-writing. It belongs beside `T-105`'s sweep for rules
everyone believes are written down, and beside `T-101-s4`, which is the
same defect in a quotation rather than a count.
