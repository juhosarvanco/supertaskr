---
id: T-317-s3
title: "A fresh generation of the behaviour census differs from the committed page with no commit to a spec file between them, and since T-317 the generation also refuses outright on a tree whose parser is not built — the census's inputs are wider than the tree it claims to be a function of"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-317, measured in the lane while checking that its own diff did not move the census"
blocked_by: []
touches: [tools/e2e/scripts/capabilities.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The census document says it is deterministic: no timestamp, files in
alphabetical order, tests in file order, so the check is a byte comparison
and a clean regeneration is a zero-byte diff.

Measured in the T-317 lane at its base, with that lane's own changes
stashed: the committed page is 95835 bytes and a fresh generation is 95959.
No commit between the merge that last wrote the page and that base touches
a spec file or a script. So a fresh generation is not a function of the
tracked tree alone.

The likely reason is the generator's own honest-omission path: it RESOLVES
a parametrised test's iterable by importing the module that exports it, and
what an import answers depends on what is installed and built beside it. The
T-317 lane made that visible from the other side — with the parser's build
output moved aside, the census check answers 3 and names the build order,
where before it would have answered over whatever it could still import.

## Acceptance criteria

- WHEN a fresh generation is compared with the committed page on a tree nobody has touched THE two SHALL be equal, and where an input outside the tracked tree can move the census THAT input SHALL be named in the document rather than left to be discovered by a byte count.
- WHEN the generator cannot resolve an iterable because a module it must import will not load THE run SHALL answer that it could not run, naming the module and the repair, rather than emitting a census one sentence shorter; a body SHALL drive both halves.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

### The seat's note, 2026-09-13 (appended at the merge; nothing above rewritten)

The 124 stale bytes this card measured at the lane's base afb22cdc were the census's missing sentence for T-311's correction 2, a body the seat applied by hand after the merge verb's own regeneration step; the seat regenerated the census on main at 8648439a, one commit after this lane was cut, and CI's checks job went green on it. So the first half of this card's finding is retired by that commit. The second half stands and is the card's reason to remain filed: since T-317 the census generation refuses on a tree whose parser is not built, so the generator's inputs include a build the tree does not carry.
