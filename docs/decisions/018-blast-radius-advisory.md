# ADR-018: ceremony scales with blast radius — advisory now, binding at a measured flip

Status: ratified. Date: 2026-08-30. Decider: @human.
Provenance: adopted 2026-08-25 as item 5 of T-131's five process
changes, the architect's objection having been put and overruled at
that ruling; the thresholds and the advisory disposition ruled
2026-08-30 and stamped at the foot of T-135's card — "ADVISORY NOW,
BINDING AT THE MEASURED FLIP". The reasoning is T-135's planning pass
§0–§12, its Half A implementation notes and the Half A verdict.
@human's ruling is the authority; this record is the argument the
objection made it owe.
Numbering: 018 was RESERVED for this decision. ADR-019's own header,
docs/rooms/governing-docs.md and docs/ROADMAP.md's F-01 entry each
name T-135 Half B as its owner, so the deliberate gap is closed here
rather than moved.

## The decision

Ceremony gains a SECOND axis. `size:` keeps the half it actually
knows — how long the work is, and therefore whether it owes a planning
pass — and a measured DIRECT-DEPENDENT count takes the two rungs that
are about risk: whether a card owes a verifier, and whether it owes a
separate integrator. Rung 0 is no direct dependents, rung 1 is one to
seven, rung 2 is eight or more; `L` still buys a planning pass at any
rung. Nothing is deleted: the three rungs are the three the ceremony
table already has, so the mapping is total and an M or L card at a
cheap rung becomes spellable where before it was not.

The rungs, the three coverage classes, the floor rule, the prose-only
override and the flip condition live where a dispatching seat meets
them — method/tasks/TASK-FORMAT.md's *"Ceremony by blast radius —
ADVISORY"* section. **That section is generic on purpose.** method/
ships verbatim into every project the kit materializes, so it names no
path, no command and no card id; this record carries nputer's.

**THE RUNGS BIND NOTHING TODAY.** They are computed, printed at
dispatch and recorded on the card; the existing ceremony-by-size table
governs every dispatch, and where a rung and a row disagree the ROW is
obeyed. The disagreements are the data the advisory period is for.

## The architect's recorded objection, and that @human adopted with it in view

Preserved verbatim in substance from the 2026-08-25 ruling: **this
rests on one session, five merges, and one unusually introspective
repository.** It would change how every card in the project is
dispatched. It is the most valuable of the five process changes if
true and the least evidenced of the five as measured.

**@human adopted it with that in view.** The objection therefore
became the card's obligation rather than a reason to decline: the ADR
SHALL argue the decision with a measurement rather than record it as a
preference, and the rollout SHALL be reversible. Both halves of that
obligation are discharged below, and the second one is the reason the
policy is one section of one file plus this record.

## The measurement, which answers the objection in both directions

### FOR — the graph was blind, measurably, in the failure direction

    cd app/src-tauri && cargo run -q -p nputer-index -- index --check --root ../..
    cd app/src-tauri && cargo run -q -p nputer-index -- arch drift --root ../..

The indexer recorded `use` imports only, so a `mod` declaration plus a
path expression — the strongest dependency Rust has — produced **zero
edges** (`T-126-s4`, verified three independent ways). Half A fixed it
by feeding resolved `mod` pairs through the existing `import`
accumulator. Nine core Rust files read exactly zero dependents before
the fix, the crate's largest extractor among them: **the files whose
blindness the rule would have priced cheapest were the ones the rule
most needed to price.** The lane's figures were re-derived
independently by the verifier from the Rust module rules, without
reading the lane's code, and came back **set-equal** — the edge sets
compared on the full tuple, 32 added, 0 removed, 0 changed in place.

**And the fix immediately surfaced a TRUE dependency no gate could
see**: `app/src-tauri/src/lib.rs` (C-05) declares `pub mod dispatch;`
(C-15), and `arch drift` gained a D1 for the undeclared edge.
`git log -S "pub mod dispatch;" -- app/src-tauri/src/lib.rs` names
T-126's commit, and
`git log -S "C-15" -- docs/architecture/components/C-05-app.md` is
**EMPTY** — the dependency has been real since T-126 and the
declaration has never existed. **Reveal, not create.** It is the
single best piece of evidence the change has, and it is evidence FOR
the measurement rather than for the ceremony rule.

Every figure behind this paragraph is stamped on T-135's card at the
ref it was measured at, with its command. None is transcribed here as
a live claim, because a figure in a decision record with no keeper is
a line number by another name (ADR-019 Law 2).

### AGAINST — on the board that ruled it, the rule was a constant function

The same session that produced the evidence above produced the finding
that decides the disposition, and it is a finding about the PROPOSAL:
**no card's `touches:` had ever named a code file.** Every code fence
in the project's history was component-sized, every component-sized
set contains a rung-2 file, and so the rung was a constant — the top
one — on the whole planned board and on all but a handful of the done
board. §6's table stamps that at `70b1d40`.

