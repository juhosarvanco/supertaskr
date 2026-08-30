---
id: T-175
title: The cold-start test gets an operational owner — the app spawns the fresh, docs-restricted session the method names, and its gaps render beside the board
feature: F-03
milestone: 4
priority: 5
size: M
status: planned
blocked_by: []
touches: [app-agent, app-interview]
suggested_by: standing triage sitting #4 (2026-08-30) — SPLIT from T-171
builder:
verifier:
built_by:
verified_by:
review:
---

**SPLIT FROM `T-171` AT THE FOURTH STANDING TRIAGE (2026-08-30), AND
THE SPLIT IS THE DISPOSITION** — `T-171` is @human's walk finding
whole; this card is its second half. The two halves answer to
different fences and different sizes, which is the method's own
argument for two cards: `T-171` is a terminal STATE in the interview
pane (`app-interview`, a stall @human hit and can hit again), and this
is a SPAWN (`app-agent`, a new short-lived session with a restricted
reading surface). A single card carrying both would hand one lane the
union of those fences for two unrelated contracts.

**READ `T-171` FIRST — IT CARRIES THE WALK'S EVIDENCE**, including
@human's verbatim report and the by-hand cold-start result this card
exists to automate.

## What the method asks for, and why the interview session cannot do it

`method/interview/plan-interview.md` ends: *"Then: cold-start test. A
fresh session reads only docs/ and explains the project back. Gaps in
its answer are gaps in the docs — fix and repeat."*

The interview session is disqualified BY CONSTRUCTION — it holds the
whole interview in context, and the blindness IS the test. The planner
at @human's walk said exactly this in its own words and then had
nowhere to go. So the test needs a second session, and the app is the
only thing positioned to spawn one.

## THE TRIAGE RULING THIS CARD IS BUILT ON (2026-08-30, sitting #4)

**THE COLD-START TEST IS OFFERED, NEVER GATED.** `T-171`'s open
question 3 — *"whether the test blocks completion or follows it"* — is
ruled: **completion is at the last bank; the cold-start test is an
offered next action.** Three reasons, and the first decides it:

1. A completion that depends on a SPAWN can fail for reasons that have
   nothing to do with the project's quality — an expired login, a
   missing CLI, a cancelled turn. Gating the walk's ending on it
   reproduces the exact failure @human hit, one layer out: a person
   with a finished project and no way forward.
2. Milestone 3's own precedent is hand-driven-first (ADR-017's
   spawned-planner-writes rule arrived the same way), and the walk
   itself ran this test by hand successfully.
3. The method says *"fix and repeat"*, which is a LOOP a person opts
   into, not a gate a program holds shut.

## The reading restriction IS the test

A session that read the interview transcript, the planner's context or
the repository outside `docs/` is not cold, and a green answer from it
is worthless. The restriction is therefore a CONTRACT of the spawn and
not a prompt instruction: it belongs with `app-agent`'s existing
argv/environment discipline (ADR-003 `env_clear()` + allowlist,
`validate_resolved_program`, the bounded-transcript rule), where the
project already knows how to prove a child could not reach something.

Note for the lane: `.nputer/` holds the interview transcript and is
gitignored but present on disk in the generated project — a cold
session pointed at the project root can reach it. The restriction has
to be stated against a path set, not against the project.

## Acceptance criteria

- WHEN the interview has banked its last stage THE app SHALL offer the
  cold-start test as a named action, and SHALL NOT gate completion on
  it (the ruling above).
- WHEN the person runs it THE app SHALL spawn a FRESH agent session
  whose reading surface is the new project's `docs/` tree, and the
  restriction SHALL be proven the way this project proves its other
  child-surface claims — a test that the child cannot reach
  `.nputer/`, the transcript, or anything above `docs/`.
- THE explain-back SHALL render beside the board, and its GAPS SHALL be
  the actionable output — the method's fix-and-repeat loop, not a
  score.
- IF the spawn fails THEN the failure SHALL be a typed outcome that
  costs the person no affordance (the T-069/T-101/T-102/T-107/T-113
  family's rule), and the finished project SHALL remain finished.
- Verification: headless. The restriction body is `cargo test`'s; the
  offer-not-gate body is the app suite's.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
