---
id: T-332
title: "The docs-input-gate spec costs a CI shard half an hour when it is owed, because its bodies launch the real docs gate against the whole repository again and again: exercise the spellings and the exit combinations over small controlled fixtures, keep representative real-repository checks, and measure the repeated scans before choosing any caching"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: building
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's reading of run 34946192300, verified against shard 4's log"
blocked_by: []
touches: [tools/e2e/tests/docs-input-gate.spec.ts, tools/e2e/scripts/docs-gate.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/cli.mjs, tools/e2e/tests/push-checks.spec.ts, tools/e2e/tests/cli.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding

On the CI run of 2026-09-15 for one amended card, the e2e shard that carried the docs-input-gate spec took 37 minutes while the other three took 3 to 6; 28.7 of those minutes were that spec's bodies. The slowest body, every spelling of one docs path answering the same, took 9.4 minutes on its own; the exit-code matrix, the empty-path-list exit, the unreadable-path line and the advisory scan took 2 to 3.5 minutes each. Each of them launches the real docs gate against the repository, several times per body, and the gate scans the whole tree every time. The spec was not even owed by that push: the correct selection for the range omits it, and it ran only because the planning job had fallen back to the whole battery. When it IS owed, the same cost is paid legitimately.

**THE COST IS PAID ON A CORRECTLY NARROWED PUSH TOO, which the run this card was filed from could not show.** That 2026-09-15 reading was taken where the planning job had fallen back to the whole battery, so this spec was not even owed. On 2026-09-16, run 35030867035 for commit `8f18d0c3` derived 24 of 42 spec files with an empty fallback reason and this spec was legitimately among them. The shard carrying it ran 31m59s while another shard finished in 3m13s, and the run ended when that shard did. **THAT FIGURE IS A SHARD DURATION AND NOT THIS SPEC'S OWN**: the shard also carried the card-preflight, landing-gate, push-checks, session-economics and workflow-parity specs, and no per-spec measurement was taken. Read it as the observed critical-path contribution that motivates the repair. The spec's own duration and its gate-launch count are what the second criterion requires measured, and no saving is claimed before they are — in particular this card does not promise half an hour back, and an earlier draft that said so is withdrawn.

## What would settle it

The spellings and the exit combinations exercised over small controlled fixture repositories, where a scan is milliseconds; a representative set of real-repository integration checks kept, chosen so that the gate's answer over this tree is still pinned; the repeated scans measured (how many launches per body, how long each) before any caching or memoisation is chosen, so the choice is made on figures. The card reports the spec's wall time before and after on one runner shard.

## Acceptance criteria

- WHEN a body exercises a spelling of a docs path or a combination of the gate's exit codes THE body SHALL run the gate over a small controlled fixture repository, and the real repository SHALL be scanned only by a representative set of integration bodies named as such.
- WHEN this card lands THE card SHALL record the number of gate launches per body and the spec's wall time on one runner shard before and after, and SHALL choose caching or memoisation only on those figures.
- WHEN a body is kept in the representative real-repository set THE card SHALL record what integration risk against the CURRENT repository that body covers and why the chosen representative set is sufficient, so the set is justified by its coverage rather than by its label.

## Implementation notes

**THE FENCE TOOK A SIXTH PATH ON 2026-09-17, AND IT IS THIS CARD'S OWN
SHADOW.** `tools/e2e/tests/cli.spec.ts` was granted for one body and one
reason. `cli.spec.ts`'s installed-copy body — "npx supertaskr runs out of
a packed tarball installed into a project that is not this repository" —
drove `docs-gate` BY NAME as its example of a verb whose script resolves
its own root. This card gives `docs-gate` a `--root <checkout>` flag, so
that verb LEFT the class: the CLI stops refusing it on the root ground and
gets one step further, to a dependency an installed copy has not got. Exit
3 and the project's path are unchanged; only the sentence moved, and the
sentence the body checked for was about the limitation this card removes.

**THE HARD-CODED VERB IS THE DEFECT, NOT THE EXPECTATION.** The body picks
one verb by name to stand for a CLASS the registry defines, and the class
is still populated: of the ten verbs declaring `rootFlag: false`, seven
carry a `target` of kind `script` — `gate`, `capabilities`, `health`,
`tokens`, `boot`, `orphan-drill`, `session`. So the example is derived
from the registry rather than typed, with a floor asserting that set is
non-empty, because an empty class would agree with everything. The
expectation is NOT widened to accept either refusal shape: that would
weaken a body whose whole point is that an installed copy refuses with a
sentence rather than a stack trace.

The lane raised this as an ask, wrote the repair as text without touching
the file, and parked; the seat granted the path only after T-344's lane
closed, because that card's fence held `cli.spec.ts` and two live lanes
may not hold one path.


## The fence widened by two paths, 2026-09-17, during the lane

Both are caused by this card's own repair and both were verified against
the tree before the seat granted them.

`tools/e2e/scripts/cli.mjs` — the repair gives `docs-gate.mjs` a `--root`
flag, and the CLI registry's `docs-gate` entry still declares `rootFlag:
false`. A body checks the registry's claim against the target script's own
flags IN BOTH DIRECTIONS, so the declaration is now false and the body is
right to red. The truthful value is `true`, and the registry carries no
spelling for "the target takes the flag and this verb does not pass it".

THE BEHAVIOURAL CONSEQUENCE IS NAMED RATHER THAN BURIED, because it
reaches past this card's subject: `supertaskr docs-gate` will hand the
resolved project root to the script. Inside this repository that root IS
the script's own repository, so the run is unchanged — the lane measured
that equality path deliberately. From an INSTALLED copy the verb starts
working on the project instead of answering about the tooling's own
checkout, which is the limitation `cli.mjs`'s own comment already names.
That is a fix rather than a regression, and it is declared here so a
verifier grades it as surface this card knowingly moved.

`tools/e2e/tests/push-checks.spec.ts` — one anchor string. A body pins the
shared derivation's CALL SITE by its literal text so the docs gate and the
push checks cannot disagree about the tie. The call is unmoved and still
the shared derivation; only its argument changes, because the gate now
judges the root it was given. Three anchors of the same shape inside this
card's own spec were re-pointed in the lane; this is the fourth and it sat
outside the fence.

WHAT WAS REFUSED: `tools/e2e/tests/push-guard.spec.ts`. Its three reds are
T-333, already filed, and are not this card's to repair — see the finding
recorded against that card.

## Verdicts
