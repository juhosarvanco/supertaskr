---
id: T-052-s5
title: integrator.md now holds two 1-4 lists and every citation in the tree cites by number
status: parked
suggested_by: verifier claude-opus-5 @T-052-verify
---

**T-052 added a section to `method/roles/integrator.md` with its own
`1.`–`4.`, so the file now holds TWO numbered lists of four.** The four
STEPS were not renumbered — verified at both blobs, column-0 numbered
lines `1.`@5 `2.`@25 `3.`@27 `4.`@35 at `c4cfe52` and `1.`@5 `2.`@25
`3.`@30 `4.`@40 at `966b8dd`, same four numbers on the same four
sentences, and `integrator.md:5` byte-identical. Nothing is broken today.

**THE HAZARD IS THAT EVERY CITATION OF THIS FILE IN THE TREE CITES BY
NUMBER**, and a number is now ambiguous:

    docs/tasks/T-089-…:111    "step 1 REPLACED … step 3 says … step 4 removes"
    docs/tasks/T-089-…:538    "integrator.md step 2's own point"
    docs/tasks/T-089-…:1406   "(integrator.md step 3)"
    docs/tasks/T-089-…:1492   "the ritual is roles/integrator.md step 3"
    docs/tasks/T-089-…:42,184 "integrator.md:5"

"integrator.md step 3" resolves to the checkpoint ritual for a reader who
starts at the top and to *"record it in the checkpoint"* for a reader who
lands in the new section — two different sentences, both plausible, both
about checkpoints, which is what makes the confusion silent rather than
loud.

**THE FILE DOES DISAMBIGUATE, BY VOCABULARY, AND THE CONVENTION IS
UNWRITTEN.** The new list calls itself *rules* in three places — *"Rules
1 and 2 are the breakage channels; rules 3 and 4 are what makes either
kind attributable"*, *"see the last rule of the section below"*, and the
lane's own notes say *"`integrator.md` rule 2"* — while every existing
citation says *step*. That distinction is doing real work and nothing
states it, so the next editor to write "integrator.md rule 2" meaning
step 2 will be neither wrong nor understood.

**THIS IS THE SIBLING OF A RULE CONVENTIONS ALREADY HAS.** *"A CITATION
NAMES A SYMBOL, NOT A LINE"* (fourth triage) was written because four
findings cited line numbers that drifted. A list ordinal is the same
class of reference: stable until somebody inserts, and silent when it
moves. The `.md` case has no `git grep`-able symbol the way a function or
a test does, which is exactly why the convention has to be spelled.

## Three dispositions, cheapest first

1. **Write the vocabulary down** — one sentence in `integrator.md` or in
   CONVENTIONS: the top-level list is STEPS, a list inside a section is
   RULES, cite accordingly. Costs nothing, pins what the file already
   does, and is the only option that fits inside `[method/,
   docs/CONVENTIONS.md]`.
2. **Give the section's rules distinct labels** (`C1`–`C4`, or letters),
   so a bare number can only mean a step. Slightly louder, cannot be
   mis-cited at all.
3. **Cite by HEADING plus keyword instead of by ordinal** — the `.md`
   form of CONVENTIONS' symbol rule, and the one that also fixes the five
   existing citations. The most work, and it touches `T-089`'s card,
   which is `done`.

Not blocking, and deliberately not folded into the T-052 verdict: the
citations all resolve today and the file is internally consistent. It is
filed because the ambiguity was created by a change that was otherwise
careful NOT to break those citations — the renumbering hazard was seen
and closed, and this is the half of it that stayed open.

Amnesty triage 2026-08-29 (triage seat): PARKED — the ambiguity is live (method/roles/integrator.md still carries two numbered lists and the tree's citations still cite by ordinal), and the cheapest arm is one sentence of method text — which is exactly the seat T-159 holds. RESURFACES: the next method/ dispatch — T-159, the v0.1.8 metabolism release, is that dispatch; take arm 1 (the top-level list is STEPS, a list inside a section is RULES) as a rider there.
