---
id: T-082-s1
title: The grant set's 128-line span is measured from a doc-comment mention, not from the declaration
status: rejected
suggested_by: executor claude-opus-5 @T-082
---

**The last checkpoint corrected a right number to a wrong one.** STATE's
security sweep carried "92 lines of span" for `EXPECTED_GRANTS` in
`app/src-tauri/src/acl_pin.rs` for two checkpoints, then corrected it:
*"The anchored span `EXPECTED_GRANTS` … `];` is **128** lines (36 of them
comment or blank; 36 + 92 = 128). The count of 92 is right; 'lines of
span' is the wrong name for it."* The dispatch brief for this card
carried the 128 forward as a figure to re-derive.

**Re-derived at `ddcc8bb`, the 128 comes from anchoring on the FIRST
TEXTUAL OCCURRENCE of the symbol name, which is a `//!` module doc
comment that merely mentions it.** That occurrence is line 18 — *"the
full grant set is pinned as `EXPECTED_GRANTS`. Any diff that…"* — and the
closing `];` is line 147, so the span is 130 lines inclusive and 128
exclusive of both anchors. The "36 comment or blank" lines are the module
doc comment and the code between the MENTION and the DECLARATION. None of
them are part of the grant set.

Anchored on the declaration instead — `const EXPECTED_GRANTS: &[&str] =
&[` at line 54, closing `];` at line 147 — the span is **94 lines
inclusive, 92 exclusive, and all 92 are entries. Zero comment, zero
blank.** So the original "92 lines of span" was right, and it was right
for the reason it looked wrong: the declaration's body really is exactly
its entries.

**THE SHAPE, WHICH IS THE PART WORTH KEEPING.** CONVENTIONS' *A CITATION
NAMES A SYMBOL, NOT A LINE* rule exists because line numbers drift. This
is the same failure one level up: a symbol-anchored measurement taken
from the first place the symbol's NAME appears rather than from where it
is DECLARED. Prose that discusses a constant sorts before the constant,
so the anchor silently swallows the discussion. An anchor for a
measurement needs to match a DECLARATION (`const NAME`, `fn NAME`), not a
name.

The count of **92 grants is unaffected and robust** — re-derived four
independent ways at `ddcc8bb` over the declaration's body: 92
quote-bearing lines, 92 quoted strings in total, 92 unique quoted
strings, 92 lines matching the strict entry shape. Only the span figure
is wrong, and only its NAME was ever in doubt.
