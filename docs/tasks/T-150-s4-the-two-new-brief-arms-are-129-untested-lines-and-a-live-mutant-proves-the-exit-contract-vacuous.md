---
id: T-150-s4
title: The two new brief.mjs arms are 129 untested lines, and a live mutant proves their exit-code contract is vacuous
status: parked
suggested_by: verifier claude-opus-5 @T-150-verify
---

Absorbs: T-150-s6 (Amnesty triage 2026-08-29 (triage seat)) — the same untested arms, and the finding is a DISPLAY problem the contract does not cause: "the deriver reproduces this line at THIS ref" is the right rule and the tool's own output re-stamps every line with the current ref, so the report is honest. What is not honest is the CARD, which keeps whatever the author typed under a verdict reading as provenance — measured with 0000000deadbeef, which is not a commit in this repository and earns a VERIFIED, inside the one card on this board whose subject is a figure with no provenance.

Absorbs: T-150-s5 (Amnesty triage 2026-08-29 (triage seat)) — the same 129 lines from the precision side, and its measurement is the one that changes what should be built: the UNRUNNABLE arm is 7 for 7 FALSE over all 316 live cards — six blocked_by arrows and a CSP directive — and it does not fire on T-141 either, so the sentence claiming it mechanises the T-141 shape describes the concept and not the pattern. CENSUS is what caught T-141; ANY_PROVENANCE caught nothing, at ~6% false of its own.

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

Amnesty triage 2026-08-29 (triage seat): PARKED — PROVED, not inferred: a one-line mutant makes brief.mjs --card exit 0 where its own stated contract says 1, and brief.spec.ts, card-figures.spec.ts and dispatch-order.spec.ts come back 62 passed together. docs/CONVENTIONS.md legends the four exit codes for every other gate in this repository and each of those has a spec that reads them; these two arms have none, across 129 changed lines. The two absorbed findings change what should be built rather than merely adding to it — one inference arm has ZERO true positives over all 316 live cards, and a fabricated ref VERIFIES. RESURFACES: the next tools/e2e dispatch, after T-120-s2 (which restructures the same package and should not be raced). The precision measurement SHALL be re-derived at the lane's own ref before the arm is kept, dropped or narrowed — 7-for-7 false is an argument for deleting a pattern, not for testing it harder.
