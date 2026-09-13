---
id: T-282-s3
title: "No checkpoint record stamps a disposition tally, so the clearing rate the backlog band is now derived from has to be re-read out of eight records' prose, each worded differently"
feature: F-06
milestone: 4
size: S
priority: 12
status: parked
wake: T-306
suggested_by: "executor claude-opus-5@subagent @T-282, 2026-09-09, at 3a69385"
blocked_by: []
touches: [docs/checkpoints/TEMPLATE.md]
builder:
verifier:
built_by:
verified_by:
review:
---

T-282 re-derived `triage/live-suggestions` from the loop's measured
clearing rate. Getting that rate meant reading eight records since the
amnesty and extracting the tally from prose that is worded differently
every time: *"the suggested queue **46 -> 0**"*, *"## The tally — 14
dispositioned, 4 filed, 1 corroborated"*, *"22 cards, four
dispositions"*, *"triage net arrivals 21 (37 added, 16 dispositioned)"*.
Two of the eight stamped a token cost; the other three triage sittings
wrote *"Tokens and wall clock: NOT DERIVABLE at this seat"*.

`docs/checkpoints/TEMPLATE.md`'s Metrics section already demands five
stamped lines and says silence is not one of the answers — and NONE of
them is the triage tally. That is the same debt `machinery/gate-seconds`
had before T-156-s1 gave it a line: the number exists in the sitting and
dies with it.

The remedy is one more line in that section, written every time a
sitting dispositions anything, in the shape the other five already use:

    `Triage:` — suggestions filed and suggestions dispositioned in this
    window, and the tokens the dispositioning cost where the meter was
    readable. `0` is a reading and is written as one.

ADR-019's Records clause is NOT touched by this and the card must say so
where it lands: nothing may READ that directory back. The line exists so
the next hand re-deriving a triage band finds a number instead of eight
paragraphs, exactly the way `Gate runtime:` exists for
`machinery/gate-seconds`.

Class parent: T-282. Disposition hint: promote with any lane already
holding `docs/checkpoints/TEMPLATE.md`; it is a writing instruction and
no program changes.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-306; no checkpoint stamps a disposition tally, which is precisely this card's third acceptance criterion.
