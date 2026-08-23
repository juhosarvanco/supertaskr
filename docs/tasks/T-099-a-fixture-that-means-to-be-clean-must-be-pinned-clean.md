---
id: T-099
title: A clean-state assertion against an unpinned fixture is an assertion about nothing — the sibling of the negative-control rule, with two sightings four hours apart
feature: F-02
milestone: 4
priority: 55
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-077-s5 (sixth triage, 2026-08-20). That file is removed in
this commit.

**Found by building T-077, in a fixture months of merges had read.**
`BASE_FILES` in `app/test/watcher-truth.test.tsx` is the "clean board"
every body in that file starts from — five bodies, all mounted through
`mountAndApply` (verified live at `4d2f03c`). It was not clean:

- its backbone bullet was a NUMBERED line, and `parseRoadmap` matches
  `- F-NN:` and nothing else, so the roadmap parsed **zero features** —
  and reported nothing, because an empty backbone is a legal state
  rather than an error;
- its task carried `status: building` with no `feature`, `milestone`,
  `priority` or `size`, so it parsed into a record carrying **four**
  `missing-field` issues.

**The board therefore read `1 tasks · 0 features · 4 issues` throughout
that file**, while its second body asserted *"recovery clears the chip
and the strip"* against an EMPTY details strip. **The assertion passed
for the wrong reason** — the strip could not show a counted issue at all,
which is the exact defect T-077 was filed to close. Closing that defect
turned the body red, and the fix was the FIXTURE: every assertion in the
file is byte-unchanged and 5/5 pass.

**The general shape is what makes this a card.** A test that asserts an
ABSENCE against a fixture nobody pinned is asserting against whatever
the fixture happens to be. It is the sibling of *A NEGATIVE ASSERTION
NEEDS A POSITIVE CONTROL* (T-060-s2, already in CONVENTIONS): that rule
says a refusal must first prove the fixture would otherwise have been
ACCEPTED; **this one says a clean-state assertion must prove the fixture
is CLEAN.** Both fail identically — *"expected nothing, got nothing"* is
satisfied equally by the property holding and by the fixture being
broken — and counting the assertions catches neither.

**A SECOND SIGHTING, four hours apart, in the same lane.** T-077's own
poison drill found the identical shape in its NEW file: a body asserting
"no issue rows" ran after a sibling had banked a good roadmap into the
store's last-good map, so it was asserting against an empty model rather
than against the rule. Same fault, opposite direction — one fixture too
broken to show anything, one too empty.

**The cheapest close is a shared helper, not a rule.** A one-line
`expectCleanModel(container)` — or an assertion inside `mountAndApply`
itself — reading the `docs-model` element's counts and requiring `0
issues` / `0 failures` / `0 skipped` before a body proceeds. Every
"clean board" fixture then states its own precondition, and a fixture
that silently rots reds where it rotted rather than three cards later.

**The stronger version has a live obstacle.** `[data-testid="docs-model"]`
carries `data-failure-count` and `data-skipped-count` and **no
`data-issue-count`** (verified at `4d2f03c` in `app/src/App.tsx`), so
every body that wants the issue count today parses the human-facing
counts STRING. T-077 deliberately did not add the attribute; a helper
that parses prose is a helper that reds on a rewording.

**How many fixtures this touches is unknown and SHALL be measured rather
than guessed**: the sweep is every `app/test/**` body that mounts `App`
and asserts a diagnostic is absent.

## Acceptance criteria

- **A SHARED PRECONDITION HELPER SHALL EXIST** and SHALL be used by
  every clean-board body the sweep finds: it reads the model's counts
  and requires zero issues, zero failures and zero skipped BEFORE the
  body proceeds.
- **THE HELPER SHALL FAIL LOUDLY AND EARLY**, naming the fixture and the
  non-zero count, so a rotted fixture reds where it rotted. A helper
  that returns a boolean the caller may ignore does not satisfy this.
- **THE SWEEP SHALL BE RUN AND ITS RESULT RECORDED even if it is
  short**: every `app/test/**` body that mounts `App` and asserts a
  diagnostic is absent, listed with whether it now carries the
  precondition or why it does not.
- IF the helper needs a machine-readable issue count THEN
  `data-issue-count` SHALL join the two attributes already on
  `[data-testid="docs-model"]`, and the card SHALL state that it did so
  rather than parsing the human-facing string — a helper pinned to prose
  reds on a rewording. IF the attribute is refused THEN the reason SHALL
  sit beside the helper.
- **THE ORIGINAL FAILURE SHALL BE RE-CREATED AND SHOWN RED**: restore
  the pre-T-077 `BASE_FILES` (numbered bullet, four missing fields) and
  require the helper to red on it, with the message read back. A
  precondition that was never shown failing is the shape this card is
  about.
- **THE RULE SHALL BE WRITTEN WHERE ITS SIBLING LIVES.** CONVENTIONS
  carries the negative-control rule; the clean-fixture rule is the same
  lesson from the other side and a reader meeting one SHALL meet the
  other. (This is also the second instance T-105's sweep counts — a rule
  everyone believes is written, and is not.)
- NO CRITERION IS MET BY FIXING `watcher-truth.test.tsx` ALONE — that
  fixture is already fixed. The finding is the class.

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated; the pre-T-077 fixture restored in a scratch
copy and the helper shown RED against it, message read back. POISON
DRILL on the helper itself: mutate its threshold one side only, require
the RED, read the mutated text back before running, restore and prove by
sha256 at the drill's own commit. IF the CONVENTIONS clause lands here
rather than in T-105 THEN the DOCS GATE fires — run what it owes.
@human: none.
