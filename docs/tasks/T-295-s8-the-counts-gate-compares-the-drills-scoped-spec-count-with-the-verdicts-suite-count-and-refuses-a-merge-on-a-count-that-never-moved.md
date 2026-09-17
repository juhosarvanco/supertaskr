---
id: T-295-s8
title: "The counts gate compares the drill's scoped spec count with the verdict's suite count and refuses a merge on a count that never moved — at T-297's merge it read 35 (the owning spec, run by the drill) against the verdict's 714 (the owed set's e2e leg) and called it THE COUNT MOVED"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: verifying
suggested_by: "the seat (2026-09-11): the second merge through the verb stopped at `counts` with e2e 35 versus 714; the 35 was health-bands.spec.ts run alone by the re-drill, the 714 the verifier's owed range at the tip — two different measurements of two different things"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The verb's counts step takes "the counts this merge's own runs read" from whatever ran during the merge — at T-297 only the re-drill's scoped runs of the owning spec — and compares them to the counts the verdict claims for each leg. The verdict claimed the owed range's e2e count at the tip; the merge's own run had counted one spec. The step reported THE COUNT MOVED and stopped the merge, and the seat ruled it through by hand after reading both figures. T-295-s3 already says the guard can seldom judge; this is the case where it judges wrongly, which is worse than not judging.

## Acceptance criteria

- WHEN the merge's own runs produced a count over a DIFFERENT scope than the verdict's claim (a spec alone against a leg, or a range against the whole) THE counts step SHALL say the scopes differ and grade nothing, never call the count moved; WHEN the scopes are the same THE comparison SHALL stand as it is.
- WHEN a body in merge.spec.ts plants a verdict claiming a leg's count beside a drill that ran one spec THE step SHALL pass with the scope difference named.

## Amendment of 2026-09-13 — count-scope evidence (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — count-scope evidence. The step distinguishes established same scope, established different scope and unknown scope. Scope is derived from the available execution selection and the verdict's stated measurement context, never inferred from the numeric count or a shared leg name alone. Established same-scope measurements keep the existing comparison and its refusal on a changed count; established different scopes are reported and not compared. Missing or unresolved scope is reported as not judged for lack of scope evidence, never as a demonstrated scope difference or a passed comparison. Bodies cover a same-scope mismatch, equal counts from different selected sets and missing scope evidence, in addition to the scoped-drill case. A count comparison that is not judged does not erase a failed required test or another merge refusal.

## Implementation notes
<!-- executor appends before finishing -->

Built at `9a20d94` on `task/T-295-s8-drill-scope`, cut from
`634be2de`.

**WHAT A COUNT IS NOW CARRIED WITH.** A count alone says nothing about
what it counted, so `merge.mjs` records a `CountScope` beside every
count it holds and beside every count it reads out of a verdict —
`MergeState` gains `observedScope` and `claimedScope`. A scope is
`whole`, `selection` or `unknown`, and it is read off the EXECUTION
SELECTION on its own side, never off the number: `runSelection` takes
the narrowing tokens out of an argv, `scopeOfRun` wraps one run's
command and argv, `scopeOfSpecs` takes the re-drill's own spec list, and
`joinScopes` unions two runs under one leg. On the verdict's side
`claimedScopes` reads the runner invocation the verdict STATES in
backticks beside its counts, inside the same paragraph and before the
count — the same kind of evidence, an execution selection, rather than
an adjective. A verdict that states no command states no scope, and the
reader invents none.

**THREE ANSWERS WHERE THERE WERE TWO.** `scopeVerdict` answers `same`,
`different` or `unknown`, and `gradeCounts` branches on it. An
established same scope compares exactly as it did and still refuses on a
count that moved. An established difference is reported with both
selections and graded nothing. A scope that could not be read is
reported as NOT JUDGED FOR LACK OF SCOPE EVIDENCE, with both figures
stated so the seat can rule — never as a demonstrated difference, never
as a pass. `countsStep` is exported so a body can read the step's own
exit, and it still refuses on findings alone, so a leg nobody could
judge erases nothing beside it.

