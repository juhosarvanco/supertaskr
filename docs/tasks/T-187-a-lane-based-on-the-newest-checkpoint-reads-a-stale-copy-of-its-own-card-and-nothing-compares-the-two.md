---
id: T-187
title: A lane based on the newest `Checkpoint:` commit reads a STALE copy of its own card — the base rule buys a gated tree and silently pays for it in currency of the instructions, and nothing compares the two
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
suggested_by: "architect/integrator seat, 2026-08-31 — met while dispatching T-112-s4, not read: the card had been amended two commits above its own derived base"
builder:
review:
---

**MET, NOT READ.** This seat dispatched `T-112-s4` minutes after amending
that card, and the derived brief handed back a base two commits *below*
the amendment. The lane would have opened a card that did not contain its
own promotion — the section explaining why it had gone from priority 25
to priority 2 and become a blocker for two other cards.

It was caught by hand, because this seat happened to remember writing the
amendment. **That is precisely the kind of catch this project has already
measured decaying**: `T-167-s8`'s absorbed evidence is that over eleven
merged lanes in one night, every mechanically triggered gate held and
every memory-held obligation decayed.

## The mechanism

`dispatch-brief.mjs:1584` emits the base as

    value(`base commit: ${base}`, live(ctx, `${logVia}, newest Checkpoint`))

derived from `git log --first-parent` on main, filtered to subjects
opening with `Checkpoint:`. **That is the right rule for the TREE**: a
checkpoint is a commit whose gate battery was paid, so a lane starting
there starts from something known green.

**It is the wrong rule for the CARD**, and the two are the same commit
only by coincidence. Cards move between checkpoints — triage sittings
promote and park them, architecture sittings rule them, siblings get
absorbed into them. Every one of those is a board commit, and board
commits do not open with `Checkpoint:` because they have not paid the
battery and should not claim to have.

So the gap is structural rather than incidental: **the base rule
optimises for a gated tree and pays for it in currency of the
instructions, and the brief reports only the half it optimised for.**

## Why this is worse than an ordinary staleness

The brief's whole contract (`dispatch-brief.mjs`, rule 2) is that *"every
emitted figure carries the provenance that produced it, and the
provenance cannot be stripped."* The base row honours that to the letter
— it names the log command and the filter. **A reader who checks the
provenance finds it correct.** The row is not wrong about what it
derived; it is silent about what it did not.

The consequence is a lane that reads stale instructions while every
visible signal says its brief is derived and current, which is the same
shape as `T-182`'s finding one consumer over: the `Checkpoint:` prefix is
load-bearing, and **its consumers fail quietly rather than loudly.**

## What a fix decides

1. **Whether to move the base or to report the divergence.** Moving the
   base to main's tip trades a gated tree for a current card and is
   probably wrong — the gate battery is why the rule exists. **Reporting
   is the cheap half and almost certainly the right one**: compare the
   card file at the derived base against the card file at main's tip and
   say so when they differ.
2. **How loud the report is.** A `NOT DERIVED — <reason>` line in the
   command's existing idiom is one option; refusing outright is another.
   Refusal is defensible for a card whose ACCEPTANCE CRITERIA moved and
   noisy for one whose typo was fixed, and the command cannot tell those
   apart — so the honest answer is probably a loud, un-strippable row
   rather than a refusal. **Decide it on that argument, not on taste.**
3. **Whether the card is the only file with this property.** The same
   question applies to `method/roles/executor.md`, to `CONVENTIONS.md`
   and to any file the brief derives rows FROM. **Sweep the class** — this
   card was filed from a single instance and the sweep is where the real
   answer is. Say what is a member and what is not, with a reason for
   each non-member.

## Acceptance criteria

- WHEN the card at the derived base differs from the card at main's tip
  THE brief SHALL say so in a row that cannot be stripped, naming both
  refs.
- THE base row SHALL continue to name its own derivation; this card adds
  a fact, it does not replace one.
- A body SHALL construct the divergence — a card amended above its own
  base — and prove the row appears; a positive control SHALL prove it is
  ABSENT when the two agree, because a row that always fires reports
  nothing.
- THE sweep SHALL name every other file the brief derives rows from and
  say, for each, whether it has the same property and why.
- Verification: headless, the `tools/e2e` suite.

## Read beside

`T-182` (the `Checkpoint:` subject is load-bearing for two consumers and
both fail quietly — this is a third failure mode of the same prefix) and
`T-167-s8` (mechanical triggers beat memory-held obligations, measured
over eleven lanes). **Note that `tools/e2e` was held by a live `T-167-s8`
lane when this card was filed**, which is why it was filed rather than
fixed on the spot.

## TWO MORE INSTANCES IN ONE NIGHT, from `T-184`'s lane — and the second is a DIFFERENT SURFACE of this class

Recorded here rather than carded, because this card already owns the
class: **a lane and main hold different truths and nothing compares
them.** Both were met live inside one lane on 2026-08-31.

**Instance two — the card, exactly this card's mechanism.** `T-184`'s
lane was cut from the newest `Checkpoint:` and therefore read its card
as it stood BEFORE the standing triage sitting that absorbed `T-183`
into it. The dispatch summary described the absorbed card; the tree
carried the un-absorbed one; the executor contract makes the tree the
authority. So the lane correctly built the smaller card, named the
disagreement, and only found the absorption when its own merge forecast
CONFLICTED on its card file. **The catch was a merge conflict, not a
check** — and a docs-only divergence that had merged cleanly would have
produced no conflict and no signal at all.

