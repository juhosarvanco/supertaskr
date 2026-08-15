---
title: Anchor the verdict splitter at column 0 (indented quoted headers mint phantom entries)
status: suggested
suggested_by: verifier claude-fable-5 @T-017
---

verdictEntries (app/src/lib/verdicts.ts) starts a new entry at any
line whose TRIMMED text begins with a date — behavior inherited
unchanged from T-006's task-detail implementation. An APPROVED entry
whose body quotes the earlier verdict header verbatim but INDENTED
(no `>` marker) therefore splits in two: the quoted lines become
their own terracotta-tinted block, and rejectedVerdictCount rises by
one, so a once-rejected task's face can read `rejected ×2`. Probed by
the T-017 verifier on 2026-08-15: the count and the tint still agree
(the phantom block really renders — the T-017 face/panel invariant
holds; the pair just misreads the quote together), and the markdown
blockquote form (`> 2026-…`) is already safe because the `>` survives
trim. Convention-form verdicts never hit this; only verbatim indented
quotes do.

Suggest anchoring the split at column 0 — test the RAW line instead
of line.trim() — a one-line change: blockquotes stay safe, indented
quotes fold into their parent entry, and every convention-form file
is unaffected (real headers start at column 0). Pin both quote forms
in detail-presentation.test.ts alongside the first-match cases.
Touches app-board only; no parser change.