With §7's coverage-class correction the rule becomes two-valued, and
the split it produces is **code versus not-code** — which is exactly
the rule of thumb the ceremony table already carries (*"docs, method
and tooling self-integrate; anything a user could run does not"*).
**It adds no information over the rule it would replace, and costs a
derivation per dispatch.**

**This is not a defect in the metric.** The per-file distribution
separates cleanly and its top rung has high face validity — the
sixteen files it names are the list a careful reader would write by
hand. The metric has simply never been handed an input finer than a
component.

**BOTH HALVES ARE THE SAME SESSION'S AND BOTH ARE COMMANDS. An ADR
that carried only the first half would be precisely the preference the
architect's objection warned about.**

## The ruling: advisory now, binding at the measured flip

The rungs are computed and printed at every dispatch and recorded by
the seat, binding on nothing. They BIND on the day a re-derivation
shows the **middle rung non-empty** — at least one planned card whose
fence resolves to rung 1. That is a measurement, not a date.

nputer's derivation is one command, whose spelling docs/CONVENTIONS.md
owns:

    cargo run -p nputer-index -- arch blast <path|slug> --root ../..

run from app/src-tauri/ over the planned board's fence entries. It
reads the COMMITTED graph, reverses the forward `import` edges at read
time, and stores nothing — a reverse index that could disagree with
the forward one would be two implementations of one fact (T-057), so
the derivation IS the pin.

**THE FLIP CONDITION IS LIVE AT THIS RECORD'S OWN REF AND MUST BE
ASKED RATHER THAN ASSUMED STILL-FALSE.** The prerequisite has its
first adopter. Derived here with one command, run at two refs:

    git grep -l '^status: planned' -- docs/tasks | xargs grep -h '^touches:' \
      | tr ',' '\n' | sed 's/^touches: *\[*//; s/\]//; s/^ *//; s/ *$//' \
      | grep -E '^(app|lib)/' | sort -u

At `70b1d40`, the ref §6's table was measured at: **35 planned cards,
zero entries.** At `4df2305`, and again at `9471027` — this record's
own commit's parent: **70 planned cards, two entries** —
`app/src/genesis/genesis-derive.ts` and
`app/test/genesis-derive.test.ts`, both on the one card `T-159-s4`,
whose fence names single walked files beside a `method/` path and a
tooling script.

**Whether that card resolves to rung 1 is `arch blast`'s to answer and
is deliberately NOT answered here.** Computing it in this document
would be a second implementation of the dependent count, which is the
exact hazard criterion 3 exists to prevent. The next dispatching seat
asks the command; the flip is its answer, not this record's.

## The blocker the flip inherits, stated rather than deferred

§7's floor rule — **a build-target root is never at rung 0** — cannot
bind while the derivation marks only some of its roots. `arch blast`
shares one definition of a cargo target root with the indexer, which
is right; **this crate computes no TypeScript entry points**, so
`app/src/main.tsx`, `app/vite.config.ts` and `app/vitest.config.ts`
print a bare `dependents=0`, indistinguishable from genuinely
unimported files — in exactly the failure direction the whole axis
exists to close. The gap was named in Half A's correction 8 and in the
verdict's F3, and it lived nowhere a reader of the command would meet
it. TASK-FORMAT's section now states it as a **precondition of the
flip**. The same class, larger: `T-135-s1` (parked) — `arch blast`
resolves the package seam at COMPONENT granularity, so a file inside
a consumed package reads its own in-package dependents where the
true cross-package count is many times larger, the same under-count in
the same direction. Closing either in the output is a `crate-index`
card, not this
one's, because this half's fence is prose.

## What would falsify it — three named, cheap checks

1. **Re-derive §6's table after code fences go path-granular.** If the
   middle rung is still empty, the rule is dead and this ADR is
   superseded by its own evidence.
2. **Take any card the rule rates rung 0 or 1 and ask whether its
   actual defects were caught without a verifier.** If they were not,
   the thresholds are too high.
3. **If a rung-2 card's verifier finds nothing on N consecutive
   cards**, the top threshold is too low.

Every override written into a card body under the section's
override clause is a fourth, free datum about where the thresholds
actually belong.

## The prerequisite, named as a prerequisite and not as future work

**Path-granular code fences.** T-108 already ruled the norm — *a fence
names the paths a lane WRITES, at the narrowest granularity that still
covers them* — and the board had adopted it in zero of its entries at
the ref the rungs were derived at. The rungs are therefore blocked on
a discipline this project has already adopted in writing and not yet
in practice. **The flip measures FENCE DISCIPLINE, not the metric.**
That is why the disposition is advisory rather than declined: the
evidence against binding is evidence about the inputs, and the inputs
are moving.

## Reversal

**Reverting this decision is `git revert` of one commit.** The whole
policy footprint is one section of method/tasks/TASK-FORMAT.md plus
this file. Nothing is stored: the number is derived on demand, no card
frontmatter records it, no field was added, no parser changed, no
schema moved and no gate reads it. `arch blast` survives a reversal as
a reporter, and Half A — the `mod` edges, the Rust edge-coverage
ruling and the narrowed disclosure — is independently valuable and is
not part of this boundary.

## Supersedes / amends

Amends nothing. **Extends** method/tasks/TASK-FORMAT.md's ceremony
table rather than replacing it: the size table keeps full force, and
the second axis is advisory until the flip. Extends ADR-020's
trajectory — the method measuring itself — to the dispatch decision.
Rust's remaining edge gaps are ruled SAFE for a file-granularity
dependent count and UNSAFE for any symbol-granularity question;
`T-010-s6` is the standing record of that gap and the crate's own
disclosure names both halves.
