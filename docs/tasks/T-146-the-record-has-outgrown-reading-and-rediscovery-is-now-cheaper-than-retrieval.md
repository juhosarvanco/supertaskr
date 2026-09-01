---
id: T-146
title: The record now answers faster than it can be read — three times in one night a session rebuilt a belief the repository already held, and the fence is provisional because the remedy is not yet known
feature: F-06
milestone: 4
priority: 2
size: M
status: parked
suggested_by: architect claude-opus-5
blocked_by: []
touches: [method/roles/]
---

**The fence above is a PROPOSAL.** The remedy might be a reading rule
(`method/roles/`), a retrieval tool (`lib-parser`, `tools/e2e`), or a
change to what a checkpoint writes (`docs/`). **Triage owns it, and
whoever takes this must re-fence it before dispatch.**

## The measurement

Three times on 2026-08-26 a session spent real effort rebuilding a fact
the repository already recorded, in a file that session was supposed to
have read.

| what was rebuilt | already written | gap |
|---|---|---|
| `T-112` collides with `app-shell` on `app/src/assets` + `app/src/styles` | `STATE.md` item 11, `7fd6ffb` 15:20 — **naming both witness paths** | **3h21m** |
| this repository's D2 census contradicts itself | `docs/tasks/rejected/T-011-s1:18`, `14ee699` **2026-08-16** | **10 days** |
| `blocked_by` drives a working dependency-wave lens | `ROADMAP.md` F-06, long-standing | **~1 working day** |

The middle one cost a rejected card. The last one cost four accurate
declarations being cleared and a card filed to gate a defect that did
not exist. **The first one is mine, and it is the cleanest instance**:
STATE named the card, the collision and the two exact paths, and three
hours later the architect derived the same answer from a tool while
choosing what to dispatch.

## The claim

**This is not an attention failure and it will not yield to a sharper
instruction to read carefully.** The standing documents are

    docs/STATE.md          1055 lines
    docs/ROADMAP.md        1181 lines
    docs/ARCHITECTURE.md   1202 lines
    docs/tasks/T-*.md       291 files

A session that reads all four before working spends a large fraction of
its budget before touching anything — and **still** will not have item
11 of a numbered list in working memory when the relevant decision
arrives ninety minutes later.

> **The record has crossed the point where rediscovering a fact is
> cheaper than retrieving it.** Every session now pays, in tokens and in
> wrong turns, to rebuild what is already written down.

**And the incentive is inverted**: rediscovery *feels* like diligence.
Deriving `T-112`'s collision from a tool looked like exactly the careful
practice this project asks for. It was duplicated work that a
five-hour-old sentence had already done better, and nothing in the
process could tell the difference.

## Why this is F-06's problem and not a documentation chore

F-06 already answers *"what is drifting"* and *"what is holding the
release"* from committed facts. **The unanswered question is the same
shape**: *what does this repository already know about the thing I am
about to do?* Every instance above is a failed lookup, not a missing
fact.

## The shape of a fix, not the fix

1. **Make the standing docs answer a QUERY rather than a read.** The
   project already prefers a derived answer to a remembered one, and
   already built `brief.mjs` on exactly that principle for dispatch. The
   same argument applies to the record — but note that in instance 1 the
   tool ANSWERED CORRECTLY and STATE had answered first, so a second
   tool is not automatically the remedy.
2. **Shrink what must be read by moving the derivable half out.**
   `T-133` already moved four STATE sections to a command. The three
   instances here are all in the NARRATIVE half, which is precisely what
   `T-133` argued must stay — so this is in tension with a decision
   already taken, and that tension is the interesting part.
3. **Attach the record to the moment of use rather than the start of the
   session.** A dispatcher choosing a card wants item 11 *then*, not
   ninety minutes earlier. What that looks like mechanically is open.

**Do not take arm 1 by reflex.** Two of the three instances were sitting
in a file the session had already opened.

## One caution for whoever takes it

**Measure the baseline before changing anything.** The claim "retrieval
costs more than rediscovery" is stated here from three instances in one
night, all from one architect session, and **that is a small and biased
sample**. It is enough to file a card and not enough to justify
restructuring the standing documents. Per `T-142`, prove the measurement
can come out the other way before believing it.

Amnesty triage 2026-08-29 (triage seat): PARKED — THE MEASUREMENT THIS CARD RESTS ON HAS BEEN LARGELY ANSWERED AND MUST BE RE-DERIVED BEFORE ANYTHING IS BUILT. It cites STATE at 1055 lines, ROADMAP at 1181 and ARCHITECTURE at 1202; at this base they are 140, 157 and 142, under gated byte budgets, because ADR-019's compaction is exactly this card's remedy arriving by another route. What is NOT answered is the other row: docs/tasks/T-*.md was 291 files and is 342, and the three rediscovery incidents it measures all found their answer in a CARD or a rejected card rather than in a standing document. So the finding survives with its subject moved — the retrieval problem is the card corpus, not the governing set — and the fence on this card was always marked a PROPOSAL by its own author. RESURFACES: the next planning pass, or T-156's health bands, which are ADR-020's machine for noticing exactly this class going quiet or getting worse. Whoever takes it re-derives the table first and re-fences it, as the card instructs.

