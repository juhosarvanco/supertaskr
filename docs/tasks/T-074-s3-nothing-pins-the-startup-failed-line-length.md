---
id: T-074-s3
title: Nothing pins the startup-failed line's length — 887 and 870 both satisfy the only assertion
status: suggested
suggested_by: executor claude-opus-5 @T-074
---

T-074 corrected T-063's **887 characters** to **870 characters / 872
bytes** at its source. The correction is derived, not measured against a
test, **because no test can tell the two apart.**

The only length assertion over the composed line is in
`startup_failed_line_survives_a_10k_hostile_message_from_the_boundary`
(`app/src-tauri/src/lib.rs`):

    assert!(line.chars().count() < 1_000, …)

887 satisfies that. So does 870. So would 999. The wrong figure could be
written into a card, quoted forward, and re-quoted in a verdict without
one red anywhere — which is exactly what happened: the number survived
from the implementation notes into the card's own contradiction two
hundred lines later.

**WHAT IS PINNED, so the remedy is small.** The payload half is already
held: `sanitize_for_log_escapes_control_chars_and_truncates`
(`app/src-tauri/src/docs_watch.rs`) asserts

    logged.chars().count() == MAX_ECHO_LOG_CHARS + "…(truncated)".chars().count()

which fixes the 800 + 12 = 812 relation. Only the PREFIX is unheld: the
36-character literal head, the stamp's digits, and ` payload=`'s 9. Note
that assertion is parametrised by `MAX_ECHO_LOG_CHARS`, so under
CONVENTIONS' own rule (*a test parametrised by the constant it checks
cannot pin that constant*) it holds the SHAPE and not the 800.

**PROPOSED, one body:** compose a line with a 13-digit stamp and a payload
longer than the cap, and assert `line.chars().count() == 870` and
`line.len() == 872` with the arithmetic in a comment — a LITERAL pin, on
T-063's own precedent (`STARTUP_DEADLINE_MS` needed one because every
other deadline assertion advanced the clock by the constant). It also
records the one dependency the prose keeps eliding: the line is
content-independent once the cap fires but NOT stamp-independent — the
existing test passes `recv_at_ms: 7` and its line is 858 by the same
arithmetic.

Non-blocking. The shipped behaviour is correct and always was; what is
missing is anything that would have refused the wrong number.
