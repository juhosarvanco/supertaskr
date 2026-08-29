---
id: T-105
title: Sweep the done cards for lessons that live only in notes — five instances now, every one believed written by somebody
feature: F-01
milestone: 4
priority: 61
size: M
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, method/]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-150-s1 (Amnesty triage 2026-08-29 (triage seat)) — two more instances for this card's own sweep, and the second is stronger than unwritten — the repository CONTRADICTS it. "no real model call in any test" and "no CLI spawn from a test" appear nowhere in docs/CONVENTIONS.md or method/, while brief.spec.ts spawns the brief CLI twice and boot-check-guard.spec.ts spawns the boot check, both green and both deliberate, one of them the proof of the boot gate's own refusal path. So the rule is either new, or has unwritten exceptions, or means only NEW tests — all three legitimate, and a session reading the brief cannot tell which.

Absorbs (seventh triage, 2026-08-24): T-101-s4 — files removed in this commit.

> **DRAFTER'S NOTE — remove before landing.** Two things. **(1) THE
> FENCE.** If the sweep routes any lesson into `method/`, T-078-s3's
> three-file coupling applies and this fence cannot carry it — either
> add `app-agent`, or make it a criterion that method-bound lessons are
> HANDED TO T-104 rather than written here. I have written the second,
> because a sweep that also does five edits in three trees is a
> different size of card. **(2) THE INSTANCE COUNT GREW WHILE THIS
> TRIAGE RAN**: the finding names three, and two more arrived in this
> same batch (T-092 and T-099 are each writing one down). That is the
> argument for the sweep, not a footnote.

Absorbs: T-078-s1 (sixth triage, 2026-08-20). That file is removed in
this commit.

**T-078 exists because two rules everyone believed were written were
not. Its own criterion, saying so, named a third that also was not.**
That criterion asked for the negative-control rule to be added *"beside
the constant-parametrisation rule T-063 produced, because they are one
lesson from two directions and a reader meeting one should meet the
other."* Measured before anything was written: **that rule was in
neither `docs/CONVENTIONS.md` nor `method/`** — `git grep -i -E
"parametris|parametriz"` over both returned zero, and so did `git grep
"T-063"`. The lesson existed only inside T-063's own implementation
notes, where its verifier wrote *"A test parametrised by a constant
cannot pin that constant."* The suggestion that asked for it was itself
describing a card's notes, not a governing file. It is written now
(verified at `4d2f03c`: CONVENTIONS carries it once, as the
negative-control bullet's companion sentence) — **but that is one
instance, and the shape is general.**

**Five instances, all "nowhere", all believed written by at least one
architect or verdict:**

| lesson | where it lived | where it is now |
|---|---|---|
| a negative assertion needs a positive control | T-060-s2's ask | CONVENTIONS (T-078) |
| lifting a safety guard to discriminate | T-060-s1's instance, fixed on the branch | CONVENTIONS (T-078) |
| a test parametrised by a constant cannot pin it | T-063's notes | CONVENTIONS (T-078) |
| **DRILL AT A COMMIT** — a restore cannot tell itself from a revert | T-072-s1 | **nowhere at `4d2f03c`**; T-092 is writing it |
| **a clean-state fixture must be pinned clean** | T-077-s5 | **nowhere at `4d2f03c`**; T-099 is writing it |

The last two were verified absent while drafting this batch: `git grep
-in "drill at a commit" -- docs/CONVENTIONS.md method/` exits 1, and no
clean-fixture rule exists in either tree. **Two new instances surfaced
inside one triage**, which is the strongest available evidence that
these are not three historical accidents.

**The ask is a SWEEP, not another rule.** Every card's `## Implementation
notes` and `## Verdicts` are where this project's executors and
verifiers write down what they learned, and **nothing routes those
lessons anywhere a next session reads**. The corpus is small enough to
read once: at `4d2f03c` the board is **168 flat task files — 64 done, 25
planned, 28 parked, 51 suggested** (64+25+28+51 = 168), and **84 files
carry an `## Implementation notes` section and 84 carry a `## Verdicts`
section**. Those counts are derived here and will move; the SHAPE is
"every card that has notes", which does not.

**The concrete question for each generalisable sentence: is it in
`docs/CONVENTIONS.md`, in `method/`, or nowhere?** And it pairs with the
citation rule T-078 added: **a lesson cited to a card's notes is a
lesson nobody will open.** If a rule matters it moves to the file that
governs; if it does not, saying so is also a decision and is worth
recording once so the next sweep does not re-litigate it.

## Acceptance criteria

- **THE SWEEP SHALL BE RUN OVER EVERY CARD THAT CARRIES NOTES OR A
  VERDICT, and its CORPUS SHALL BE DERIVED rather than listed** — the
  set of `docs/tasks/T-*.md` with an `## Implementation notes` or `##
  Verdicts` section, computed at the card's own ref and stated with it.
- **THE OUTPUT SHALL BE A DECISION PER GENERALISABLE SENTENCE, NOT A
  SUMMARY**: written to CONVENTIONS, written to `method/`, or
  deliberately left — with one line of reasoning for "left", so the next
  sweep does not re-open it.
- **EVERY "IT IS ALREADY WRITTEN" SHALL BE MEASURED, not remembered.**
  The instances above were all believed written by somebody senior. Each
  check SHALL name the command and its exit, **and SHALL NOT rely on a
  bare phrase grep** — the governing files are hard-wrapped, so a phrase
  spanning a line break returns nothing while the sentence is live
  (T-093's third false-empty cause, measured on this file).
- IF a lesson belongs in `method/` THEN it SHALL be handed to the
  method-snapshot card rather than written under this fence — a
  `method/` FORMAT change is a three-file commit whose third file is
  Rust (T-078-s3), and this card's fence cannot carry it.
- **THE TWO KNOWN-MISSING RULES SHALL NOT BE WRITTEN TWICE.** DRILL AT A
  COMMIT belongs to the taxonomy card and the clean-fixture rule to its
  own; this card CONFIRMS they landed and counts them, or writes them if
  those cards did not. A rule with two implementations is two chances to
  disagree (T-057).
- **THE SWEEP SHALL RECORD ITS OWN NEGATIVE RESULTS.** A card whose
  notes generalise to nothing is a real answer, and the record of "I
  read it and there was nothing" is what stops the next sweep repeating
  the read.
- IF the sweep finds more than a handful of unwritten rules THEN it
  SHALL propose where the ROUTING belongs — the role files, a checkpoint
  obligation, or a triage duty — because the recurrence is the finding
  and a sixth instance means the sweep is a patch rather than a fix.
- **NO CRITERION HERE IS MET BY A COUNT OF CARDS READ.** The deliverable
  is the dispositions.

Verification: headless — the DOCS GATE fires on every `docs/` path this
card writes (the CONVENTIONS edit at minimum); run what it owes and
record which suites and their exits, including CONVENTIONS' own live
readers. **This card may add no test body; if it adds none, say so and
name it**, per the drill's own clause about bodies that cannot be
poisoned. Every command quoted as evidence for an absence SHALL have
been run once against a planted positive before its zero is written down
(T-092's proof-command rule) — this card's whole method is absence
claims. @human: none.
