---
title: duplicate-id spans all three id spaces with no discriminator, now that its sibling has one
status: suggested
suggested_by: executor claude-opus-5 @T-053
---

T-053 gave `aliased-id` a required `space: 'component' | 'task' |
'feature'` field, on the reasoning that a consumer must be able to tell
the three id spaces apart WITHOUT parsing prose. Its sibling
`duplicate-id` is emitted from four places across the same three spaces
and has no such field:

    lib/parser/src/component.ts:313   duplicate component id
    lib/parser/src/project.ts:80      duplicate task id   (disk layer)
    lib/parser/src/files.ts:143       duplicate task id   (pure layer)
    lib/parser/src/roadmap.ts:48      duplicate backbone feature

The only way to know which space a `duplicate-id` came from is to read
its `message`, or to guess from the shape of `id` — which is the thing
T-053's criterion 5 just ruled out for the very same concept. A UI that
wants "show me the task problems" can now filter aliases and cannot
filter duplicates.

The fix is one field and four literals, and it is deliberately NOT in
T-053: that card's fence is aliasing, `duplicate-id` predates it, and
widening a done kind's shape inside a task that did not ask for it is
how unrelated pins start moving. It DOES move pins — `duplicate-id` is
asserted with whole-object `toEqual` in several suites — so it wants to
be somebody's declared criterion rather than a drive-by.

Worth doing together with it: `roadmap.ts`'s feature `duplicate-id`
carries `files: [file, file]` for the same reason the feature alias does
(both declarations live in ROADMAP.md), and it already solves that by
putting both line numbers in the message. If `space` lands, the two
messages should end up saying the same kind of thing in the same shape.