**THE COMPARISON IS OVER SELECTIONS, AND THE STEP SAYS SO.** Two
selections that are not equal as sets are called different; the step
prints both rather than claiming they cover different bodies, because
two spellings can resolve to one set. A path-like token is compared on
its last segment, because the two sides spell one spec from different
roots — the drill's runner writes it from the package and a verdict
writes it from the repository root — and a spec basename is unique
across the board that the capabilities census keys on.

**WHAT A WEAKENED VERSION WOULD LET THROUGH, said because this file is
guard class.** The teeth of this guard are `2d6d354`'s: a merge that
commits while the count under it has moved. Those teeth now depend on
scope evidence existing on BOTH sides. A derivation that wrongly called
two same-scope runs different, or a verdict shape that stated no runner
invocation, would leave a real count move unjudged — loud, printed, and
not refused. Two things hold that line. The selection reader fails
CLOSED toward `selection`: a flag it does not recognise is read as a
narrowing, so an unknown run looks narrower than it is and loses a
comparison rather than gaining a false one; it never widens a run into
`whole`. And an unjudged leg is never written into `judged` and never
silences the step's own summary line. What is genuinely given up is
stated rather than hidden: a verdict that names no command is a verdict
whose counts this step will not grade. That is T-295-s3's half of the
work — counts stated in a field rather than in prose — and it is parked
behind T-262.

**HOW FAR THE GUARD REACHES NOW, measured rather than asserted.** Over
`docs/tasks/` at this lane's tip, 112 cards carry a newest verdict, 58
of them claim at least one leg count, and those carry 148 leg claims in
all — of which 39 state a runner invocation beside the count and so
resolve to a scope. The rest would read NOT JUDGED FOR LACK OF SCOPE
EVIDENCE. That reads worse than it is: T-295-s3 already measured that
the merge's own runs produce a count for at most one leg, and those runs
are the re-drill and the dogfood bodies — narrow by construction, which
is the false-comparison case itself. The judgements this removes are
overwhelmingly the wrong ones. The judgements it does not yet gain are
T-295-s3's to deliver.

**THE OWED SET AT THIS TIP** was e2e alone, over eight owning spec
files, derived by `gate-run.mjs --owed-set --range`. The scoped reading
`gate-run.mjs e2e --owning` read 712 passed and 3 failed over 715
bodies. The three are INHERITED, not caused here: the same three bodies
of `push-guard.spec.ts` fail identically with this lane's two files
restored to their `634be2de` content (3 failed, 120 passed), and the
cause is mechanical. The lane fence leaves every out-of-fence tracked
file at mode 444; `seatFixture` copies every flat `docs/*.md` into its
temporary tree, which clones that mode onto the destination, and then
copies the conventions chapter set over it — and the index file is in
both walks, so the second copy of `docs/CONVENTIONS.md` is EACCES.
Reproduced directly: one `copyFileSync` of that file succeeds and
leaves a 444 destination, the next raises EACCES. So those bodies cannot
pass inside ANY fenced lane whose fence excludes `docs/`, and they are
outside this card's fence. Filed as a suggestion rather than fixed here.

**THE GATES, derived from this diff.** GRAPH REGEN fires — a `.ts` moved
outside `docs/` — and the gate itself answers CURRENT at exit 0, so
nothing is owed. BOOT GATE is not owed: nothing under `app/src-tauri`,
`app/src` or either manifest moved. METHOD EVAL GATE is not owed:
nothing under `method/` moved and no citation-grammar line was added.
DOCS GATE fires on this card. The census regeneration this lane's three
new spec names owe belongs to the merge, which plans it.

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 2 — the counts gate compares a scoped drill count with a whole-suite count and refuses a merge on a number that never moved. Not dispatched by this sitting.
