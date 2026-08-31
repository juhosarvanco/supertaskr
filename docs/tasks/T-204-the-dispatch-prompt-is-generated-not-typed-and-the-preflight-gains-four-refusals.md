---
id: T-204
title: THE DISPATCH PROMPT IS GENERATED, NOT TYPED — every falsehood a lane met on 2026-08-31 came from the half the seat wrote from memory, beside a brief derived from the tree
feature: F-06
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [tools/e2e, method/roles]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); every instance is this seat's own, reported by the lane that met it"
builder:
review:
---

**`docs/STATE.md` ITEM 7 ALREADY NAMES THIS**: *what a dispatcher writes
from memory is the half that is wrong.* Eleven lanes on 2026-08-31 met a
derived brief standing beside a typed prompt, and **every falsehood came
from the typed half.**

## The measured instances, each reported by the lane that met it

- **"A PreToolUse hook enforces it"** — in *every* brief, false all night
  (`T-199`). The lane that drilled it found the write succeeded.
- **A card filename that does not exist** (`T-182`'s dispatch).
- **"T-090 argued the gate should not be an npm script"** — false;
  `T-142-s1` re-derived it: T-090's own criteria made it a script
  deliberately. **The argument was retired by the card it was credited
  to.**
- **"lanes live right now: none"** — stale in several briefs; four were
  live, and that churn redded three e2e bodies.
- **A base deviation restated by hand, lane after lane** (`T-187`'s
  class) rather than derived.
- **An un-triaged card dispatched** — `T-184` was promoted *after* its
  lane was cut, so it built a card missing four required fields.
- **`review: independent` missing on a guard-class card** (`T-167-s8`) —
  the verifier it should have had then found three mutants that would
  have refused every push in the repository.
- **An instruction contradicting `method/roles/executor.md`'s report
  spec** (keep figures out of your notes), reported by two lanes and
  withdrawn.

## What to build

**The executor and verifier prompts become `T-112`'s GENERATED output,
used verbatim.** The seat adds lane coordinates — worktree, branch — and
nothing else. Anything the seat wants said must first be something the
command can derive, or it does not go in.

**And the preflight / `--write-fence` gain four REFUSALS:**

1. **The card file must exist.** A dispatch naming a path that is not
   there is refused, not corrected by hand.
2. **`status: building` must be stamped BEFORE the cut.** This closes the
   un-triaged dispatch: a card still `suggested` cannot be cut, so it
   cannot reach a lane missing its required fields.
3. **A guard-class fence requires `review: independent` on the card.**
   Where the fence touches `.claude/` or a gate script, the field must be
   set at dispatch — which is what `TASK-FORMAT` already says and what
   this seat missed.
4. **`--next-id` scans main PLUS every live lane branch.** This is the
   only construction that closes the id namespace, and `T-186` proved
   why: an id derived against the integration tip **cannot** catch a
   collision with a live lane, because that lane's card is *absent from
   main by construction*. **Five collisions in one night.**

## What a fix decides

1. **Whether refusal 4 belongs in the preflight or in an allocator
   command.** This seat currently allocates by hand and it works; the
   question is whether a command should, and whether it can read sibling
   worktrees without violating the isolation lanes depend on.
2. **What happens when the seat genuinely knows something the tree does
   not** — a live CI outage, for instance. There must be a channel for
   that, or the rule will be broken the first time it matters. **Name the
   channel rather than forbidding the case.**
3. **Whether `T-160-s1`'s tripwire is the same lane.** That card asks
   what makes a dispatcher RUN the preflight; this one asks what the
   preflight then refuses. **They are complementary and may be one
   lane** — decide, and say which.

## Acceptance criteria

- THE generated brief SHALL be usable verbatim as the dispatch prompt,
  and a body SHALL prove it carries every row `method/roles/executor.md`
  requires.
- EACH of the four refusals SHALL be proved by construction — a
  nonexistent card path, a `suggested` card, a guard-class fence with an
  empty `review:`, and an id already taken **by a live lane branch rather
  than by main**.
- **EACH refusal SHALL carry a positive control proving it does NOT fire
  on the legitimate case**; four refusals that always fire are worse than
  none.
- NO instruction in the generated output SHALL contradict
  `method/roles/executor.md`; where the role file and a generator
  disagree, **the role file wins and a body SHALL pin that.**
- Verification: headless, the `tools/e2e` suite.

## Read beside

`T-187` (the base-staleness half of this class), `T-160-s1` (the
tripwire that makes the preflight run at all), `T-199` (the false
enforcement claim), and `T-190`'s card, which carries the id-namespace
derivation this card's refusal 4 depends on.

## THE `review: independent` REFUSAL HAS NOW BEEN EARNED THREE TIMES BY THE SAME SEAT

Recorded because refusal 3 above is no longer a precaution — it is a
measured requirement, and the measurements are all this seat's.

1. **`T-167-s8`** was dispatched guard-class with `review:` empty. The
   verifier it should have had by rule then found **three mutants of the
   guard's own `--root` constant surviving 25 passed / 0 failed** — two
   would have refused every push in the repository, one would have
   allowed every push for ever.
2. **`T-186`'s verifier assigned this as its correction 5**, in as many
   words: *"flagged so the next dispatch sets it."*
3. **`T-194` WAS the next dispatch, and this seat did not set it.** The
   lane stamped `independent` itself and said plainly that *"the repair
   belongs at the dispatching seat."*

**A correction written into a verdict, read by the seat it was addressed
to, and not applied to the very next card.** That is the same interval —
under an hour, with the finding in front of the reader — as the
`suggested`-to-`done` field trap this seat walked into after reading the
lane report describing it.

**It is the strongest available argument for refusal 3**, and for this
card's premise generally: an instruction that must be *remembered at
dispatch* is not a rule, it is a resolution. The preflight is where it
becomes a rule.
