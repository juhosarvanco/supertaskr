---
id: T-077-s5
title: A fixture that means to be clean has to be PINNED clean, or the assertion beside it is about nothing
status: suggested
suggested_by: executor claude-opus-5 @T-077
---

**FOUND BY BUILDING T-077, IN A FIXTURE EIGHT MONTHS OF MERGES HAD READ.**
`app/test/watcher-truth.test.tsx`'s `BASE_FILES` is the "clean board" every
body in that file starts from. It was not clean:

- its backbone bullet was `1. **F-01 — Thing** — prose`, a NUMBERED line.
  `parseRoadmap` matches `- F-NN:` and nothing else, so the roadmap parsed
  **zero features** — and reported nothing, because an empty backbone is a
  legal state rather than an error;
- its task carried `status: building` with no `feature`, `milestone`,
  `priority` or `size`, so it parsed into a RECORD carrying **four**
  `missing-field` issues.

The board therefore read `1 tasks · 0 features · 4 issues` throughout that
file, while its second body asserted *"recovery clears the chip and the
strip"* against an EMPTY details strip. **The assertion passed for the
wrong reason**: the strip could not show a counted issue at all, which is
the exact defect T-077 was filed to close. Closing it turned that body
red, and the fix was the FIXTURE — every assertion in the file is
byte-unchanged and 5/5 pass.

**THE GENERAL SHAPE, which is what makes this worth a card.** A test that
asserts an ABSENCE against a fixture nobody pinned is asserting against
whatever the fixture happens to be. It is the sibling of *A NEGATIVE
ASSERTION NEEDS A POSITIVE CONTROL* (T-060-s2, in CONVENTIONS): that rule
says a refusal must prove the fixture would otherwise have been accepted;
this one says a **clean-state** assertion must prove the fixture is clean.
Both fail the same way — "expected nothing, got nothing" is satisfied
equally by the property holding and by the fixture being broken — and
counting the assertions catches neither.

**IT IS ALSO A SECOND SIGHTING OF THE SAME MECHANISM.** T-077's own poison
drill found the identical shape in its NEW file: a body asserting "no
issue rows" ran after a sibling had banked a good roadmap into the store's
last-good map, so it was asserting against an empty model rather than
against the rule. Same fault, opposite direction, four hours apart.

**Cheapest close — a shared helper, not a rule.** A one-line
`expectCleanModel(container)` (or an assertion inside the existing
`mountAndApply`) reading the `docs-model` element's counts and requiring
`0 issues` / `0 failures` / `0 skipped` before a body proceeds. Every
"clean board" fixture in `app/test/**` then states its own precondition,
and a fixture that silently rots reds where it rotted rather than three
cards later. **The stronger version worth considering**: make the counts
readable as a `data-issue-count` attribute beside the existing
`data-failure-count` / `data-skipped-count` on `[data-testid=docs-model]`
— T-077 deliberately did not add one, and every body that wants the issue
count today parses the human-facing counts STRING.

**How many fixtures this touches is unknown and should be measured, not
guessed**: the sweep is every `app/test/**` body that mounts `App` and
asserts a diagnostic is absent.
