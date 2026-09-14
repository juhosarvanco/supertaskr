---
id: T-322-s6
title: "A quota refusal's stated reset instant is obeyed without a ceiling, so a provider that states a reset far in the future parks that work for as long as it likes: the capped growing delay is the other branch's, and nothing bounds this one"
feature: F-04
milestone: 4
size: XS
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-322 phase 2, measured at f0ee5ad9 — a refusal stating a reset instant in 2099 schedules the retry at that instant, delayMs 2281521600000, sourced to the provider, and the boundary reader never calls it due"
blocked_by: [T-322]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-322 records a refused spawn's next retry instant as the provider's own
stated reset where the refusal carries one, and otherwise as a CAPPED
growing delay. The cap is written into the second branch and argued
there — "the cap exists so a fourth refusal does not schedule a retry for
tomorrow" — and the first branch has none.

So a stated reset is obeyed whatever it says. A provider that reports its
reset wrongly, a header a proxy rewrote, a refusal whose text a reader
scavenged an instant out of: each lands on the run record as an instant
`dueRetries` will not call due until it arrives, and the work waits. The
wait verb's ceiling does not reach this, because the ceiling bounds the
HOLD where nothing else is eligible and not the scheduled instant the
coordinator revisits.

The card's own criterion is what makes this a filing rather than a
correction: it says in as many words that the instant is the provider's
where the refusal carries one, and puts the cap on the other branch. A
clamp is a change to the contract and not a repair of the build, so it
wants the owner's word on what the ceiling should be and on what the loop
should say when it declines a stated reset.

The verifier's second assigned correction narrows the way an instant is
read out of the text; it does not bound what a genuine stated reset may
be.

## Acceptance criteria

- WHEN a refusal states a reset instant further out than a declared ceiling THE recorded retry SHALL be the ceiling rather than the stated instant, and the record SHALL say that the stated one was declined and what it said.
- WHEN a stated reset is declined THE loop SHALL keep the refusal's own text on the record, because a provider that states a reset days out may be saying something the owner needs to read rather than something to clamp away.
- WHEN the ceiling is chosen THE conventions SHALL carry the figure once, beside the run record's own bullet, so a reader finds it where every other loop constant is.
- WHEN this lands THE bodies SHALL drive a stated reset inside the ceiling and one beyond it, on an injected clock, so the two branches are told apart rather than the cap being pinned by the delay branch alone.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes

## Verdicts
