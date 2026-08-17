---
id: T-030-s1
title: A trailing `@human` note makes the representative model literally `+`
status: parked
suggested_by: executor claude-opus-5 @T-030
---

T-030's representative-model rule takes the last whitespace-delimited
token of the left half of the LAST `@`. That is exactly right for the
compound cross-model stamps it was written for (T-020, T-024 → the model
that finished the work), and it is measurably wrong for one live stamp:

    docs/tasks/T-001-app-shell.md
    verified_by: "claude-fable-5 @fresh (2 passes) + @human (visual)"

The last `@` belongs to `@human`, so the left half is
`claude-fable-5 @fresh (2 passes) +` and the representative model is the
separator itself: `+`. Measured before T-030 the field held that whole
34-character string (rendering a 27-character badge); it now holds one
character that names nothing. `raw` still carries the full stamp, and
T-031/T-032 bound and title the badges, so nothing is lost — but a badge
reading `+` is not an improvement over a long one.

Pinned rather than papered over, deliberately: the fix belongs to a
grammar decision, and T-030's triage ruled the grammar arm out (arm 1,
"widest blast radius, would require editing two done tasks'
frontmatter"). The pin is
`lib/parser/test/model-session.test.ts` → "KNOWN WART, pinned not
papered over (T-030-s1)".

Arms, none free:
(a) Treat a trailing `@human …` as an ATTRIBUTION, not a session: split
    at the last `@` that is followed by something other than `human`.
    Cheap, one live case, but it invents a keyword the format does not
    have — and `@human` is exactly the kind of thing TASK-FORMAT.md
    ought to define rather than have the parser guess.
(b) Drop trailing separator tokens (`+`, `,`, `&`) from the left half
    before taking the last one. This stamp then yields `(2 passes)`,
    which is worse — the tokens before the separator are prose, not a
    model. Rejected on the measurement, not on taste.
(c) Define the delimited grammar for real in TASK-FORMAT.md (a stamp is
    a `+`-separated list of `model[@session][ (note)]` entries), parse
    the LIST, and let the model badge render the last entry while the
    panel renders all of them. The honest fix, a method version bump,
    and it makes `built_by` machine-readable for the dispatcher — which
    is where this field is heading anyway.
(d) Edit the one stamp (`verified_by: "claude-fable-5 @fresh (2 passes)"`
    plus an @human line in the verdicts, where the human pass is already
    recorded). Truthful, one line, and it treats the symptom.

Worth deciding when something starts CONSUMING `policy`/`model` — the
dispatcher is the first candidate. Until then the wart is visible in a
test rather than surprising in a badge.

Triage 2026-08-17 (architect): PARKED — @HUMAN, and the judgment is
already recorded in STATE in the human's own terms: `+` is honest but
ugly. RE-VERIFIED at triage: `docs/tasks/T-001-app-shell.md` still
holds `verified_by: "claude-fable-5 @fresh (2 passes) + @human
(visual)"`, so the representative model is still literally the
separator. Nothing is lost — `raw` carries the full stamp, T-031 and
T-032 bound and title the badges, and the wart is PINNED in
`lib/parser/test/model-session.test.ts` rather than papered over, so
it cannot regress into a surprise. Arm (d) is one truthful line and
arm (c) is a method version bump; both are the human's to pick, and
the suggestion's own answer is "worth deciding when something starts
CONSUMING policy/model". Unpark with the dispatcher, or on the
human's ruling — whichever comes first.
