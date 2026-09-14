---
id: T-213
title: BLIND VERIFICATION HAS A HOLE IN ITS ONE INSTRUCTION — "read only the card" is blind only when the worktree sits at the BASE ref, because the card is also the file the executor is required to write
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [method/roles/verifier.md, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts]
suggested_by: "T-197's verifier, which reported its own contamination in its first sentence rather than proceeding; the setup defect is the architect/integrator seat's, measured at 2026-08-31"
builder:
review: independent
---

**A VERIFIER REPORTED ITS BLINDNESS BROKEN BEFORE REPORTING ANYTHING
ELSE**, and the cause was the dispatching seat's, not its own.

## The instance, measured

The verifier's worktree was cut at the LANE TIP `ab873e0` instead of the
base `209e5d3`. At those two refs the same card is a different document:

    base 209e5d3  ->  249 lines   contract only
    tip  ab873e0  ->  432 lines   +184, the executor's notes

    git diff --numstat 209e5d3 ab873e0 -- <card>  =  184  1

So the instruction *"read ONLY the card"* — the instruction that MAKES
the verification blind — delivered the fix in one line, the executor's
two findings, its sweep table, its margin-guard figures, its drill
ledger, its before/after body counts, and **a section titled "For the
verifier" naming what is load-bearing.**

## THE GENERAL FORM, WHICH IS WORSE THAN THE INSTANCE

**The card is the ONE file a verifier is always told to read, and it is
also the file the executor is REQUIRED to write.** Those two facts have
always been true together and nothing has ever checked the ref they meet
at.

`docs/STATE.md` already routes LANE CONTEXT to a second message because
*"the agent reads the whole prompt"* — that fix was bought with four
contamination reports. **The same reasoning defeats the card itself and
the fix was never extended to it.** A second message protects the prompt;
nothing protected the worktree.

**AND THE CONTRACT MAY LEGITIMATELY NAME THE FIX.** Measured on this same
card: the BASE text already says *"the usual correct shape is to set
`process.exitCode`"* — that is the card specifying an approach, which a
verifier is supposed to know. **The line is not "does the verifier know
the intended shape" but "has the verifier read the executor's REASONING
AND MEASUREMENTS."** A fix that blinds the verifier to the contract would
break verification in the other direction.

## What a fix decides

1. **Where the base ref comes from.** It is already on disk — the lane's
   own merge-base — so it is DERIVABLE and must not be typed.
2. **Whether the check belongs to the dispatch or to the verifier.** A
   verifier that checks its own ref is a guard reporting on itself; a
   dispatch-side refusal is the `T-209` shape. Argue it, and prefer the
   side that cannot be forgotten.
3. **What happens to a verification already contaminated.** This
   instance's attack set is preserved at
   `/Users/ujju/Projects/nputer-V197-scratch` for exactly this
   comparison; a fix may use it as evidence but SHALL NOT assume the
   answer.

## Acceptance criteria

- A VERIFIER'S worktree ref SHALL be checked against the lane's
  merge-base, and a verifier cut at any ref carrying the executor's own
  commits SHALL be REFUSED with both refs named.
- THE base ref SHALL be DERIVED from the lane, never passed in.
- **A POSITIVE CONTROL SHALL prove a correctly-cut verifier is
  ALLOWED** — a check that refuses every verification is
  indistinguishable from one that works.
- **A body SHALL prove the CONTRACT half is untouched**: a card whose
  base text names the intended fix shape SHALL still be readable. The
  refusal is about the executor's notes, not about the contract.
- `method/roles/verifier.md` SHALL carry the rule in the same place it
  carries the read-only-the-card instruction, since a rule stated
  anywhere else is a rule that instruction contradicts.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Read beside

`method/roles/verifier.md` (the instruction this repairs), `docs/STATE.md`
item 7 (the second-message fix this extends), `T-209` (the
dispatch-side-refusal shape), and `T-207` (memory-held versus
mechanical — "cut the verifier at the base ref" is a resolution until
something refuses).

## The reason this is filed rather than fixed in place

