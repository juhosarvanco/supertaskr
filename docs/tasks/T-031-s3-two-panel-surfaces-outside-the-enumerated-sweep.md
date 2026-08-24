---
id: T-031-s3
title: Two panel surfaces are the same containment class as T-031's sweep and were outside its enumeration
status: suggested
suggested_by: executor claude-opus-5 @T-031
---

T-031's first criterion enumerates the surfaces it sweeps with a colon
and a list, and this lane built exactly that list. Inventorying
`TaskDetailPanel.tsx` while placing those utilities turned up two more
in the same class, both live, neither named by the criterion and
neither by `T-017-s1` before it. Both are inert today for the same
reason every surface in this family was inert until somebody wrote a
hostile file.

**The acceptance-criterion rows.** `criterionLines` splits the raw
`## Acceptance criteria` markdown and the panel renders each row as
`<span className="min-w-0">{criterion.text}</span>` inside a
`flex gap-2.5` row. It has `min-w-0` and no `break-words`, which is
precisely the half-treatment T-017 found on the title spans — the
utility that lets a box shrink, without the one that lets its text
break. A criterion carrying an unbroken run (a path, a URL, a
64-character hash — all ordinary in this project's own cards) widens
the panel's scroll context into a panel-wide horizontal scrollbar. It
is BODY text rather than frontmatter, which is presumably why the
criterion's list did not reach it; the containment question does not
care about the distinction.

**The neutral chips.** `NeutralChip` renders three values —
`detail.size`, `detail.feature`, `detail.priority` — and one of the
three is raw frontmatter the parser does not constrain to a
vocabulary. `size` is a validated `TaskSize` and `priority` is a
number, but `feature` is a free string preserved on the record even
when it names nothing in the backbone (T-019 keeps it deliberately:
*"reference preserved on the record"*). So the feature chip prints
whatever the file says. One `break-words` on `NeutralChip` covers all
three, which is why this is cheap.

Neither was built here, on scope discipline: T-031's criterion lists
its surfaces explicitly, a verifier reads the card against the diff,
and a diff that quietly does more than the card says is as hard to
review as one that does less. Both are `[app-board]` and zero tokens —
the same two-utility change this lane made seven times.
