---
id: T-083
title: The range rule is right at the merge and inverted before it — and the sentence saying it never changes a gate's answer is now false three times
feature: F-06
milestone: 4
priority: 41
size: M
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-078-s9 (fifth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

**Two defects in the bullet that exists to stop people getting this
wrong, both found by the machine getting it wrong.** T-078 merged at
`fed70a2` to make CONVENTIONS describe the machine that exists; both of
these survived it, and one of them was falsified *by that very merge*.

## Defect 1 — the rule is stated for the integrator and handed to the executor

`docs/CONVENTIONS.md:403` states, in bold:

> the merge's diff means `<main-before-the-merge>..HEAD`, NEVER
> `<merge-base>..HEAD`

**Correct at the merge, inverted before it.** At the merge, `HEAD` is
the merge commit and contains both parents, so `<merge-base>..HEAD` does
carry everything main did in the meantime — the bullet's reasoning and
its T-027 example (9 files vs 36) are exactly right. **Before the merge
there is no merge commit.** `HEAD` is the branch tip, `git diff main
HEAD` is a symmetric comparison of two divergent tips, and main's own
newer work appears in reverse, as though this branch had modified it.

And the same bullet, twenty lines down, explicitly puts an executor in
the "before" case: *"THE EXECUTOR RUNS IT TOO, on the same trigger,
before handing off."*

Measured on T-078's own branch — nine `.md` files under `docs/` and
nothing else (T-078-s9):

| range, as an executor would run it | paths | BOOT | GRAPH |
|---|---|---|---|
| `git diff main HEAD` — the bullet's notation | **44** | FIRES (5) | FIRES (13) |
| `git diff main...HEAD` | 9 | 0 | 0 |
| `git diff main <merge-tree>` | 9 | 0 | 0 |

A docs-only branch is reported as having rewritten a Rust crate and the
parser library — **the same lie the bullet was written to prevent,
produced by following the bullet.**

**Measured a second time, on this pipeline's own architect.** The T-078
dispatch brief quoted the rule correctly and then computed
`d92dceb...d219482` — three dots, which is *definitionally*
`$(git merge-base A B)..B`, the labelled trap. It reached the right
16-file answer by the forbidden route. The two-dot form the brief
prescribed returns **76** paths pre-merge and misattributes main's own
history to the branch; the integrator reading that list drafted a false
alarm (that `d92dceb` had put `app/package.json` and five Rust files on
main outside any merge) and refuted it only by measuring `d92dceb`
against its own parent — six paths, all `docs/`.

**A rule whose notation is unsafe in the case it explicitly assigns is
not a rule, it is a trap with a warning label.**

**THE MECHANISM, ISOLATED AT T-080's MERGE — and it is sharper than
"imprecise".** At the merge, `<main-before>` is an ancestor of the merge
commit, so `git merge-base <main-before> <merge-commit>` **is
`<main-before>`** (`--is-ancestor` exit 0). Two dots and three dots
therefore **collapse onto the same set** — measured at `4683566`, both
return the same 12 paths. Before the merge they differ by main's entire
advance: 60 versus 12 at the same pair of refs.

So the prescribed and forbidden forms are *indistinguishable* exactly
where the rule is addressed, and differ *only* where the rule says
nothing. **The rule is not merely imprecise — it is true only where
nobody applies it**, which is why quoting it correctly does not protect
you and why three-dot survives as a plausible-looking refinement.

## Defect 2 — a sentence that is now false three times

`docs/CONVENTIONS.md:412`:

> It has never yet changed WHETHER the gate fires — both derivations
> fired all six times

Counterexamples, all from this week, all measured by integrators:

| merge | prescribed | naive |
|---|---|---|
| T-076 | 0 | 5 |
| T-069 | 0 | 18 |
| T-078 | 0 | 18 (GRAPH) **and** 0 vs 6 (BOOT) |

T-078 is the one that matters: **the BOOT GATE bullet's own claim was
falsified by the merge that shipped it.** It is not accidental — any
lane cut from a checkpoint whose main has since advanced with work in
the other language reproduces it, and lanes are now routinely fenced to
one tree.

The consequence is worse than a stale sentence. The bullet's stated
justification for care is that the naive range *"changes what you tell
the human the merge touched"* — a presentation concern. It now also
changes **whether a gate is run at all**, which is a correctness
concern, and the two deserve different weight.

## Acceptance criteria

- THE range rule SHALL be stated in a form that is correct **both** at
  the merge and before it, or SHALL be split into two explicitly labelled
  rules addressed to the two readers the bullet already names. A single
  notation presented to both readers SHALL NOT stand.
- **THE SAFE PRE-MERGE FORM SHALL BE GIVEN AS A COMMAND, NOT AS PROSE**,
  and the card SHALL state which of the three measured forms it is and
  why. `git diff main <merge-tree>` needs no merge commit and was the
  row that settled T-078-s9 — the card SHALL say whether it is
  recommending that, three-dot, or something else, and SHALL NOT leave
  the reader to infer it.
- **THE THREE-DOT TRAP SHALL BE NAMED EXPLICITLY.** `A...B` is
  `$(git merge-base A B)..B` — it IS the forbidden range under a
  notation that looks like a refinement of the prescribed one. This
  pipeline's own architect fell into it while quoting the rule. A rule
  that says "never `<merge-base>..HEAD`" without naming the notation
  that silently spells it is incomplete.
- THE falsified sentence SHALL be corrected to what is now true, with
  the three counterexamples cited by task id, and the mechanism named
  (a lane fenced to one tree, cut from a checkpoint whose main advanced
  in the other). **It SHALL NOT be softened into "rarely"** — the
  measured rate this week is three of three.
- THE distinction between "changes what you tell the human" and
  "changes whether a gate runs" SHALL be stated, since the bullet
  currently justifies the rule only by the weaker one.
- IF the corrected text would make any existing worked example wrong
  THEN the example SHALL be re-measured rather than deleted — T-027's
  9-vs-36 is the bullet's oldest evidence and is still correct **at the
  merge**, which is exactly the distinction this card is drawing.
- **THE CARD SHALL VERIFY ITS OWN FIGURES AT A NAMED REF.** Every count
  in the merged text SHALL carry the commit it was measured at, because
  this file has now gone stale inside the document correcting it
  (T-078-s7) and no corpus figure in it survived a week.

Verification: headless — the parser suite (CONVENTIONS is read off disk
by `kit.rs`'s `snapshot_version_matches_the_live_method_stamps` on every
`cargo test`), `workflow-parity.spec.ts` which derives CI parity from
this file, and a re-measurement of all three ranges on a fixture
repository reproducing the pre-merge and at-merge cases. Every corrected
figure poisoned to its old value and shown RED. @human: whether the
split rule reads as one idea or two.

## Implementation notes

## Verdicts
