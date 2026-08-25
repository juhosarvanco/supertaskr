---
id: T-052-s1
title: The fresh-install refusal is a hand-run ritual and every ingredient for a real gate already exists
status: suggested
suggested_by: executor claude-opus-5 @T-052
---

**T-052 wrote the rule and could not mechanise it.** Its fence is
`[method/, docs/CONVENTIONS.md]`; a detector is code and belongs under
`tools/e2e/scripts/`, which was held by T-120 at that dispatch. So the
rule ships as prose an integrator has to remember, in the same position
as the DOCS GATE's diff half — *"nothing but the integrator running the
two lines above makes a merge answer for the suites it owes"*.

**THE HAND SEQUENCE WAS DEMONSTRATED AND IT WORKS**, so this is not a
design question, it is a packaging one. Driven at T-052 on scratch port
15140 against a real vite serving out of this repository's own `app/`:

- with the server up, `lsof -nP -iTCP:<port> -sTCP:LISTEN` returns the
  holder, the sequence REFUSES at exit 3 naming the skipped step, the
  evidence and what has to happen first, and `app/node_modules` is
  untouched afterwards — inode and mtime identical;
- with the port free the same sequence PROCEEDS at exit 0, which is the
  positive control CONVENTIONS' own NEGATIVE ASSERTION bullet requires:
  without it, "refused" cannot be told from "always refuses".

## Why it is worth building rather than leaving written

Three of the four codes are already this repository's convention and
need no invention: **0** clean, **1** the gate has a verdict, **2**
called wrong, **3** could not run — the contract `index --check`,
`boot:check`, the token lint and the docs gate all share. The refusal
here is a **3**-shaped answer (the step could not run) rather than a
**1**, which is worth deciding deliberately rather than by whoever
writes it.

The port to watch is not a constant. `tauri.conf.json` carries 1420 and
`tauri-boot-check.mjs` already DERIVES its scratch-port overlay from the
committed build config rather than hard-coding it — that derivation is
the thing to reuse, and its own header explains why there is
deliberately no fallback (the only value to fall back to is 1420, so a
fallback would point the check at the human's app).

**PROBE BOTH STACKS OR THE CHECK IS WORSE THAN NOTHING.** Re-measured at
T-052 on a scratch port: vite bound `[::1]:15140` and **nothing on
IPv4**, so `curl http://127.0.0.1:15140/` failed with connection refused
while the server was up and serving. This is the hazard CONVENTIONS'
PORT RULE already records for 1420, reproduced on a scratch port with
the same config — and a detector that probes one stack reports the
human's app as absent and then deletes their `node_modules`.

## The suggested shape

A `scripts/` module that answers "is a live dev server serving out of
this checkout?" with the four codes, reused by whatever wants it, plus
a spec pinning both arms — the refusal AND the positive control. Fence
`[tools/e2e]`. It does NOT need to be wired into `npm test`; being
runnable and documented is the whole of what the ritual lacks.
