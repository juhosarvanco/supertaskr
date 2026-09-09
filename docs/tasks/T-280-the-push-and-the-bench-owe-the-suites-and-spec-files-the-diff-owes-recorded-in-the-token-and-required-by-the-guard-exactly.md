---
id: T-280
title: The push and the bench owe the suites and the spec files the DIFF owes — derived from the docs gate's reader map and the specs' import graph, recorded in the verdict token, required by the push guard exactly — instead of the four-suite battery on every push
feature: F-06
milestone: 4
size: M
priority: 2
status: verifying
suggested_by: "@human (2026-09-09): \"Yes, file both\" — ruling decision 2 of the seat's review of the outside review (docs/research/the-model-for-an-outside-review-2026-09-09.md); supersedes T-271's second criterion (amended by @human earlier the same day to keep the verifier and the integrator on four legs) by this later ruling"
blocked_by: [T-271]
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, .claude/hooks/push-guard.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/push-guard.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

About a dozen four-suite batteries ran on the integration checkout in
one night of 2026-09-09, roughly 3.5 machine-hours, and twice two
collided on the solo lock. Around half were for commits that moved no
source under any package: dispatch stamps, card promotions, a
checkpoint, a guide page. The rule that costs it is CONVENTIONS' push
bullet — every push owes the four-suite battery, run last — and the
guard that enforces it, `REQUIRED_SUITES` in gate-token.mjs.

The instrument that makes a smaller rule honest already exists in
halves. The docs gate derives which suites read which docs from the
code (`docs-scan.mjs`'s reader map: a card is read by the parser
census and by specific end-to-end specs; a guide page by shell-frame
and window-contract). T-271 derives which end-to-end spec files own a
changed source through the static import graph. What is missing is
the token recording the owed set and the guard requiring it.

The false shortcut is named so nobody takes it: letting CI catch what
the local push skipped makes CI the gate, which is what the push guard
exists to prevent. The safety net here is the derivation, fail-closed.

## Acceptance criteria

