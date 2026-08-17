---
title: A dangling reference never says that a numerically equal id is declared one file away
status: suggested
suggested_by: executor claude-opus-5 @T-053
---

T-053 closes the DECLARATION half of the padding trap: two declared ids
that differ only by zeros are now reported in all three id spaces. The
REFERENCE half is still blind. Reproduced on this branch:

    docs/ROADMAP.md          - F-01: One — a
    docs/tasks/T-001-a.md    id: T-001, feature: F-1, blocked_by: [T-01]

    dangling-reference | blocked_by names 'T-01' but no task in the
                         model declares it
    dangling-reference | feature names 'F-1' but the roadmap backbone
                         does not declare it

Both messages are TRUE and both are unhelpful in the one case that
matters: `T-001` is declared in this very file and `F-01` one line into
the roadmap. The author wrote a padding-variant of an id that exists,
and the parser tells them the id does not exist — which reads as "you
referenced something you never wrote" rather than "you wrote it with
different zeros". A human then goes looking for a missing task.

This is exactly the input T-053's card says is coming: a language model
writing a backbone and task files in one interview will spell the same
number two ways, and the reference side is where a human first notices,
because a dangling reference is what the board renders as an unresolved
chip.

The fix is a near-miss hint on the existing `dangling-reference`, not a
new kind: when a reference's slot key (`lib/parser/src/id-slot.ts`,
`idSlotKey`) matches a DECLARED id's slot key, append "— did you mean
'T-001'?" to the message. The helper already exists and both check sites
(`validate.ts:122` for blocked_by, `:132` for feature) already hold the
declared-id set, so it is a few lines in one place.

Two things to rule before building: whether the hint belongs in the
message or as a structured field (a consumer may want to offer the fix),
and whether `depends_on` in the component space gets the same treatment
(it has the same shape and the same helper available). Not done inside
T-053 because its criteria scope aliasing to declaration spaces, and
because changing a `dangling-reference` message moves pins in three
suites.
