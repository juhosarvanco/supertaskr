---
id: T-106
title: Nothing pins the startup-failed line's length — 887, 870 and 999 all satisfy the only assertion, and the wrong figure travelled three documents
feature: F-02
milestone: 4
priority: 62
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-074-s3 (sixth triage, 2026-08-20). That file is removed in
this commit.

**T-074 corrected T-063's "887 characters" to 870 characters / 872 bytes
at its source. The correction is DERIVED, not measured against a test,
because no test can tell the two apart.**

The only length assertion over the composed line lives in
`startup_failed_line_survives_a_10k_hostile_message_from_the_boundary`
in `app/src-tauri/src/lib.rs` — verified live at `4d2f03c`:

    assert!(line.chars().count() < 1_000, …)

**887 satisfies that. So does 870. So would 999.** The wrong figure
could be written into a card, quoted forward, and re-quoted in a verdict
without one red anywhere — which is exactly what happened: the number
survived from the implementation notes into the card's own
contradiction two hundred lines later, and from there into a comment in
another package.

**WHAT IS ALREADY PINNED, so the remedy is small.** The payload half is
held: `sanitize_for_log_escapes_control_chars_and_truncates` in
`app/src-tauri/src/docs_watch.rs` asserts

    logged.chars().count() == MAX_ECHO_LOG_CHARS + "…(truncated)".chars().count()

which fixes the 800 + 12 = **812** relation (both symbols verified at
`4d2f03c`, with `MAX_ECHO_LOG_CHARS` = 800). **Only the PREFIX is
unheld**: the 36-character literal head, the stamp's digits, and
` payload=`'s 9. And note that the payload assertion is PARAMETRISED by
`MAX_ECHO_LOG_CHARS`, so under CONVENTIONS' own rule — *a test
parametrised by the constant it checks cannot pin that constant* — it
holds the SHAPE and not the 800.

**The arithmetic closes, which is what makes a literal pin honest here**:
36 + 13 + 9 + 812 = **870** characters, and 872 bytes because the
ellipsis is one character and three bytes.

**And it records the one dependency the prose keeps eliding**: the line
is content-independent once the cap fires but **NOT stamp-independent**.
The existing test passes `recv_at_ms: 7` — one digit, not thirteen — and
its line is **858** by the same arithmetic. A figure quoted without its
stamp width is a figure about a different line.

**Non-blocking.** The shipped behaviour is correct and always was; what
is missing is anything that would have refused the wrong number.

## Acceptance criteria

- **ONE BODY SHALL PIN THE COMPOSED LENGTH AS A LITERAL**: a line built
  with a 13-digit stamp and a payload longer than the cap, asserting
  `line.chars().count() == 870` AND `line.len() == 872`, with the
  arithmetic (36 + 13 + 9 + 812) in a comment beside it.
- **THE PIN SHALL BE A LITERAL AND NOT A DERIVATION**, on T-063's own
  precedent: `STARTUP_DEADLINE_MS` needed a literal pin because every
  other deadline assertion advanced the clock BY the constant and the
  whole family stayed green at `8_000_000`. A body that recomputes
  36 + 13 + 9 + `MAX_ECHO_LOG_CHARS` + 12 pins nothing.
- **THE STAMP DEPENDENCY SHALL BE PINNED TOO, or stated**: the same
  composition with a one-digit stamp is **858**, and a second assertion
  or a comment SHALL record that the length is a function of the stamp
  width. IF only one is pinned THEN the body SHALL say which and why.
- **THE PIN SHALL BE SHOWN TO REFUSE THE WRONG NUMBER**: run it against
  887 and require the RED, with the failure message read back. A pin
  introduced to catch a specific wrong figure and never shown catching
  it is the shape this card is about.
- THE EXISTING `< 1_000` ASSERTION SHALL STAY — it is the hostile-input
  ceiling and a different claim — and the new body SHALL NOT be written
  as a tightening of it.
- **NO PROSE FIGURE SHALL BE ADDED WITHOUT ITS DERIVATION.** Where a
  comment wants to state the length, it CITES THE ASSERTION BY NAME
  instead (T-093's absorbed T-074-s4): a comment restating a measured
  figure is a second implementation of it.
- AFTER the drill reds, T-092's shape-six check SHALL be run: name a
  mutation of the composition the body kills, run the whole crate suite,
  and require a failing-body count of ONE — the neighbouring payload
  assertion is the obvious candidate for the body to duplicate.

Verification: headless — bare `cargo test` from app/src-tauri with the
total summed from the `test result:` lines and the exit read unpiped.
POISON DRILL on the new body: mutate the COMPOSITION (one side only —
never the expected literal, which is the shared value the drill's
one-sidedness rule forbids moving), read the mutated text back with
`git diff` before running, require the RED, restore per-path and prove
by sha256 against the drill's own commit. The BOOT GATE trigger fires on
`app/src-tauri/**` — run the boot check and record the exit and both
`[nputer]` lines. @human: none.
