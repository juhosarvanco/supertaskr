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
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-237-s7 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3a, after the Codex orchestrator's review): the same guard and the same owning suite; the child's blocker T-238 is done.

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
- THE guard SHALL distinguish a step it could not place from a step that
  declares no `working-directory`, and SHALL say which one it is looking
  at rather than announcing a reach verdict for the first.
- WHERE the step could not be placed THE announcement SHALL NOT claim
  every push reaches it: an unplaceable step's reach is UNKNOWN, which is
  the shape `pathsSince`'s own decline already has in this function.
- THE distinction SHALL be carried in the value `reachSentence` reads,
  not inferred by re-scanning — `stepWorkingDirectory` returning
  `undefined` for both is the defect, so the two cases separate at that
  function or at a sibling of it.
- A BODY in push-guard.spec.ts SHALL show the two announcements differing
  for the two inputs, and SHALL be shown red against a mutant that
  re-collapses them.
- Verification: headless.
  (the bullets above are absorbed whole from T-237-s7, pile 2 batch 3a, 2026-09-14; all five as filed)

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

## Absorbed from T-237-s7 — The push guard cannot tell "I could not place that step" from "that step declares no `working-directory`", so an unplaceable step is announced as running at the repository root where every push reaches it (kept whole)

Title as filed: "The push guard cannot tell "I could not place that step" from "that step declares no `working-directory`", so an unplaceable step is announced as running at the repository root where every push reaches it"

Filed as: status suggested, priority 3, size S, touches [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts], wake None, suggested_by executor claude-opus-5@subagent @T-237-s3.

**THE GUARD'S OWN DOCSTRING PROMISES AN ADMISSION THAT ITS CALLER THROWS
AWAY.** `stepWorkingDirectory` says of a step it cannot read: *"Anything
else returns `undefined`, which the caller SAYS rather than guesses
past."* The caller does not say it. `reachSentence` reads:

    const dir = stepWorkingDirectory(workflow, step.name);
    const pkg = dir === undefined || dir === "" ? undefined : dir.replace(/\/+$/, "");
    ...
    if (pkg === undefined) {
      return `    ${CI_WORKFLOW_REL_PATH} gives that step no \`working-directory\`, so it runs at the ` +
             `repository root and EVERY push reaches it (…)`;
    }

so **two different facts arrive as one value and leave as one sentence**:
a step that genuinely declares no `working-directory` (checkout, the apt
step, the two caches — six of ci.yml's twenty-six steps at `2474476`) and
a step the scanner could not place. The second is announced as the first.

**THAT IS A CONFIDENT FALSEHOOD RATHER THAN A LOST SENTENCE, WHICH IS THE
WORSE OF THE TWO FAILURES THIS ARM CAN HAVE.** `reachSentence`'s own
docstring already draws the distinction it then fails to make — *"Where
either declines the sentence SAYS which one did — a guard that answered
'no' because it could not look would be telling the seat something false
about its own tree"*. Here it answers **yes**: *EVERY push reaches it*.
The seat reads "your push touches the package that is red" about a step
whose package the guard never found.

**HOW IT WAS FOUND, AND THE CARD IT CORRECTS.** T-237-s3's card predicted
that an unplaceable step would degrade the announcement to *"that step's
package is unknown here"*. It does not: that string is returned only from
the `catch` around `readFileSync`, so it means **an unreadable ci.yml**,
never an unreadable step. Measured by the dispatching seat's bench at
`47c8845`, driving the exported `ciVerdict` with a shimmed `gh` against
the real workflow: a renamed step yields the root sentence, byte-identical
to a genuinely root-running step's. T-237-s3 pins that COLLAPSE at the
guard's own input — `stepWorkingDirectory` returns the same `undefined`
for both, so no downstream sentence can separate them — because the
repair is on the other side of its fence.

### T-237-s7's acceptance criteria as filed (absorbed into the criteria above)

- THE guard SHALL distinguish a step it could not place from a step that
  declares no `working-directory`, and SHALL say which one it is looking
  at rather than announcing a reach verdict for the first.
- WHERE the step could not be placed THE announcement SHALL NOT claim
  every push reaches it: an unplaceable step's reach is UNKNOWN, which is
  the shape `pathsSince`'s own decline already has in this function.
- THE distinction SHALL be carried in the value `reachSentence` reads,
  not inferred by re-scanning — `stepWorkingDirectory` returning
  `undefined` for both is the defect, so the two cases separate at that
  function or at a sibling of it.
- A BODY in push-guard.spec.ts SHALL show the two announcements differing
  for the two inputs, and SHALL be shown red against a mutant that
  re-collapses them.
- Verification: headless.

### Why it is routed and not built (T-237-s7)

`.claude/hooks/push-guard.mjs` and `tools/e2e/tests/push-guard.spec.ts`
are outside T-237-s3's fence (`tools/e2e/tests/workflow-parity.spec.ts`,
physically enforced) and T-238 holds the guard live. Widening a fence
from inside a lane is the one repair an executor may never make
(method/roles/executor.md), so this is filed and let go.

## Implementation notes

## Verdicts
