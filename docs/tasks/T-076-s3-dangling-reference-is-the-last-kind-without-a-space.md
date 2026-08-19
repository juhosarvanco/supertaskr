---
id: T-076-s3
title: dangling-reference is now the last kind spanning three id spaces with no space field
status: suggested
suggested_by: executor claude-opus-5 @T-076
---

T-053 gave `aliased-id` a required `space`; T-076 gave `duplicate-id`
the same at all four of its emit sites, on the argument that a consumer
able to filter aliases by space could not filter duplicates by it.
Derived over the whole union at the end of T-076 rather than assumed:
`dangling-reference` is the only member left that spans all three id
spaces without one. Every other multi-space-looking member is
single-space by construction — `dependency-cycle`, `id-mismatch` and
`filename-id-missing` are task-only, `ambiguous-mapping` is
component-only, `roadmap-error` is roadmap-only.

It has a `field` (`blocked_by`, `feature`, `depends_on`) and today that
value does determine the space — but only by a convention a consumer has
to learn, which is the same objection T-053's criterion 5 raised against
reading the space out of prose. `field` also answers a different
question ("which reference on the record"), so overloading it means one
value cannot later name two things: a second component-side reference
field, or a task field pointing at components, would break the mapping
silently.

Deliberately NOT done inside T-076: its criterion 3 names `duplicate-id`
and its criterion 5 names only the near-miss hint, and adding a third
required field to a third kind in the same commit would have moved a
fourth set of pins for a criterion nobody wrote. The cost is small and
known — the same conditional-spread shape, three emit sites
(`validate.ts` twice, `component.ts` once), and the whole-object
`toEqual` pins in `lib/parser/test/validate.test.ts` around the
blocked_by and feature checks plus `component.test.ts`'s
`objectContaining` ones. If it is taken, take it with the note that
T-076 already proved no app SOURCE file reads this kind: the only hits
outside `lib/parser/**` are `app/test/select-board.test.ts:507` and
`app/test/select-task-detail.test.ts:309-310`, all `objectContaining`.
