---
title: Contain pathological card-title overflow (unbroken 10k-char titles bleed across columns)
status: suggested
suggested_by: verifier claude-fable-5 @T-004-verify
---

Verifier probe on T-004: a task file with a 10,000-character UNBROKEN
title (no whitespace) renders inert — React text node, no execution,
columns keep their 288px width, the page body does not scroll — but the
glyphs paint far past the card's box (span scrollWidth 92,217px vs
218px visible) across every column to its right, and the board
container's scroll range inflates to ~92,578px of mostly-empty runway.
Titles WITH spaces (including hostile HTML strings and long hostile
ids) wrap fine inside the card; only unbroken runs bleed, because the
title spans (`TaskCard`, `GhostCard`) and the id span rely on default
`overflow: visible` with no word-breaking.

Not a T-004 failure: no criterion or plan clause demands truncation,
content stays inert, and the board remains usable. But the design story
is "arbitrary repos render beautifully", and one pathological file
currently defaces the whole board.

Suggest: add `break-words` (overflow-wrap) or `overflow-hidden` +
line-clamp to the title/id spans in
app/src/components/board/TaskCard.tsx and GhostCard.tsx (and the
column header's name span already truncates — mirror that treatment).
Belongs naturally to T-006's design pass; one-line utility change per
span. Repro: apply a snapshot whose task title is `"B".repeat(10000)`
via the DEV harness and measure `span.scrollWidth`.
