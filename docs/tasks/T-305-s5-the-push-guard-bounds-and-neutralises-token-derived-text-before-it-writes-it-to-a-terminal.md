---
id: T-305-s5
title: "The push guard neutralises token-derived text before it writes it to a terminal — a suite id or spec path carrying escape sequences or a carriage return rewrites the guard's own lines today, in refusals that predate the over-run notice"
feature: F-04
milestone: 4
size: M
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-305, 2026-09-11, measured on the bench at adaace727bed7daa65638630df86ba856d63f939 with a planted token"
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, .claude/hooks/gate-token.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The push guard renders names it read out of the verdict token straight
into the text it writes to the seat's terminal. Suite ids, spec paths out
of a `scope`, verdict words and reasons all reach a refusal or a notice
unmodified. Measured on the bench: a planted suite id carrying a terminal
escape, a carriage return and a newline reaches stderr verbatim and puts
a line of its own choosing into the guard's output — a forged approval
sentence, in the middle of a message about a push.

This is NOT new with the over-run notice and is not a defect of the card
that surfaced it: the refusals that name a short spec set, a red suite
and the owed set all predate it and render the same way. It is also not
an escalation of anything. The only writer of the token is the runner,
whose suite ids come from a frozen registry; and anybody who can write
the token by hand can mint a plain green and skip every arm of this
guard, which is strictly more than forging a line in a message.

What it is: the guard's own output is the one thing a seat trusts about a
push, and nothing in the file makes that output the guard's alone.

## The shape that would work

One reader that names the fields a message may carry out of the token,
and strips or escapes control characters and terminal sequences as it
renders them, with a length bound. The refusals and the notices both go
through it, so there is one rule rather than a habit.

A spec path on this project is a tracked file name, so the ordinary case
must render unchanged — a rule that mangled a real path would be worse
than the hazard it closes.

## Acceptance criteria

- WHEN a message renders a name read out of the verdict token THE guard
  SHALL emit no control character and no terminal escape sequence from
  that name, and SHALL bound its length.
- WHEN the name is an ordinary suite id or repository-relative spec path
  THE rendered text SHALL be identical to what the guard prints today, so
  no refusal's wording moves.
