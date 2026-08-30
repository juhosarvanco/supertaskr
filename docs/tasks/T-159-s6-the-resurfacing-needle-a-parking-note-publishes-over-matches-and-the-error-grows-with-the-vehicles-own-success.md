---
id: T-159-s6
title: The needle that checks a resurfacing condition is a substring of every suggestion the vehicle itself spawns, so the rider census over-matched 17-for-14 one day after it was written down as exact
status: parked
suggested_by: executor claude-opus-5@subagent @T-159-s1
---

**CLASS PARENT: `T-159-s1`**, which says of itself *"this is the first
instance of a class the bump itself created"* — the resurfacing loop run
at scale. This is the second instance and it is about the loop's CHECK
rather than its answer: `T-159-s1`'s disposition was right for all
fourteen riders, and the command it publishes for finding them was
already wrong when the lane ran it.

**GENUS NOTED RATHER THAN MERGED — `T-092-s1`** owns the sibling shape
one layer down (*"the rejected-encoding pin searches a WHOLE card for a
phrase that card's own body may carry"*), and the root sentence is the
same: **a token match over a whole card body is not an assertion about a
field.** It is filed separately rather than as a corroboration because
the two want different seats and different fences — `T-092-s1` is a
`lib-parser` vitest assertion, this is a TASK-FORMAT/triage-practice
question with no code in it, and folding a practice question into a code
card is how one of the two silently does not happen. **Triage may
disagree and merge them; the filer says what it considered.**

## The measurement, at `51fa31c`

`T-159-s1` states its own census as a command and an answer:
*"`grep -l 'T-159' docs/tasks/T-*.md` returns 25 files at this ref …
Filtering to `status: parked` gives the fourteen named in this card's
fence."* Re-derived at the ref the lane actually executed at:

| command | answer |
|---|---|
| `command grep -l 'T-159' docs/tasks/T-*.md` at `9a8a2e9` (filing) | **20** |
| the same at the promotion ref, per the card | **25** |
| the same at `51fa31c` (execution) | **29** |
| of those 29, `status: parked` | **17**, not 14 |
| after excluding the vehicle's own train (`docs/tasks/T-159*`) | **16**, still not 14 |

**The three false positives, each for a different reason, and only one of
them is fixable by a better glob:**

- `T-159-s2` — matches because **its own id contains the vehicle's id**.
  Every `T-NNN-sM` suggestion a card spawns is a substring match on
  `T-NNN` forever.
- `T-143-s2` — matches on **`T-159-s4` quoted in prose** as a worked
  example of a fence overlap. It has no relationship to this vehicle.
- `T-155-s5` — matches on *"a standing place if T-159's metabolism rules
  make one"*. Its own resurfacing condition is **the next checkpoint
  written for a `tools/method-evals` card**, which is a different event
  entirely.

## Why it is structural rather than one card's typo

**The false-positive rate grows with exactly the population the
metabolism rules guarantee will grow.** A vehicle card that lands well
spawns a suggestion train, TRIAGE-AT-THE-STAMP requires that train to be
dispositioned within one dispatch cycle, and every member of it is a
permanent substring match on the vehicle's own id. **So the needle
degrades fastest around the cards whose conditions are most likely to
have fired** — and it degrades silently, because the answer is a count
that still looks plausible.

The second and third false positives are the ones that matter, because
**no id-shaped filter can remove them.** They match because a card
MENTIONS the vehicle, and the question the checker is asking is whether a
card's PARKING NOTE NAMES the vehicle as its resurfacing condition. Those
are different facts and one is not a substring of the other. The
fourteen-versus-seventeen gap was closed here by reading three parking
notes by hand, which is precisely the cost the resurfacing condition
exists to remove: *"checkable by whoever cuts that lane instead of by
whoever remembers this card"* (`method/tasks/TASK-FORMAT.md`).

**AND THE CARD ITSELF PREDICTED THIS AND STILL PUBLISHED THE COMMAND.**
`T-159-s1` says *"this card's own count moved between filing and
promotion, and that is the lesson it exists to teach"* — then writes the
moved count down as exact. The count moved AGAIN, by three, between
promotion and execution on the same day.

## Three arms, cheapest first, none ruled, and the remedies are MARKED UNVERIFIED

1. **State the needle as two steps rather than one** wherever a parking
   note publishes it: the grep is the CANDIDATE set, and the parking note
   of each candidate is what decides. Costs a sentence, removes no work,
   and is honest about what the command can and cannot answer — the
   three-verdicts shape this project already prefers to a confident two.
2. **Give the parking note a machine-readable field** — a
   `resurfaces_on:` in the frontmatter, or a fixed sentence opener the
   card-input gate can read — so the question is asked of a FIELD and the
   card body stops being the haystack. This is `T-092-s1`'s own remedy
   one layer up, and it is the arm with the real payoff: the condition
   becomes checkable by a program at dispatch rather than by a reader.
   **It is also a TASK-FORMAT grammar change and therefore a method
   version bump whose third file is Rust** — which is why it is arm 2 and
   not arm 1, and why triage rather than a lane has to want it.
3. **Nothing, and say so.** The hand-filter cost this lane about ten
   minutes and produced a correct answer. If the board never again has a
   vehicle with a four-card suggestion train and two prose citations,
   arm 1 is enough. **Recorded as a real option** so that choosing it is
   a decision rather than a default.

**DISPOSITION HINT: arm 1 is a one-sentence edit to whichever file
publishes the needle and could ride any docs card; arm 2 wants the NEXT
method version bump and should be decided there, beside the other
grammar questions, rather than promoted on its own.** Do not take arm 2
inside a lane whose fence cannot reach all three bump stamps — that is
`T-145-s2`'s whole lesson and it was settled at v0.1.8.

## TRIAGE (2026-08-30, standing triage sitting #4) — PARKED, riding the next method version bump — and arm 1 is free to ride any docs card meanwhile

**THE SITTING TOOK THE CARD'S OWN DISPOSITION HINT.** Arm 2 (a
machine-readable `resurfaces_on:` field) is the arm with the payoff and
is a TASK-FORMAT grammar change, therefore a method version bump whose
third file is Rust. It is decided at the release, beside the other
grammar questions, and not promoted alone.

**ARM 1 IS NOT PROMOTED EITHER, AND THE REASON IS A FENCE FACT RATHER
THAN A JUDGEMENT ABOUT ITS VALUE.** Arm 1 is a sentence added *"wherever
a parking note publishes the needle"* — which is `docs/tasks/**`, the one
region every lane fence carries as `alwaysWritable`. A card whose
`touches:` is `[docs/tasks]` reserves nothing, and the preflight's
DEAD-fence-entry arm would be right to say so. Arm 1 has no durable
home of its own: it rides whichever docs card next edits a parking note,
and this paragraph is where a reader learns that.

**RESURFACING CONDITION: the next method version release card is cut.**
The card's measurement stands unchallenged — the needle over-matched
17-for-14 at `51fa31c`, and the population that breaks it is the
suggestion train the metabolism rules guarantee.
