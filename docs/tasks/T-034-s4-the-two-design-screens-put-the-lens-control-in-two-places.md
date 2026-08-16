---
id: T-034-s4
title: The two design screens put the lens control in two places — T-034 picked one, and it is an @human call
status: suggested
suggested_by: executor claude-opus-5 @T-034
---

The design bundle draws the lens control TWICE, in two different homes,
and it cannot be both:

- **`map` (architecture), light and dark** — the control sits in the
  header's LEFT group, between the `map` wordmark and the search field.
  README's measured pane-header spec states that order in prose:
  "Left group (14px gap): wordmark `map` …; lens segmented control;
  search field."
- **`map · tasks`** — the header is `map · tasks` + a one-line subtitle
  on the left, and the control is pushed to the FAR RIGHT of the header
  (`justify-content: space-between`), where the architecture screen puts
  its overlay control.

T-034 shipped **one home for both lenses: the left group**, on the
grounds that a segmented control which jumps 900px across the header the
instant you use it is a defect rather than a design, and that the
architecture screen's placement is the one the README writes down as the
spec. The tasks lens's subtitle takes the slot the search field occupies
on the architecture lens, so the row's shape is stable across the
switch: `wordmark · lens control · (search | subtitle)`.

That is a judgment call made by a builder reading two mockups, and it is
exactly the kind of call the human should look at rather than inherit.
The counter-arguments are real:

1. On the tasks screen the control is the ONLY thing in the right group
   — moving it left leaves that whole side empty, which is why the
   designer probably put it there.
2. The tasks header genuinely has less in it (no search, no overlay
   control, no indexed-at, no Re-index — all architecture chrome, all
   absent per the design's own tasks screen), so "the row's shape is
   stable" is already only half true.

Cheapest alternative if the human prefers the mock: keep the control's
markup identical and move it into the right group ONLY on the tasks
lens — three lines, and the round-trip DOM-identity test in
`map-tasks-lens-dom.test.tsx` still holds, because it measures the
architecture lens.

Related: the deviation table in T-034's notes records this alongside the
value-level deviations, so a verifier reading only the notes sees it.
