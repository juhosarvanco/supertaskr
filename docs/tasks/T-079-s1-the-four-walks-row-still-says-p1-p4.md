---
id: T-079-s1
title: THE FOUR WALKS' TOKEN row still says P1–P4, one pattern after it stopped being true
status: suggested
suggested_by: executor claude-opus-5 @T-079
---

T-079 adds **P6** to `TOKEN_PATTERNS` in
`tools/e2e/scripts/token-scan.mjs`. `docs/CONVENTIONS.md`'s THE FOUR
WALKS table still opens its second row with

    | lint TOKEN — P1–P4, over MASKED source | …

which is a SIGNPOST that has gone stale, in a bullet whose own first
sentence says the row *"is a signpost and cannot be a gate"* and tells
the reader to read the AUTHORITY column instead.

**THE AUTHORITY COLUMN NEEDS NOTHING, and that is the point rather than
an excuse.** It names `TOKEN_ROOTS`, `TOKEN_EXTENSIONS`, `SKIP_DIRS` and
`TOKEN_EXCLUDED_FILES`, and P6 moved none of them: it is a pattern
applied to the same masked text over the same corpus. This is the
identical shape T-010-s1 measured on the same table two commits ago —
the row went false and the gate did not — and it is the second time in
two days, which is worth noting when the next reader decides whether a
pattern COUNT belongs in a signpost at all.

The row's third column is also worth a look while someone is in there:
it is about which FILES the walk sees and is unaffected, so the whole
correction is the `P1–P4` span in column one, plus a decision on whether
to write `P1–P4 and P6` (accurate, and it makes the deliberate gap at P5
visible to a reader of the table) or to stop enumerating patterns there.

**Out of T-079's fence.** T-079's `touches:` is `[tools/e2e]`;
`docs/CONVENTIONS.md` is its own fence slug in ARCHITECTURE's table and
was FREE at `25a9e2c`. Nothing is broken and no gate reds — the token
lint, its selftest and the E2E lane are all green with the row as it
stands.
