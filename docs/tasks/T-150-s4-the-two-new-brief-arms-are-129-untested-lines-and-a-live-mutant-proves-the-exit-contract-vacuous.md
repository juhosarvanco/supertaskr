---
id: T-150-s4
title: The two new brief.mjs arms are 129 untested lines, and a live mutant proves their exit-code contract is vacuous
status: suggested
suggested_by: verifier claude-opus-5 @T-150-verify
---

**`--card` AND `--audit` APPEAR IN NO TEST IN THIS REPOSITORY.** Derived
at `80aab21` with `command grep -rn -- "--card\|--audit" tools/e2e/tests
app/test`: the only hit is a prose comment in
`genesis-screen.spec.ts:210` about an unrelated slot. `brief.spec.ts`
pins exit codes for `--help`, `--task`, `--nope`, a positional and the
empty call — and was not extended.

## PROVED, NOT INFERRED

Mutating `tools/e2e/scripts/brief.mjs` from

    const findings = [...ctx.findings, ...cardFindings, ...auditFindings];

to `const findings = [...ctx.findings];` makes
`node tools/e2e/scripts/brief.mjs --card T-150` **exit 0 where it must
exit 1** — and `brief.spec.ts`, `card-figures.spec.ts` and
`dispatch-order.spec.ts` together come back **62 passed**. The mutant
lives. `brief.mjs` was restored and the restoration proved by `shasum
-a 256` (`a8ddad5b2ae072fd6e68e215f19ec18851273141a7f80e9fdecd6b097a912b20`)
with an empty `git status --porcelain`.

**T-150's own notes state the contract this mutant breaks** — *"STALE,
UNRUNNABLE and CENSUS are findings; the command exits 1 on any"* — and
nothing in the tree holds it. `docs/CONVENTIONS.md` legends the four
codes for every other gate in this repository, and each of those has a
spec that reads them.

## WHAT IS UNCOVERED, PRECISELY

The 129 changed lines in `brief.mjs`, none of which any body executes:
the two new flags' argv parsing; the `cardId === taskId ? ctx :
context({…})` branch that builds a second context; the *"no live card
declares id"* refusal; the `readFileSync` of `--audit`'s path; the
finding aggregation above; and the `--card`/`--audit` share of
`brief.spec.ts`'s own **writes-nothing** assertion, which only ever runs
`--task T-133 --state`.

**What IS covered is the part that decides a verdict** — `cardReport`
and `auditCard` are driven by 27 bodies and survived a 22-mutant drill.
This card is about the wrapper, not the derivation.

## WHY IT WAS LEFT, AND WHY THAT IS A REASON RATHER THAN AN EXCUSE

T-150's brief forbade a CLI spawn from a test. **The lane obeyed it for
its own spec and filed the contradiction as `T-150-s1`**, because
`brief.spec.ts:659` and `boot-check-guard.spec.ts:44` already spawn and
are green. **So this coverage gap is the measured cost of a prohibition
that lives only in a dispatching session's memory** — which makes it the
first worked example of what `T-150-s1` and `T-148` are about, and the
two cards should be triaged together.

## Disposal

`touches:` `[tools/e2e]`. The cheapest form is four `spawnSync` cases in
`brief.spec.ts` beside the ones already there — `--card <live id>` is 1
with a finding-bearing card and 0 without, `--card T-999` is 2,
`--audit <missing>` is 3 — plus `--card` inside the writes-nothing body.
**It cannot be written until `T-150-s1` is ruled**, or it re-opens the
same question one file over.