## CORROBORATION — 2026-09-01, AND IT NARROWS THE UNKNOWN REMEDY

Appended per TASK-FORMAT rather than filed beside. Recorded because this
card is parked on *the remedy is not yet known*, and this instance rules
one of its three proposed shapes IN.

### The instance

`T-203`'s card opens by asserting that `docs/CONVENTIONS.md` **already
says** *"an edit script's success is a GATE, not a step."* Measured at
`9d56b47` and again at `736aba6`: **zero occurrences.** The card was
written by a seat that believed it was quoting a governing document.

**The rule is real.** It was earned at `18d8166` and recorded in the
2026-08-30 rulings checkpoint. It lives in two task cards and three
checkpoint records — and **in no governing document at all.**

The lane's conclusion, which is the sharpening:

> That is why a seat able to quote it broke it three times, and the
> routed item is not that the CONVENTIONS bullet needs UPDATING. **It
> needs WRITING.**

### THE DISPATCHING SEAT MADE THIS WORSE THE SAME NIGHT

Recorded because it is the cleanest instance since the one this card's
own table calls "mine". Hours before that lane reported, this seat
discharged a `docs/STATE.md` byte breach by **moving five stable tooling
rules — including that exact one — out of STATE and into the 09-01
checkpoint record**, leaving a pointer.

That obeyed STATE's contract to the letter: *when the byte band warns,
content MOVES to the record; a hazard is never deleted to fit.* And by
this card's thesis it moved five live rules from a document sessions read
into a document nothing may depend on. **The contract and this card
disagree, and nobody had noticed because they had never been applied to
the same paragraph on the same night.**

### WHAT IT NARROWS

This card's fence offers three remedy shapes: a reading rule, a retrieval
tool, or **a change to what a checkpoint writes**. This instance is
evidence for the third, and gives it a concrete discriminator:

**ADR-019 splits MECHANISM from INSTANCE, and a byte breach is currently
discharged by moving whatever fits — which takes mechanisms too.** A rule
is a mechanism. Its home is a governing document. When STATE cannot hold
a mechanism, the answer is `docs/CONVENTIONS.md`, not a record — records
take the instance and nothing else.

**STATE is byte-capped and records are unread, so a stable rule has no
good home unless CONVENTIONS takes it.** That is the shape of the fix, and
it explains the whole class: every rule that ended up only in records got
there by the same legal move.

Whoever takes this card re-fences it, per its own instruction. This
corroboration argues the fence should reach `docs/` and the ADR, not
`lib-parser` or `tools/e2e`.

### CORRECTION TO THE PARAGRAPH ABOVE, SAME DAY — IT OVERSTATED

The self-accusation above is too strong, and the seat that wrote it is
correcting it rather than leaving a harsher figure standing. **An
overstated self-criticism is still a wrong figure in the log.**

`T-203`'s blind verifier was asked to test the conclusion rather than
accept it, precisely because the dispatching seat had a stake in it. Its
answer:

> What you did tonight is not the failure mode, and the difference is
> **the pointer.**

`docs-protocol.md` rule 6 makes moving content to a record the
**prescribed** remedy for a byte breach, and STATE's own contract records
that the remedy has always been *a POINTER where a list had grown.* That
move left one: STATE still carries the five traps **itemised** — the grep
shim, the scripted edit that must be read back, scratch-worktree
construction, the RANGE RULE, the push that cancels CI — each named, with
the record named. A rule still reachable from the governing document.

The edit-script rule is a different case: **it never had a
governing-document line at all.** It went from a commit straight into
records.

**So the accurate generalisation is narrower than the one above.** Not
*a rule in a record is a rule nobody obeys*, but:

> **A MOVE THAT LEAVES NO POINTER CONVERTS A RULE INTO AN ARCHIVE
> ENTRY.**

The pointer is the discriminator, and it is what separates the
prescribed remedy from the failure this card is about.

**What this does NOT weaken:** the lane's conclusion stands unchanged —
the CONVENTIONS bullet needs WRITING, not updating — and so does this
corroboration's argument that a MECHANISM's home is a governing document
while a record takes the INSTANCE. The contract and this card still
disagree about which of those a byte breach may move. That disagreement
is the finding; the dispatcher's own move was the prescribed remedy
working, and is evidence about the pointer rule rather than against it.
