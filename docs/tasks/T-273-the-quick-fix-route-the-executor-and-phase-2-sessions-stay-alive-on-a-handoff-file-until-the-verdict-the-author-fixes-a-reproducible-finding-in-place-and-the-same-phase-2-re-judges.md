---
id: T-273
title: "The quick-fix route — the executor and phase-2 sessions stay alive on a handoff file until the verdict; a rejection that carries a reproducible failure goes back to the author session for the fix, and the same phase 2 re-judges; a rejection without one still goes to a fresh seat"
feature: F-04
milestone: 4
size: M
priority: 15
status: planned
suggested_by: "@human, 2026-09-09: \"can we develop a faster route for quick fixes? Would it make sense to keep the executor lane existing until the verifier finishes so then if the verifier finds something that needs fixing, it could be sent to the executor session that built the bug for fixing?\""
blocked_by: [T-268]
touches: [method/tasks/TASK-FORMAT.md, method/roles/executor.md, method/roles/verifier.md, method/roles/orchestrator.md, docs/CONVENTIONS.md, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/conventions/app-and-ui.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

A rework today costs a fresh executor that re-reads everything (240K
tokens, 40–50 min) and a fresh phase 2 that re-reads everything
(210–300K, 30–50 min), for a finding that is usually one red body. The
author session already holds the context; what it lacks is a way to
learn the verdict, because in this harness a subagent ends when it
reports and no message reaches it. The ask channel (T-268) is the same
problem in the other direction, and the same file-based answer fits.

## Why this card exists

TASK-FORMAT's lifecycle rule sends a rejected card to a FRESH executor,
"never the author session, which would defend its work — unless a
human explicitly overrides." The rule guards against a shared blind
spot. It costs an hour and half a million tokens per rework. The
distinction that keeps the guard and drops the cost: a rejection that
carries a REPRODUCIBLE failure (a body the verifier wrote and saw red,
or a command with expected-versus-actual) is not a judgement the author
can argue with — it is a red to turn green without touching the body —
and the verifier stays blind either way, because the SAME phase 2 has
already read the diff and re-judges the delta (T-272). A rejection
without a reproducible failure (a contradiction, a design disagreement)
keeps the fresh-seat rule.

## Acceptance criteria

- WHEN an executor reports THE role file SHALL say it then WAITS on a
  handoff file (`<scratch>/verdict-<card>.md`, written by the seat from
  the verdict) for a bounded time named in the brief, at zero token cost
  while idle (a poll, never an `until ! pgrep` waiter), and ENDS when
  the file says APPROVED or the bound passes.
- WHEN the handoff file says REJECTED with a reproducible failure (the
  body names, the command, expected versus actual, quoted from the
  verdict) THE same executor session SHALL fix it in its lane under
  T-272's rework rules (the finding, the diff, the touched files; the
  named bodies red then green; the body untouched), commit, append the
  rework note, and re-report — the lane is the same worktree, its
  fence and manifest unchanged.
- WHEN the handoff file says REJECTED without a reproducible failure
  THE session SHALL end and the dispatcher SHALL send the card to a
  fresh seat, as today.
- WHEN a phase 2 has committed a verdict THE role file SHALL say it
  waits the same way on `<scratch>/rework-<card>.md` (the executor's
  re-report, written by the seat), and re-judges the delta under T-272
  in the same session — its blindness was a property of phase 1, which
  it never was; a THIRD pass still ends the session and the card
  (TASK-FORMAT's stop condition is unchanged).
- WHEN the dispatching seat relays THE seat's own protocol SHALL say
  it copies the verdict's FINDING section and the executor's re-report
  into the handoff files verbatim (never a summary — orchestrator 5c's
  rule for amendments applies), and that the arm prints both paths in
  its ledger; T-268's watcher pattern is reused for both.
- WHEN the session that receives a finding DISPUTES it (the code is
  right, the verdict is wrong) THE role file SHALL name the ONLY move:
  record the conflict on the card with the command that shows it, open
  a consultation room addressed to the architect, and stop — never
  argue in the lane, never rebuild against a verdict it rejects. The
  architect's contract SHALL name the three outcomes, each recorded:
  the verdict's claim re-derived and REFUTED (written with the killing
  command; a fresh phase 2 re-verifies the same tip with the refutation
  in the sealed annotations, because a rejected card cannot merge on a
  dead verdict); the executor's claim refuted (the failure is now
  reproducible — kind one — and the fix returns to the same session);
  or neither settled by measurement, which is a design question and
  goes to @human as the room's addressee, the ruling landing as an
  amendment to the card (5c) or a decision record. (Added 2026-09-09 at
  @human's question: the route must say what happens when the author
  disputes the finding, or it loses the one thing the fresh-seat rule
  guaranteed.)
- TASK-FORMAT's lifecycle rule SHALL be amended to the distinction
  above (reproducible failure → the author session; otherwise a fresh
  seat), with @human's override of 2026-09-09 as its provenance and the
  cost measured on T-224 as its reason; the method version bumps.
- A brief.spec body SHALL pin that an executor brief names the handoff
  file and the bound, and a method eval SHALL check that the three role
  files and TASK-FORMAT agree on the distinction's wording.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/app-and-ui.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
