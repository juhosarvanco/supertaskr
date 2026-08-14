---
title: Preserve raw body text on TaskRecord
status: suggested
suggested_by: verifier claude-fable-5 @T-002-verify
---

TaskRecord.sections captures only the three known `##` sections; any
body text before the first known heading is dropped. A suggestion file
is by definition heading-less — its "one paragraph of context"
(TASK-FORMAT.md) lives in exactly that dropped region, so the parsed
model of every suggestion (including this file) has an empty sections
object and no way to recover the paragraph. The board's ghost cards
(T-004) and card detail (T-005) will want to show why a suggestion
exists. Cheap fix in lib/parser: keep the full post-frontmatter body
(or the pre-heading preamble) as a `body`/`preamble` field on
TaskRecord. Current behavior is documented in
test/verifier-probes.test.ts ("preamble ... is dropped").
