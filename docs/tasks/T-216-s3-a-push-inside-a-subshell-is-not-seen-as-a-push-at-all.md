---
id: T-216-s3
title: A push inside a SUBSHELL is not seen as a push at all — `( cd /x && git push )` reaches no arm of the guard, and T-216 gave that hole a rooting story it does not have
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-216
blocked_by: []
touches: [.claude, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND ON T-216 AND DELIBERATELY NOT FIXED THERE.** Raised by that card's
integrator as non-blocking; routed here rather than folded in, because the
hole is in the SCANNER and T-216's subject is the ROOTING — two different
questions in one file, and widening a landed guard's matcher inside a card
about where it points is how one guard quietly becomes another.

**Class parent: none.** `T-216` is the sibling it was found on.
Disposition hint: promote at normal priority, and expect the argument to
be about COST rather than mechanism — see below.

## What is not seen

`gitInvocations` splits on `[\n;|&]+` and then looks for the word `git`
followed by a subcommand. A subshell's parentheses are ordinary
whitespace-separated tokens to it:

    ( cd /x && git push )     ->  segments `( cd /x` and `git push )`

The push IS found there, so this spelling reaches the guard. The one that
does not is the form where the parenthesis binds to the word:

    (cd /x && git push)       ->  first token `(cd`, last token `push)`

**Neither the `cd` nor the `push` is the token the scanner is looking
for.** `isPush` answers FALSE, and the command reaches no arm of this
guard at all — not the graph, not the board, not the landing gate, not
T-203's verdict token. It is not refused and it is not announced. **It is
simply invisible.**

**MEASURED at `T-216`'s tip, not read off the regex** — `isPush` and, for
the ones it sees, `pushCwds`:

| command | seen? | rooting |
|---|---|---|
| `( cd /tmp && git push )` | **yes** | UNRESOLVED (safe) |
| `( git push )` | **yes** | resolves to the writer's cwd (correct) |
| `(cd /tmp && git push)` | **NO** | never reached |
| `(cd /tmp; git push)` | **NO** | never reached |
| `(git push)` | **NO** | never reached |

**THE WHITESPACE IS THE WHOLE DIFFERENCE**, which is what makes this a
trap rather than a limit: the spaced form is handled correctly and safely,
and the unspaced form — the one people actually type — vanishes. A reader
who tests the spelling that comes to mind first will conclude the guard
covers subshells.

## This is pre-existing and ALREADY DECLARED — and that is the point

`gitInvocations`'s own header names this family in as many words:

> A push reached through a shell ALIAS, a FUNCTION, a script file, an
> `eval`, or a `git` binary invoked by an absolute path is not seen here.
> … Each is a hole and each is the pre-guard state; none of them is a
> false REFUSAL, which is the failure that would get the guard turned
> off.

That reasoning was sound when the guard's only refusal was a stale graph.
**Two things have changed since:**

1. **`T-203`'s token arm refuses on an ABSENCE**, so an unseen push is now
   a push that skipped a fail-closed gate, not merely one that skipped a
   fail-open one.
2. **`T-216` gave the file a story about WHICH TREE a push acts on**, and
   that story reads as though it covers `cd`-prefixed pushes. It covers
   the ones the scanner sees. A reader who has just read `pushCwds` will
   reasonably believe `(cd /x && git push)` is handled, and it is not
   handled — it is not even reached.

**So the declared hole is now a MISLEADING declaration**, which is a
different defect from an honest gap.

## What this card has to argue, not assume

**The cost of widening is real and points the other way**, and any
implementation owes the argument rather than the change:

- `gitInvocations`'s header records, from a blind verifier's measurement,
  that `echo git push`, `man git push` and `grep -rn git push /tmp`
  already reach a refusal. **Stripping punctuation from tokens makes that
  class BIGGER**, and under the token arm a false positive refuses
  whenever the battery has not been run against HEAD's tree — *"which is
  most of the time."*
- The honest alternatives are not only "widen the matcher": DECLARING the
  hole where a reader of `pushCwds` will meet it, or ANNOUNCING a command
  that looks shell-nested without judging it, are both cheaper and
  neither can produce a false refusal.

**A card that widens the scanner and does not measure the false-positive
change has not done the work.**

## Acceptance criteria

- The unseen family SHALL be enumerated by MEASUREMENT — a body that
  drives real command strings through `isPush` and records which reach a
  verdict — rather than by reading the scanner.
- WHERE the remedy widens the matcher, the false-positive class SHALL be
  re-measured against the same corpus that produced `echo git push`, and
  the delta stated. A widening whose cost is unmeasured SHALL be refused.
- A push this guard cannot see SHALL NOT be describable by this file's own
  comments as one it handles — the misleading-declaration half is in scope
  even if the scanner is left exactly as it is.
- Verification: headless.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Holds at cf9d462** (claim-check: `segments()` splits on whitespace with
no paren stripping, and the declared-limits header still omits the
subshell family). Promote at normal priority; the argument is cost, as
the card itself says.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
