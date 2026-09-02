---
id: T-216-s8
title: A push the guard cannot judge is ALLOWED with a notice the seat never sees — a `cd <dir>;` before the push turned a STALE-token refusal into a silent allow, and an unverified tree reached origin
feature: F-06
milestone: 4
size: S
priority: 2
status: building
suggested_by: the architect seat, measured by probing the hook with the pushed command line, 2026-09-02
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding, measured

At 10:53Z the seat pushed a2335c6 with a token minted at 5af76ff (a
different tree). Probing the hook afterwards with the two spellings:

- `git push origin main` — PUSH REFUSED: the verdict token is STALE
  against HEAD's tree (exit 2). Correct.
- `cd /Users/ujju/Projects/nputer; git push origin main 2>&1 | grep …`
  — the exact line the seat ran — NOTHING ABOUT THIS PUSH WAS JUDGED:
  "a `cd` reaches this push through a separator that is not `&&`", the
  token, graph, board and fence ALL UNVERIFIED, exit 0, allowed.

The guard's own rule (T-216) reads only what the text DETERMINES and
declines to guess a working directory after a `;`. That is right. What
is wrong is the VERDICT on the undetermined case: an allow. A PreToolUse
hook's stdout on exit 0 is not shown to the seat, so the notice reached
nobody, and a tree no battery had graded went to origin. The one arm in
the file that "refuses on an ABSENCE" is the token arm — and this
spelling routed around it by making the token unreadable rather than
stale.

## What is asked

A command whose text contains a push the guard cannot place SHALL be
REFUSED (exit 2) with the same remedy the notice already spells —
`git -C <checkout> push` — not allowed with a notice. The refusal names
the separator it could not read past. The three determinable spellings
(`-C`, `cd <literal> &&`, an unmoved working directory) are unchanged.
A command with no push in it is unchanged.

## Acceptance criteria

- The exact command line above is refused by name, and the refusal text
  contains the `git -C` remedy.
- `cd <dir> && git push`, `git -C <dir> push` and a bare `git push`
  with a fresh token are still allowed; with a stale token the bare form
  is still refused as STALE (the existing body).
- A positive control demonstrated failing: the mutant that restores the
  allow on the undetermined case reds exactly the new body.
- No other arm's verdict moves: the existing push-guard bodies are green
  at the tip, and the drill kill sets are disjoint from theirs.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, behind T-228 by fence

Filed by the seat that pushed the tree. The evidence is a probe, not a
reading, so it is planned at once — but T-228 holds the whole `.claude`
directory until it lands, and the arm refused this lane on that shared
path. The seat had stamped it `building` and cut a lane before deriving
that; the lane was removed unarmed. Dispatch at T-228's merge; T-238-s1
shares the fence and waits behind this card.