- WHEN `gate-run.mjs` is given a range (`--range <base>..<tip>`, the
  push range or a bench's base..tip) THE runner SHALL derive the OWED
  SET: the parser, app and rust suites by the package roots the
  range's paths fall under; the end-to-end suite by the spec files
  that own those paths (T-271's import graph) plus the spec files the
  docs gate's reader map names for every docs path in the range — and
  SHALL grade exactly that set, writing the token with the owed set,
  the range and the inputs the derivation read.
- WHEN the push guard judges a token THE guard SHALL derive the owed
  set for the push range by the same function and require every
  member measured GREEN at the range's tip; a token whose measured set
  does not cover the owed set SHALL be refused with a new reason,
  `token-partial`, naming what is missing — additive to the existing
  reasons, none renamed.
- IF the derivation cannot place a path (a file under no package root,
  a reader the map does not know, a spec whose imports cannot be
  resolved) THEN the owed set SHALL be the whole four-suite battery —
  fail closed, and the token SHALL say why.
- WHEN a bench verifies a lane THE verifier's one run at its tip
  (T-262) SHALL be the owed set for base..tip, not the four legs —
  the bench's report naming the set and its derivation.
- THE derivation SHALL be a function with its own bodies, drilled with
  a DATA mutant: a reader planted in a spec (or a doc read added)
  grows the owed set, and a body asserts it; a hand-listed set
  anywhere is a rejection.
- WHEN CONVENTIONS' push bullet is read THE rule SHALL say the owed
  set, the derivation and the fail-closed case, and SHALL say that CI
  still runs the whole battery after every push; `workflow-parity`
  keeps CI on four legs.
- THE health band for suite seconds SHALL keep reading the whole
  battery (it measures the suite, not the push), and the checkpoint
  SHALL stamp the battery minutes saved for one sitting before and one
  after, with the clock.

## Implementation notes
<!-- executor appends before finishing -->

Built at base `a1bb590`. THE DERIVATION IS ONE FUNCTION AND IT LIVES IN
THE RUNNER, because the runner is the only file that already holds all
three of its inputs: the graded registry, the specs' static import graph
(T-271) and the docs gate's reader map. `deriveOwed` in
`tools/e2e/scripts/gate-run.mjs` is that function, pure over its named
inputs; `owedForRange` is the one place a reading happens.

WHAT COMPOSES, AND WHY NOTHING IS LISTED. `PACKAGE_ROOTS` is
`Object.fromEntries` over the registry's own `cwd` fields, so a graded
suite added without a root is impossible rather than merely discouraged,
and `suiteOfPath` takes the LONGEST prefix so a Rust file inside `app/`
is the rust suite's. The end-to-end half calls T-271's `owningSpecs`
rather than re-implementing it. The docs half calls `docsGate` and
places each READER FILE through the same package roots — which is how a
document read by the parser's census owes the parser suite with nobody
writing that down.

ONE ARM THE CARD DID NOT NAME AND THE PACKAGE ROOTS WOULD HAVE MISSED:
`app/package.json` depends on the parser at `file:../lib/parser`, so a
change under `lib/parser/` can red the APP suite while lying under the
parser's root alone. `packageDependents` reads that edge off the
manifests and closes it transitively; a body plants and removes the
specifier in a scratch tree, so the edge is measured rather than
asserted.

THE ASYMMETRY AGAINST `--owning`, STATED BECAUSE IT LOOKS LIKE A BUG. A
docs path NOTHING reads is PLACED here and UNPLACEABLE there. T-271 asks
"which spec owns this" and "none" is an inability; this asks "what does
this range owe" and the docs gate answering "no code suite reads it" is
a positive answer over a map derived from the whole source corpus. Half
the wasted batteries this card was written about were exactly those
paths, so collapsing the two would have kept the cost the card exists to
remove.

WHY THE RANGE FORM'S VERDICT IS MINTABLE AND THE HAND-TYPED ONE IS NOT.
`--owning` takes a seat's path list, which no second reader checks, so
its verdict keeps `SCOPED-` and mints nothing — unchanged, and a body
still requires that. `--range` derives its list from two commit ids, and
the push guard re-derives the same list from the same two before it
accepts anything, so the end-to-end entry keeps the word it earned and
carries `scope=` naming the spec files it graded. An entry with NO scope
graded the whole leg and covers any subset, which is what makes the
whole arm additive: every token that already exists is still covered.

THE GUARD SPAWNS THE RUNNER RATHER THAN IMPORTING IT. `push-guard.mjs`
loads on every Bash call in a session and may cost node's startup and
nothing else; `gate-run.mjs` walks a corpus. So `runOwedSet` asks the
program that owns the rule with `--owed-set --range <r> --root <root>`,
the way the graph and the cheap checks are already asked, and the ASK
arm answers JSON in both directions so a refusal is machine-readable.
`OWED_SET_FLAGS` is pinned against the runner's own exported constants
by a body, the treatment `REQUIRED_SUITES` already gets.

FAIL CLOSED, AT BOTH BOUNDARIES. Inside the runner: a path under no
package root that no spec reaches and the docs gate cannot place, a
reader the map cannot put in a package, a docs path the gate was never
asked about, an unresolvable import edge — each makes the owed set the
whole battery with the reason recorded. Outside it: no upstream, no
runner in the checkout, a non-zero exit, an unparseable answer, a shape
without the fields the guard reads — each simply does not pass `owed`,
and `judgeToken` then requires exactly what it required before this card.
THE FALLBACK IS SILENT ON PURPOSE: it is stricter than the derivation,
so it leaves nothing unverified, and this guard announces only an allow
that left something unverified. It is also what keeps the ninety-odd
pre-existing push-guard bodies green — none of their fixtures names an
upstream, so all of them exercise the fallback.

THE RANGE RULE IS HELD RATHER THAN QUOTED. `rangeChanged` takes two dots
and CHECKS that the left endpoint is an ancestor of the right, because
`git diff A..B` between divergent tips returns the other side's work in
reverse. Both callers are the shape the rule permits — a push's upstream
is an ancestor of what is being pushed, a lane's base of its tip — so the
check costs nothing and turns the one case that would lie into a refusal.

`token-partial` IS ONE CODE WITH TWO FACES: a suite the range owes that
nothing measured, and a spec file the range owes that the recorded run
did not grade. Both are "the measured set does not cover the owed set",
both name what is missing, and both are cleared by the same one command.
`token-incomplete` keeps its name and its meaning — the whole battery was
required and is not carried — and a body requires all five earlier
reasons to be reachable with an owed set in hand.

POISON DRILL, 4 for 4, each mutant run against the body that owns the
property with the pristine hook passing before and after: fail-closed
removed from `deriveOwed` (kills); `packageDependents` answering no
edges (kills); the end-to-end leg never owed WHOLE (kills); the
spec-coverage half of `token-partial` removed (kills). The DATA mutant
the card asks for is a body rather than a drill: it plants and removes
an `import` statement in a real fixture spec and reads the owed set move
from `{whole: true, specs: []}` to `{whole: false, specs: [owner]}`.

THE FLAG IS `--tree` BECAUSE THE BATTERY SAID SO. The ASK arm needs to
name a checkout that is not the one the runner was loaded from, and the
first spelling was this repository's usual `--root`. The whole battery
redded one body in `cli.spec.ts` — *"every verb that hands its target
--root fronts a script whose own flags carry it"* — which pins the
front's `rootFlag` claim and the target's own flags to each other in
BOTH directions. The body was right and the flag was wrong: `--root`
here means "the project root the target OPERATES ON", and this runner
does not operate on the tree the flag names — it reads the derivation's
INPUTS there and still runs every suite from the registry's own
directories. So the flag was renamed rather than the pin loosened, and
`cli.mjs` (outside this fence, and which would have had to hand `--root`
on every `supertaskr gate`) never needed touching. THAT RED IS ALSO THIS
CARD'S OWN ARGUMENT ARRIVING ON TIME: a cross-spec red, in a spec no
part of this diff names, caught inside the lane's ceremony — and the
owed-set run found it too, because `cli.spec.ts` is one of the 16 spec
files this range owes.

WHAT THIS LANE COULD NOT DO, FILED RATHER THAN DONE. `T-280-s1` — the
derivation cannot see a spec that READS a placed path at runtime, so
`app/package.json` owes the app suite and not `landing-gate.spec.ts`,
which asserts about that file's contents; the class is exactly the paths
the package-root arm CAN place, which is what stops the fail-closed net
catching them. `T-280-s2` — the bench's instruction to run the owed set
and to NAME the set and its derivation belongs in
`method/roles/verifier.md`, which was T-283's armed fence; CONVENTIONS
carries the rule and the role file does not.

OUTSIDE THE FENCE AND OWED AT THE MERGE, said loudly rather than left to
be found: `docs/CAPABILITIES.md` is STALE (committed 69267 bytes, a
fresh generation 71075) because this lane adds 16 test names — the
merge commit owes `npm run capabilities`, per docs/STATE.md's own
hazard. `docs/STATE.md`'s standing hazard still reads *"EVERY PUSH OWES
THE FOUR-SUITE BATTERY, RUN LAST"*, which this card makes false; STATE
is rewritten at every checkpoint and that line is the checkpoint's.
`index --check` is CURRENT at this tip (exit 0, 201 files, 2560 symbols,
2453 edges), so no regen was needed in-lane; GRAPH REGEN still fires at
the merge on the `.ts` in this diff and is the integrator's.


## Verdicts
