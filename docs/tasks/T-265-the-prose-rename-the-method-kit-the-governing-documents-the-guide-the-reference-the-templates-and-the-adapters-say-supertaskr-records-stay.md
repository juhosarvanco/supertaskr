---
id: T-265
title: The prose rename — the method kit, the governing documents, the guide, the reference, the templates and the adapters say Supertaskr; records stay as they are
feature: F-01
milestone: 4
size: M
priority: 5
status: building
suggested_by: "@human's ruling of 2026-09-08 (ADR-022)"
blocked_by: [T-264]
touches: [method/, docs/guide/, docs/reference, docs/NORTH_STAR.md, docs/ROADMAP.md, docs/STATE-template.md, docs/VERSIONS.md, docs/business, docs/research/competitors.md, docs/checkpoints/TEMPLATE.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

After T-264 moves every identifier, the prose that names the product
and the method follows: method/README.md's first line, the role files
where they say the name, the governing documents, the guide, the
reference, the templates, the adapters' one-liner, the comparisons and
the competitor map. Records — checkpoints, older decisions, card
bodies, room histories — are not touched (ADR-022 decision 3).

## Acceptance criteria

- WHEN method/ is read by a role THE IDENTIFIER spellings there SHALL be
  the new ones too — method/runtime/nputer.yaml renamed to
  supertaskr.yaml, and every `.nputer/`, `NPUTER_*`, `npx nputer` and
  `@nputer/` in a role file, the lane protocol, a template or an
  adapter template — because a role-read path is a program-read path
  (ruled at T-264's dispatch, 2026-09-08: method/ is outside T-264's
  fence, so its identifiers are this card's, and T-264's verifier
  routes any it finds here rather than failing T-264 on them).
- WHEN the lane lands THE method kit, docs/guide/, docs/reference/,
  NORTH_STAR, ROADMAP, the STATE and checkpoint templates, VERSIONS,
  docs/business/ and the competitor map SHALL say Supertaskr where they
  named the product or the method, and `git grep -i nputer` over those
  paths SHALL return only quotations of records, each marked as such.
- WHEN the method version is bumped for the name THE pin test SHALL
  move in the same lane, and the kit's own README SHALL open with the
  new name and keep the etymology of the old one as one sentence of
  history.
- IF a sentence in a governing document is a quotation from a record
  THEN it keeps the old name inside the quotation marks.
- The docs gate SHALL be run on every touched path and what it names
  run; the byte budgets SHALL hold (a rename adds one character to
  most mentions; the headroom bands are read before and after).