**Instance three — the card ID, which this card's mechanism does not
cover but its CLASS does.** Nothing derives the next free card id. Two
seats filing concurrently both read the board's current maximum and both
pick maximum-plus-one, and the collision is invisible until a merge
because each seat's own tree is internally consistent. Measured: that
lane filed two routed cards as `T-185`/`T-186`, found on taking main in
that a triage sitting had already filed `T-185`–`T-188`, renumbered to
`T-189`/`T-190`, and was then told that `T-189` had ALSO been taken on
main while it worked and `T-190` was reserved for another lane. **Three
allocations, two collisions, one night.** They are now `T-191`/`T-192`.

**WHY THE ID CASE IS WORTH THE SENTENCE.** The base-commit case above is
a lane reading stale INPUT. The id case is two seats writing stale
OUTPUT into the same namespace. The remedy shape is the same and it is
the one this project already prefers — **a construction beats a check**:
an id derived from something lane-local cannot collide, exactly as a
scratch port derived from the card id cannot. A check that compares the
lane's card against main's would catch the first; only a construction
closes the second.

## CORRECTION — "a construction beats a check" IS FALSE FOR THE ID CASE, falsified by its own second instance

The paragraph above closes with the remedy shape this project usually
prefers: *"an id derived from something lane-local cannot collide,
exactly as a scratch port derived from the card id cannot."* **`T-186`
falsified that the hard way, by colliding a second time after adopting
it.**

Its own account, verified at this seat:

> I had concluded "derive a new card's id against the integration tip
> when you commit it." That is exactly what could not have caught
> `T-190` — it belongs to a live lane that hasn't merged, so it is
> **absent from main by construction**. `T-190` appears **0 times** in my
> merged-tree forecast. The id I would have certified free genuinely IS
> free in main, and still collides.

**The disanalogy with the scratch port is the whole point.** A port is
derived from the card id, **which the lane already holds**. A NEW card's
id has no such seed — there is nothing lane-local to derive it from, main
lacks every live lane's ids, and no lane may read a sibling's tree. **So
no construction is available to a lane at all**, and the sentence above
is wrong about this surface while remaining right about the base-commit
surface beside it.

**The answer is an ALLOCATOR, and only the dispatching seat can be one**:
it hands a lane its routed-card ids at dispatch, or the lane files with
no id and the seat assigns at merge. Adopted by the architect/integrator
seat on 2026-08-31 after **five** collisions in one night.

**And the backstop matters because the primary signal is absent.**
`git merge-tree` reports **no conflict** for two cards carrying the same
`id:` under different filenames, so a duplicate would land silently. A
duplicate-`id:` sweep over the MERGED tree — read from the authoritative
field, never from filenames, and run once against a planted positive so
it cannot be vacuous — is what catches the ones that slip.

## CORROBORATION — 2026-09-01, from `T-223`'s lane: the stale copy is not only the lane's OWN card, and it reaches a SUITE

Appended rather than filed beside, per `method/tasks/TASK-FORMAT.md`:
this card owns the class. **The instance widens it in two directions at
once, which is why it is worth attaching.**

**ONE — the stale card is a SIBLING's, not the lane's own.** This card's
mechanism is stated about the card the brief is FOR. A lane also carries
a base-old copy of every OTHER live lane's card, and
`tools/e2e/scripts/dispatch-brief.mjs` computes fence disjointness by
crossing a MACHINE-scoped list (the live worktrees, read now) with a
CHECKOUT-scoped one (the card files in the tree it runs in, read at the
base). So the ledger's verdict is a function of the reader's BASE, and a
sibling's fence narrowed on main after this lane was cut is invisible
here.

**TWO — the consequence is a RED, not merely a stale instruction.** Two
`session-economics.spec.ts` bodies spawn `brief.mjs` against the live
repository and assert exit 0, so the manufactured finding fails them —
and the refusal NAMES SIBLING LANES, so the lane that meets it
reasonably concludes the dispatch was defective when the wave was
disjoint the whole time.

**MEASURED, both sides, in one detached bench on Mac.lan, same minute,
same live worktree list — the ONLY variable is the checkout's card
copies:**

    session-economics.spec.ts at 28924c7 (T-223's base)  2 failed / 8 passed, exit 1
    session-economics.spec.ts at aad0cf7 (main's tip)    10 passed,           exit 0

The one card that moved: `T-230` declares `touches: [tools/e2e]` at
`28924c7` and `touches: [tools/e2e/scripts/card-preflight.mjs,
tools/e2e/tests/card-preflight.spec.ts, tools/e2e/fixtures]` at
`aad0cf7`. Five findings, one stale line.

**WHAT THIS ADDS TO THE REMEDY.** This card's remedy is about the brief
telling a dispatching seat that a card moved above its derived base. The
same comparison would serve a LANE and a SUITE: any reader crossing the
live worktree list with card copies is making a claim about main using a
tree that is not main, and the honest forms are to read those cards from
the integration ref (which is what `landing-gate.mjs` already does for
exactly this reason) or to say WHICH ref the card set was read at, so a
finding can be attributed instead of believed. The symptom half is
corroborated on `T-143-s1`.