**The verifier's own conduct is the finding worth keeping.** It opened
with the breach, quantified it (`184  1`), stated precisely what
survived — *"I read the executor's notes, not the diff; `brief.mjs` and
`brief-flush.spec.ts` are unopened"* — and refused to rule on its own
remedy: *"that call is yours, not mine."* **A contaminated verifier that
announces itself is worth more than a clean one that does not know it is
contaminated**, and the protocol should make that the cheap path.

## CORROBORATION — 2026-09-01, A SECOND CHANNEL, AND THIS ONE IS NOT IN THE REPOSITORY AT ALL

Appended per TASK-FORMAT rather than filed beside. It matters because it
shows the hole is **wider than the ref**, which is what this card
currently reads as being about.

### The instance

`T-210`'s blind verifier, unprompted, in its phase 1:

> My session scratchpad is shared across sessions and its directory
> listing incidentally exposed **filenames** belonging to this lane's
> executor — `T-210-notes.md`, `T-210-drill-ledger.json`,
> `T-210-dogfood.sh`, `T-210-suggestion-draft.md` — and others. I opened
> none of them and will not before phase 2. Names only, no content.
> Recording it rather than pretending the listing did not happen.

**The filenames alone carry lane context.** `drill-ledger.json` says a
drill happened AND was recorded as an artifact. `dogfood.sh` says the
implementation was run against a real tree rather than a fixture.
`suggestion-draft` says something was routed rather than absorbed. A
verifier assembling its attack set has learned three facts about the
diff before opening it.

### Why it belongs on THIS card and not beside it

This card's finding is that *"read only the card"* is blind only when the
worktree sits at the base ref — the leak channel being the REF. This
instance has nothing to do with the ref, the worktree, or the
repository. **The channel is a shared scratch directory on the host**,
which no wording of the reading instruction reaches and which the
dispatching seat did not think about when it sent two agents into the
same session.

So the generalisation this card should carry is not *cut the bench at the
base*. It is: **blindness is a property of every channel between the two
seats, and the instruction enumerates one of them.** The base ref closes
the loudest channel. It does not close the others, and nobody had
enumerated the others.

### Attribution

The dispatching seat's defect, not the verifier's. It dispatched an
executor and its verifier into a shared scratchpad without considering
that a directory listing is a channel. **The verifier handled it exactly
right** — opened nothing, declared it before the verdict, and named the
specific filenames so the leak's size is auditable rather than a vague
admission.

**Fifth leak into a blind phase in this sitting**, and the first that was
not something the dispatcher SAID. The other four — lane ports, card line
counts, tip lengths, shipped-code knowledge — were all fixable by writing
a better brief. This one is not.

### What a fix would have to reach

- A scratch location DERIVED per agent rather than shared per session —
  the same construction-over-check rule `T-217` records, applied to a
  directory instead of a port.
- Or an explicit instruction that a verifier does not list its own scratch
  directory, which is the weaker answer: it asks a seat to not-look rather
  than removing the thing to look at.

PREFLIGHT RULING (2026-09-02): the heading at line 106, "A SECOND CHANNEL, AND THIS ONE IS NOT IN THE REPOSITORY AT ALL", enumerates the channels through which blindness leaks on THIS card — the ref and the message — and is not an ordinal over this repository's history; the preflight's census-claim arm read the ordinal, and the count it wants is two channels named on this page, both above.

## Note of 2026-09-14 (pile 2 batch 3b, the owner's approval of 2026-09-14, pile 2 batch 3b, after the Codex orchestrator's reviews) — re-contract before dispatch; T-283-s4 stays separate

Criterion 1 as written refuses a verifier checkout carrying any executor commit. Since T-296 the verifier is two spawns — phase 1 blind at the base, reading the frozen contract (the card at the base) and producing the attack set, which the seal then supplies to phase 2; phase 2 on the candidate's own tip — so the criterion applied literally refuses every legitimate phase-2 bench. Before dispatch this card is re-contracted to state phase 1's frozen input boundary and phase 2's candidate checkout with its permitted disclosures; T-283-s4's filename-disclosure question joins that re-contracting as an open question, and the orchestrator role file joins the fence if the chosen route changes the dispatcher's duties. No fold and no confidentiality guarantee is approved by this note.

## Implementation notes

## Verdicts
