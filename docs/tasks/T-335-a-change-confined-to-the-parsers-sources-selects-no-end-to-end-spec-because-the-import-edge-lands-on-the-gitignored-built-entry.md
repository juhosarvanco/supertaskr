---
id: T-335
title: "A change confined to the parser's sources selects no end-to-end spec at all, including the two specs that statically import what those sources build, because the import edge lands on the gitignored built entry and no changed path can ever be that file: give the derivation the build relationship between a generated entry and its owning sources, keep the fail-closed answer where no relationship can be read, and prove the coupling with a range that moves a parser source alone"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: building
suggested_by: "the T-331 verifier bench on 2026-09-15, measured through the blessed runner on a range whose only changed path was a parser source; the behaviour is older than T-331 and that card's narrowing is what makes it reachable on the runner"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Filing provenance

Filed 2026-09-15 by the architect seat at T-331's merge, from the finding its verifier bench raised and could not repair inside that card's fence. The verifier drafted it under the identifier T-334; the seat reallocated it to T-335, because T-334 had already been allocated the same day to the resume-seat card the owner approved from the Codex orchestrator's lean-handoff bundle. Priority was raised from the draft's 2 to 1: this is a coverage hole that T-331's narrowing makes reachable on the runner, and it should not sit behind ordinary work.

Its fence shares `tools/e2e/scripts/gate-run.mjs` and `tools/e2e/tests/gate-run.spec.ts` with T-330, so the two run in sequence and never beside each other. The seat's intended slot is immediately after T-330. Preflight at promotion; no board preflight has been run against this card, which this project can only do once a card is a dispatch candidate.

Near-term exposure is bounded and was checked rather than assumed: the parser and app suites still run on such a push, and the whole battery runs nightly on main.

**THAT PREMISE WAS REFRESHED ON 2026-09-17 AND ONE HALF OF IT NO LONGER HOLDS.** When this card was filed, no card in the queue touched the parser's sources. T-312 does: its fence carries `lib/parser/src/model-session.ts` and its unit test. So the defect is reachable by queued work, and whoever schedules T-312 before this repair lands SHALL cover the affected consumers explicitly under existing verification rather than inferring safety. **Parity between the local derivation and the runner's establishes nothing here**, because both run the same derivation; two copies of one answer agreeing is not evidence the answer is complete.

## The finding

Two end-to-end specs import the parser library's built browser entry by
path, an edge T-317 introduced. The owed-set derivation walks that edge and
reaches the BUILT file, which `lib/parser/.gitignore` excludes from the tree.
A pushed range's changed paths come from git, so that built file can never be
among them, and the edge can therefore never contribute a selection. Its only
effect on the derivation was the fail-closed answer that T-331 removed.

Measured on the T-331 verifier bench through
`gate-run.mjs --owed-set --range`, on a prepared tree, over a real range whose
only changed path was `lib/parser/src/pure.ts`: the owed set is `app, parser`,
the end-to-end leg is narrowed, and it carries ZERO spec files. Neither
importer of the built entry is selected. `packageDependents` carries the edge
from the parser to the app and no edge to the end-to-end package, whose own
manifest still declares that it imports neither.

Until T-331 the planning job fell back to the whole battery on every push, so
the runner ran both specs regardless and this cost nothing. The narrowing is
correct and is that card's whole point; this is the one coupling the narrowing
leaves unrepresented, and it is the coupling that card studied.

The parser suite and the app suite still run on such a push, and the whole
battery runs nightly on main, so the exposure is bounded rather than open.

**WHY THE FAIL-CLOSED ANSWER IS WORTH KEEPING, measured 2026-09-16
off-index at `e4050bd2` over three probe commits that moved no branch,
index or worktree.** Under the machinery as it stands, a tracked file that
nothing reads and lies under no package root is UNPLACEABLE and takes the
whole battery with the end-to-end leg at 42 of 42 spec files; a
documentation file nothing reads still owes the end-to-end suite, because
the census, the index and the board-reading bodies walk that directory. So
THE LEAST EXPENSIVE OF THE MEASURED CASES STILL SELECTED ONE SUITE. Three
probes do not establish a floor for every tracked path and this note
claims none — it reports what the measured cases did. It is the context
for this card's second criterion: the fail-closed answer is not a
placeholder to be optimised away once the generated-entry relationship is
readable, it is what an unreadable relationship must still cost.

## What would settle it

The derivation reads the relationship between a generated entry and the
sources that produce it, through the owning package's own build configuration
rather than by rewriting a path, so that a change under a package's sources
reaches every spec importing that package's build output. Where no such
relationship can be read, the answer stays the fail-closed one and names the
input it could not place, exactly as it does today. A body proves the coupling
over a range that moves a parser source alone and requires both importers to
be selected, and a companion body requires the answer to stay fail-closed when
the relationship is unreadable.

## Acceptance criteria

- WHEN a pushed range changes only files under a graded package's own sources
  THE derivation SHALL select every spec file that reaches that package's
  generated entry through the static import graph.
- WHEN the relationship between a generated entry and its owning sources
  cannot be read THE derivation SHALL answer the whole battery and SHALL name
  the input it could not place.
- WHEN the derivation resolves a generated entry through its owning sources
  THE answer for a range that moves no source of that package SHALL be
  unchanged from the answer it gives today.

## Implementation notes

**A DESIGN NOTE, RECORDED 2026-09-17, AND DELIBERATELY NOT A CRITERION.**
Before adding a placement path, say here whether the settings consumer map
T-330 landed for the runtime template can carry the generated-entry
relationship as well, or why it cannot. The two answer different questions
— that map discovers runtime-file readers through path and constant
spellings, while this repair concerns a generated-output-to-source edge in
the import graph — so forcing one abstraction onto both is not obviously
right. The new path need not be independent of the existing ones; that is
a matter for the design rather than a constraint this card imposes. An
earlier draft proposed this as an acceptance obligation and it was
withdrawn to a note on review.

## Verdicts
