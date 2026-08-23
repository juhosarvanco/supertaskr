---
id: T-061-s3
title: What BSD xargs actually does with an empty list and a non-zero exit — both facts CONVENTIONS records about it are wrong, and the fix that landed for T-084-s6 is unreachable through the documented pipe
status: suggested
suggested_by: executor claude-opus-5 @T-061
---

Measured on this machine — macOS **26.6**, Darwin **25.6.0**,
`/usr/bin/xargs` (the only `xargs` on PATH, confirmed with
`which -a xargs`) — because a dispatch brief asked this executor to
check whether the boot check's documented invocations survive their
pipes. They do. The DOCS GATE's do not, and not for the reason on
record.

## FACT ONE: this xargs does NOT run the utility on an empty list

The DOCS GATE bullet in `docs/CONVENTIONS.md` says:

> **AN EMPTY PATH LIST IS EXIT 2, NOT EXIT 0** (T-084-s6): the
> invocation above pipes through `xargs`, BSD `xargs` runs the utility
> once even on empty input, so a range command that FAILED used to reach
> this gate as zero paths and be answered "not owed"

`docs/tasks/rejected/T-084-s6-*.md` says the same thing in its own
words. **Measured with an on-disk marker, so "did it run" is observable
rather than inferred from stdout:**

    rm -f /tmp/marker
    printf '' | /usr/bin/xargs /usr/bin/touch /tmp/marker   ->  exit 0
    ls /tmp/marker                                          ->  No such file
    printf 'z\n' | /usr/bin/xargs /usr/bin/touch /tmp/marker -> exit 0
    ls /tmp/marker                                          ->  exists

The utility is **never executed** on empty input. Same for a lone
newline and for whitespace-only input. This is GNU `xargs -r` behaviour
arriving in BSD xargs; the man page on this machine does not promise
either way.

**THE CONSEQUENCE IS THE SAME FAILURE AND A WORSE ONE.** T-084 fixed the
gate so that zero paths is exit **2** — verified live here,
`node tools/e2e/scripts/docs-gate.mjs` with no arguments exits 2. But
through the documented pipe that branch is **unreachable**: xargs never
invokes the gate, and the pipeline exits **0**. So a failed range
command still produces a green gate, and now it does so without the
gate having run at all — the one outcome the gate's own exit-3 vocabulary
is supposed to make impossible to mistake.

    printf '' | /usr/bin/xargs node tools/e2e/scripts/docs-gate.mjs   ->  0
    node tools/e2e/scripts/docs-gate.mjs                              ->  2

## FACT TWO: it does not map 1–125 to 123 — it maps them to 1

`123` is **GNU findutils**' documented mapping. This machine's man page
says something else entirely, and it is the authority here:

> The xargs utility exits with a value of 0 if no error occurs. If
> utility cannot be found, xargs exits with a value of 127, otherwise if
> utility cannot be executed, xargs exits with a value of 126. If any
> other error occurs, xargs exits with a value of 1.

Measured, one invocation each:

| utility exit | xargs exit |
|---|---|
| 0 | 0 |
| 1 | **1** |
| 2 | **1** |
| 3 | **1** |
| 4 | **1** |
| 255 | **1** |

## What that does to the four-code contract, per code

The gate's contract is 0 nothing owed, 1 the gate HAS a verdict, 2
called wrong, 3 the gate could not run. Through
`… | xargs node docs-gate.mjs`:

| true code | through the pipe | verdict |
|---|---|---|
| 0 | 0 | right, by luck |
| 1 | 1 | right, by luck |
| **2** (empty list) | **0** | wrong, and SILENT — "called wrong" reads as "nothing owed" |
| **3** (gate could not run) | **1** | wrong — "could not run" reads as "has a verdict" |

Two of the four codes are lost, and both losses are in the direction the
codes exist to prevent. The advice CONVENTIONS gives —
`node … $(cat <list>)` with `$?` read immediately — is right and this
executor followed it. Only the two REASONS it gives are wrong.

## The boot check's own invocations are clean, and that is worth recording

`NPUTER_BOOT_PORT=<port> npm run boot:check` has no pipe, and npm
propagates the script's code: measured 3 (1420 refused), 3 (not a port),
3 (an underivable committed config, new at T-061), 2 (busy port), 1
(timeout, watchdog, and the child exiting early) and 0, every one read
from `$?` unpiped. The new `npm run boot:orphan-drill` is the same shape
with the same four codes. **CI's `xvfb-run -a npm run boot:check` was
NOT measured** — there is no `xvfb-run` on macOS — and `xvfb-run`'s
exit-code propagation has its own history; someone with a Linux runner
should check it before treating that step as a gate.

## Arms

1. **Correct the two sentences in CONVENTIONS' DOCS GATE bullet**, and
   say what actually happens: on this machine the pipe never reaches the
   gate, so the exit-2 guard cannot fire and the SAFE spelling is not a
   preference but the only one that works. Out of this lane's fence
   (`[tools/e2e]`), which is why this is a finding and not a diff.
2. **Change the documented invocation** from the `xargs` pipe to
   `node tools/e2e/scripts/docs-gate.mjs $(cat <list>)`, so the shipped
   ritual and the safe spelling are the same string. The `xargs` form is
   currently documented in the very bullet that then warns against it.
3. **Reopen `T-084-s6`'s second arm**, which is untouched by all of
   this: xargs may split a long path list across several invocations,
   each seeing a subset. Nothing here is near `ARG_MAX`, but if the
   documented invocation keeps the pipe then that arm keeps its teeth.
4. **Note the portability trap for whoever writes the CI step.** GNU
   xargs on the Linux runner behaves the OTHER way on both counts — it
   runs the utility on empty input unless given `-r`, and it maps
   non-zero to 123. So a pipe that is merely wrong here would be wrong
   differently there, and neither is the contract.
