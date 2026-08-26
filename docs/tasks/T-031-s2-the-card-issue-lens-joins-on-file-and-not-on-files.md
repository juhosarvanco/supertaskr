---
id: T-031-s2
title: The card-issue lens joins on `file` and skips every issue that carries `files`
status: parked
suggested_by: executor claude-opus-5 @T-031
---

T-031 built `issuesByFile` (`app/src/lib/board-model.ts`) to the
criterion as written — *"a pure lens joins model.issues to cards by
their `file` field"* — so it indexes only the issues that name ONE
file. Every cross-file kind is skipped: `duplicate-id`, `aliased-id`,
`dependency-cycle` and `ambiguous-mapping` all carry `files: string[]`
and reach no card face at all.

That is a defensible reading and it was taken deliberately rather than
by omission: an issue about a PAIR of records is not a statement that
either record's own file is wrong, and marking both cards with a
sentence about their relation would say something the frontmatter does
not. Both surfaces those kinds already have are unchanged — the
column's `aliasedWith` disclosure (T-097) and the header strip's
`modelIssueRows` (T-077), which reads paths the other way round and
does it with `issueFiles` in `docs-model.ts`.

**BUT THE OTHER READING IS NOT OBVIOUSLY WRONG, and the tree already
has the primitive for it.** `issueFiles(issue)` in `docs-model.ts` is
exactly the READ-THE-FIELD-NEVER-THE-KIND helper that returns the
distinct files an issue names in EITHER shape, and it was written for
the strip. A task-space `duplicate-id` names two task files, both of
which draw cards, and a reader looking at either card arguably wants to
know its id is claimed twice — that is a fact about the file in front
of them, not only about the pair.

Two costs to weigh, which is why this is a suggestion rather than a
change:

1. **A dependency direction.** `board-model.ts` is C-08 and
   `docs-model.ts` is C-10; C-08's `depends_on` is `[C-06, C-09, C-11]`
   and does not name C-10. Importing the helper adds an undeclared
   C-08→C-10 edge — live drift the map shows and the architect rules
   on, which this repo tolerates but which is a decision, not a detail.
   Re-implementing the field read inside `board-model.ts` instead is
   the T-057 defect (one rule, two implementations).
2. **`docs/ROADMAP.md` is not a card.** Two of the four cross-file
   kinds routinely name it, and a feature `aliased-id` names it TWICE
   by contract, so the join would have to drop those silently — the
   same asymmetry that made T-077 rule its own rows inert rather than
   clickable.

The narrow version is worth considering on its own: join `files` only
for `space: 'task'`, which is the one case where every named path is a
card.

## PARKED — eleventh triage, 2026-08-26

Real and still true; not now. **UN-PARK WHEN:** C-08 declares C-10 for any other reason — the helper import is then free and the objection evaporates. The narrow fix today buys a new undeclared edge exactly when the registry has been driven to one undeclared row.
