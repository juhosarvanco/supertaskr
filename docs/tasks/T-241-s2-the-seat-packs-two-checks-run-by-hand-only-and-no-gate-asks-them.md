---
id: T-241-s2
title: The seat pack's two checks run by hand only — no standing gate asks them, so the day the golden or the host-command reference drifts, nothing reds
feature: F-04
milestone: 4
size: S
priority: 13
status: suggested
suggested_by: executor claude-opus-5@subagent @T-241
blocked_by: []
touches: [tools/method-evals, method/skills]
builder:
verifier:
built_by:
verified_by:
review: same-model
---

T-241 shipped two zero-dependency programs inside the pack, each of which
reads its own reference at run time and answers:

- `method/skills/supertaskr-seat/scripts/golden-check.mjs` — compares a
  turn's stamp, fence manifest, lane and verdict against the golden's
  `GOLDEN>` field lines, and `--selftest` runs sixteen degradations that
  must each be caught.
- `method/skills/supertaskr-seat/scripts/host-command-check.mjs` —
  resolves every `HOST>` command against that row's own authority file
  and every `CWD>` against the corpus, with its own seven degradations.

**Nothing runs either one on a schedule.** The METHOD EVAL GATE fires on
any merge whose diff touches `method/**`, so it fires the day either
reference changes — and it does not ask these programs anything. The
failure this leaves open is the ordinary one: `docs/CONVENTIONS.md`
rewords a bullet, the transcription in `host-commands.md` silently stops
matching it, and the first reader to notice is a seat that ran a command
that no longer exists.

Both are cheap: no install, no `node_modules`, and both run against a
bare checkout the way the token lint and the method evals already do.
The `--selftest` arms cost nothing at all — they touch no repository
state and hold their fixtures in memory.

## Acceptance criteria

- WHEN the method eval gate runs THE suite SHALL run both pack checks
  against the repository and both `--selftest` arms, and SHALL fail on a
  finding from either.
- THE wiring SHALL read the count as well as the exit: a check that
  compared zero commands or loaded zero golden fields already exits 3 by
  itself, and the gate SHALL surface that as COULD-NOT-RUN rather than
  as a pass.
- IF the eval suite is judged the wrong home — its two sets are a
  model-free half and a model-spending half, and these are neither —
  THEN the card SHALL say so and route the wiring to the gate that fits,
  rather than adding a fifth standing gate.
