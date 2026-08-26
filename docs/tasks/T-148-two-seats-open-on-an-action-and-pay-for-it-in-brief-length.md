---
id: T-148
title: Two of four seats have no reading instruction at all — their step 1 is an action, so everything standing they know has to arrive in a brief, and that is where the errors concentrate
feature: F-01
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [method/roles/]
builder: claude-opus-5
verifier:
built_by: claude-opus-5
verified_by:
review: same-model
---

**@human's plan, ruled 2026-08-26. This card implements it.**

## The finding

`verifier.md` opens on *"1. Run the full test commands"*.
`integrator.md` opens on *"1. Merge the task branch"*. **Both are
actions.** Only the orchestrator and the executor are told to read
anything.

So everything standing those two seats know must arrive in a brief —
retyped from the dispatcher's memory rather than read once from a file.
**And those are exactly the briefs where this project's dispatch errors
concentrated**: a fabricated citation, stale figures, a wrong ignore
rule, a defect suggested that did not exist, a brief pointing at a source
that did not carry the fact it claimed.

**Measured before the change, so step 4 can be answered.** Five briefs
written on the night of 2026-08-26:

    executor briefs   n=3   mean 3701 bytes
    verifier briefs   n=2   mean 4349 bytes

**The seat with no reading instruction gets the longer brief** — 17.5%
longer on this sample. Small n, and it is the direction the plan
predicts.

## The principle

> **A role file carries what is true for every instance of that role. A
> brief carries only what is true for this one.**

Today briefs carry both, and the standing half is where the mistakes
live.

## What each seat needs

|                | orchestrator | executor | verifier | integrator |
|----------------|----|----|----|----|
| STATE          | ✓ | ✓ | ✓ | ✓ |
| CONVENTIONS    | ✓ | ✓ | ✓ | ✓ |
| ARCHITECTURE   | ✓ | ✓ | ✓ | ✓ |
| ROADMAP        | ✓ | — | — | ✓ |
| lane-protocol  | — | ✓ | — | ✓ |
| the card       | the board | in full | **at its base ref** | + the verdict |

**ROADMAP splits cleanly**: the orchestrator chooses work so it must know
what the product does; the integrator ticks it. **An executor building
one card inside one fence does not — that is a real subtraction, not an
oversight.**

**The verifier's distinctive item is not a document, it is an
EXCLUSION.** It reads the card at its base ref and deliberately not the
executor's reasoning. **That blindness is the guarantee**, and it
belongs in the role file rather than in every brief's memory.

## What this card does NOT do

**It does not touch `docs/CONVENTIONS.md`, which is ~1300 lines read by
all four seats every time.** That is the single largest per-session cost
in the project and this plan does not address it. **Knowing it is the
elephant is not the same as moving it**, and it is a different card.

**It does not rewrite `orchestrator.md`'s list into a reference.**
@human ruled at `db4c903` that orchestrator step 1 carries ROADMAP **as
an explicit list**. A later plan does not silently undo an earlier
ruling; if the two should be reconciled, that is @human's call and not
this card's.

## FIRST MEASUREMENT AFTER THE CHANGE — 2026-08-27

Two executor briefs written for `T-149` and `T-150`, the first dispatch
after this card landed:

    baseline (5 briefs, 2026-08-26)   executor n=3   mean 3701 bytes
    after  (2 briefs, 2026-08-27)     executor n=2   mean 2311 bytes

**A 37.5% drop.** The removed bytes are exactly the predicted half: the
standing constraints — the range rule, the poison drill, port 1420,
`cargo clean`, `git add -A`, backticks in shell strings — now reached the
executor through `docs/CONVENTIONS.md`, which its step 1 names, instead
of being retyped.

**Small n, one author, and the author is the person whose theory it is.**
It is the predicted direction and not yet proof. Re-measure at the next
verifier and integrator dispatch, which is where the theory claims the
largest gain and where nothing has been measured yet.

**AND THE MEASUREMENT FOUND A GAP IT DID NOT PREDICT.** Checking which
constraints could safely be dropped showed that **`pkill` and
`git update-ref` appear NOWHERE in `docs/CONVENTIONS.md`** — 0
occurrences each, against 19 for port 1420 and 13 for the poison drill.
Those two prohibitions have existed only in briefs, which means they have
existed only in the dispatching session's memory. **They survived this
long because the same author wrote every brief.** They are stated
explicitly in both new briefs and they need a home.

## The measurement that decides whether the theory was right

Re-measure brief length after the next executor and verifier dispatch.
**If briefs do not get shorter, the theory is wrong** and the role-file
change should be reconsidered rather than defended. Per `T-142`, the
comparison needs a positive control: confirm the measurement can show an
increase before trusting it to show a decrease.
