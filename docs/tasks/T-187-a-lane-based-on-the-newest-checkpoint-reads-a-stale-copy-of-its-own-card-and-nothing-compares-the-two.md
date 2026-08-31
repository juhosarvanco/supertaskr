---
id: T-187
title: A lane based on the newest `Checkpoint:` commit reads a STALE copy of its own card — the base rule buys a gated tree and silently pays for it in currency of the instructions, and nothing compares the two
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
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
